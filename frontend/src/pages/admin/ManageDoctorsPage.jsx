import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Clock, 
  DollarSign, 
  MapPin, 
  Star, 
  X, 
  Check, 
  Stethoscope,
  Activity
} from 'lucide-react';

export const ManageDoctorsPage = () => {
  const toast = useToast();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    specialization: 'Cardiology',
    bio: '',
    consultation_fee: 100.0,
    slot_duration_minutes: 30,
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    working_days: 'Mon,Tue,Wed,Thu,Fri',
    room_number: 'Room 301',
    experience_years: 8,
  });

  const [saving, setSaving] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data);
    } catch (err) {
      toast.error('Failed to load doctors list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedDoctorId(null);
    setFormData({
      full_name: '',
      email: '',
      password: '',
      phone: '',
      specialization: 'Cardiology',
      bio: '',
      consultation_fee: 100.0,
      slot_duration_minutes: 30,
      working_hours_start: '09:00',
      working_hours_end: '17:00',
      working_days: 'Mon,Tue,Wed,Thu,Fri',
      room_number: 'Room 301',
      experience_years: 8,
    });
    setShowModal(true);
  };

  const openEditModal = (doc) => {
    setIsEditing(true);
    setSelectedDoctorId(doc.id);
    setFormData({
      full_name: doc.user?.full_name || '',
      email: doc.user?.email || '',
      password: '',
      phone: doc.user?.phone || '',
      specialization: doc.specialization,
      bio: doc.bio || '',
      consultation_fee: doc.consultation_fee,
      slot_duration_minutes: doc.slot_duration_minutes,
      working_hours_start: doc.working_hours_start?.slice(0, 5) || '09:00',
      working_hours_end: doc.working_hours_end?.slice(0, 5) || '17:00',
      working_days: doc.working_days,
      room_number: doc.room_number || '',
      experience_years: doc.experience_years,
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/admin/doctors/${selectedDoctorId}`, {
          specialization: formData.specialization,
          bio: formData.bio,
          consultation_fee: parseFloat(formData.consultation_fee),
          slot_duration_minutes: parseInt(formData.slot_duration_minutes),
          working_hours_start: formData.working_hours_start + ':00',
          working_hours_end: formData.working_hours_end + ':00',
          working_days: formData.working_days,
          room_number: formData.room_number,
          experience_years: parseInt(formData.experience_years),
        });
        toast.success('Doctor profile updated successfully.');
      } else {
        await api.post('/admin/doctors', {
          ...formData,
          consultation_fee: parseFloat(formData.consultation_fee),
          slot_duration_minutes: parseInt(formData.slot_duration_minutes),
          working_hours_start: formData.working_hours_start + ':00',
          working_hours_end: formData.working_hours_end + ':00',
          experience_years: parseInt(formData.experience_years),
        });
        toast.success(`Specialist Doctor created with login credentials!`);
      }
      setShowModal(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to remove this doctor profile?')) return;
    try {
      await api.delete(`/admin/doctors/${doctorId}`);
      toast.success('Doctor removed from platform.');
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete doctor.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Staff Administration</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">
            Manage Specialist Doctors
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Provision physician profiles, adjust working slot parameters, and set clinic rooms
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="gradient-btn px-6 py-2.5 rounded-xl font-semibold text-white text-xs flex items-center gap-2 self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Specialist Doctor</span>
        </button>
      </div>

      {/* Doctors Table */}
      <div className="glass-panel rounded-2xl border border-purple-900/50 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-purple-950/40 rounded-xl animate-pulse" />)}
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No doctors found. Click above to provision the first specialist.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0318] border-b border-purple-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Physician Name</th>
                  <th className="px-6 py-4">Specialization</th>
                  <th className="px-6 py-4">Hours &amp; Slots</th>
                  <th className="px-6 py-4">Fee</th>
                  <th className="px-6 py-4">Room</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/60 text-slate-300">
                {doctors.map((doc) => {
                  const u = doc.user || {};
                  return (
                    <tr key={doc.id} className="hover:bg-purple-950/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-700 flex items-center justify-center font-bold text-purple-300">
                            {u.full_name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <div>{u.full_name || 'Doctor'}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="primary" size="sm">{doc.specialization}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-slate-200">
                          {doc.working_hours_start?.slice(0, 5)} - {doc.working_hours_end?.slice(0, 5)}
                        </div>
                        <div className="text-[11px] text-slate-400">{doc.slot_duration_minutes}m slots • {doc.working_days}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-400">
                        ${doc.consultation_fee}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {doc.room_number || 'Room 101'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(doc)}
                          className="p-1.5 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 hover:text-white"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(doc.id)}
                          className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-900 text-rose-300 hover:text-rose-100"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="max-w-2xl w-full glass-panel p-6 sm:p-8 rounded-3xl border border-purple-600/40 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-purple-950">
              <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-purple-400" />
                <span>{isEditing ? 'Edit Doctor Profile' : 'Add New Specialist Doctor'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Doctor Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    disabled={isEditing}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Dr. Arthur Pendelton"
                    required
                    className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Doctor Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled={isEditing}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="dr.arthur@healthsync.care"
                    required
                    className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  />
                </div>

                {!isEditing && (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Login Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="DoctorPassword123!"
                      required
                      minLength={6}
                      className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Specialization *</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="E.g., Cardiology, Endocrinology"
                    required
                    className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Consultation Fee ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                    className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Slot Duration (Minutes)</label>
                  <input
                    type="number"
                    value={formData.slot_duration_minutes}
                    onChange={(e) => setFormData({ ...formData, slot_duration_minutes: e.target.value })}
                    className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Shift Start Time (HH:MM)</label>
                  <input
                    type="time"
                    value={formData.working_hours_start}
                    onChange={(e) => setFormData({ ...formData, working_hours_start: e.target.value })}
                    className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Shift End Time (HH:MM)</label>
                  <input
                    type="time"
                    value={formData.working_hours_end}
                    onChange={(e) => setFormData({ ...formData, working_hours_end: e.target.value })}
                    className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Clinic Room / Suite</label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    placeholder="Suite 305B"
                    className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                    className="w-full bg-[#120627] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Professional Bio</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Doctor's background, clinical fellowship, areas of expertise..."
                  className="w-full bg-[#120627] border border-purple-900/60 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-950">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="gradient-btn px-6 py-2.5 rounded-xl font-bold text-white disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Doctor Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
