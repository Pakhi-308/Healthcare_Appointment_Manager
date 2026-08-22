# System Design & Architecture Specification

## 1. Concurrency Control & Double-Booking Prevention
In high-throughput clinical scheduling systems, race conditions during simultaneous booking attempts represent a critical point of failure. HealthSync prevents double-booking through a multi-layered concurrency fence spanning application-level hold tokens and database transaction isolation:

- **Database-Level Pessimistic Locking:** During booking transactions on relational engines (MySQL/PostgreSQL), the booking query executes `SELECT ... FOR UPDATE` on the requested doctor and slot datetime. This forces concurrent transactions on the same doctor/slot partition to queue rather than interleaving reads.
- **Engine-Level Composite Unique Constraint:** The `appointments` table enforces a strict database constraint:
  $$\text{UNIQUE}(\texttt{doctor\_id}, \texttt{slot\_start})$$
  This guarantees that even under millisecond-level simultaneous commit attempts across distributed workers, exactly one insertion succeeds at the storage layer while the conflicting transaction triggers an `IntegrityError`.
- **Conflict Handling:** The booking service catches database uniqueness violations and immediately rolls back the failed transaction, returning an `HTTP 409 Conflict` with clear re-selection guidance to the patient.

```
[Patient A & Patient B Attempt Same Slot]
           |
   [DB Transaction Start]
           |
   [Pessimistic Lock: SELECT ... FOR UPDATE]
           |
   +-------+-------+
   |               |
[Patient A Wins] [Patient B Collides]
   |               |
[Commit DB]     [Unique Constraint Trip -> 409 Conflict]
```

---

## 2. Temporary Slot Hold Mechanism
To protect the patient experience while they fill in the pre-visit symptom intake questionnaire (which takes 2–5 minutes), HealthSync implements an expiring reservation lock:

1. **Hold Acquisition:** When a patient selects an available time slot, `POST /doctors/{id}/holds` generates an unguessable UUID token (`hold_token`) and inserts a record in `slot_holds` with a TTL timestamp set to $\text{now}() + 10\text{ minutes}$.
2. **Availability Filtering:** Real-time slot availability computations evaluate both confirmed bookings and unexpired active holds ($\texttt{expires\_at} > \text{now}() \text{ AND } \texttt{status} = \text{'held'}$). Other patients see the slot flagged as "Held" with a countdown timer, preventing concurrent hold creation.
3. **Atomic Conversion / Expiration:** When the patient submits the completed symptom form, the `hold_token` is converted to `CONVERTED` within the atomic booking transaction. If the 10-minute window elapses before submission, an APScheduler background job transitions the hold state to `EXPIRED`, immediately freeing the slot for other patients.

---

## 3. Doctor Leave Conflict Handling
When a medical practitioner or administrator marks a doctor on leave for date $D$, existing appointments must be safely resolved without manual clinic overhead:

1. **Atomic Cancellation:** In a single database transaction, the leave service inserts the `doctor_leaves` record and queries all active appointments scheduled between $D\text{ 00:00}$ and $D\text{ 23:59}$.
2. **Status Transition:** All matching appointments transition atomically to $\texttt{status} = \text{'cancelled'}$ with $\texttt{cancel\_reason} = \text{"Doctor on Leave: <reason>"}$.
3. **Automated Priority Rebooking & Calendar Cleanup:**
   - A unique cryptographic voucher ($\texttt{rebooking\_token}$) is attached to each cancelled appointment.
   - Associated Google Calendar events and Google Meet links are deleted via Google Calendar API.
   - An automated priority rebooking email is queued to each affected patient containing a 1-click rebooking link to select a new slot with Dr. [Doctor] or an alternative specialist.

---

## 4. Notification Failure Handling & Retry Strategy
Delivery of booking confirmations, doctor leave notices, and medication reminders is critical. HealthSync decouples email dispatch from request latency using an audited, resilient queue:

1. **Audit Logging:** Every outbound email is first persisted in the `notifications` table with status `PENDING` before network transmission.
2. **Immediate Delivery & State Transition:** The email worker attempts delivery via SMTP. On success, status becomes `SENT` with timestamp $\texttt{sent\_at}$. On network timeout, SMTP rate-limiting, or server failure, status transitions to `FAILED`, recording the raw error trace and initializing $\texttt{retry\_count} = 0$.
3. **Background Worker with Exponential Backoff:** An APScheduler background job polls `notifications` where $\texttt{status} = \text{'failed'} \text{ AND } \texttt{retry\_count} < 5$. Retries execute with exponential backoff intervals ($2^{n}$ minutes: 2m, 4m, 8m, 16m, 32m).
4. **Admin Dead-Letter Queue & Manual Override:** Dispatches exceeding 5 failures are retained in an admin audit queue. Administrators can inspect failure reasons and trigger immediate retries via the portal dashboard.
