import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { 
  Search, 
  Filter, 
  Star, 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  Award, 
  ChevronRight,
  Stethoscope,
  Activity
} from 'lucide-react';

export const DoctorsListPage = ({ onSelectDoctor }) => {
  const toast = useToast();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  const specialties = ['All', 'Cardiology', 'Neurology', 'Dermatology', 'Orthopedics', 'Pediatrics'];

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedSpecialty !== 'All') params.specialization = selectedSpecialty;
      
      const res = await api.get('/doctors', { params });
      setDoctors(res.data);
    } catch (err) {
      toast.error('Failed to load specialists directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            <span>Certified Medical Specialists</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">
            Find Your Doctor
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Book consultations with immediate slot locking &amp; AI-assisted triage
          </p>
        </div>

        {/* Search & Specialty Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor or keyword..."
              className="bg-[#13082a] border border-purple-900/60 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-full sm:w-64"
            />
          </form>

          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="bg-[#13082a] border border-purple-900/60 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            {specialties.map((spec) => (
              <option key={spec} value={spec} className="bg-[#13082a] text-white">
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Specialty Filter Pills */}
      <div className="flex flex-wrap gap-2 pt-2">
        {specialties.map((spec) => (
          <button
            key={spec}
            onClick={() => setSelectedSpecialty(spec)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedSpecialty === spec
                ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-purple-950/40 border border-purple-900/60 text-purple-300 hover:border-purple-600/60'
            }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl animate-pulse h-64 border border-purple-900/40" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <Activity className="w-10 h-10 text-purple-400 mx-auto opacity-50" />
          <h3 className="text-lg font-bold text-white font-['Outfit']">No Specialists Found</h3>
          <p className="text-sm text-slate-400">Try adjusting your search query or specialty filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => {
            const docUser = doc.user || {};
            return (
              <div
                key={doc.id}
                className="glass-panel glass-panel-hover p-6 rounded-2xl border border-purple-900/40 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Doctor Info */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-900 to-cyan-500 p-0.5 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                        <div className="w-full h-full bg-[#0e0520] rounded-[10px] flex items-center justify-center font-bold text-purple-300 text-lg">
                          {docUser.full_name ? docUser.full_name.charAt(3) || 'D' : 'D'}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                          {docUser.full_name || 'Specialist Doctor'}
                        </h3>
                        <Badge variant="primary" size="sm" className="mt-0.5">
                          {doc.specialization}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-lg text-amber-300 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{doc.rating || 4.9}</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-300 mt-4 line-clamp-3 leading-relaxed">
                    {doc.bio || 'Experienced certified physician dedicated to comprehensive patient care and diagnosis.'}
                  </p>

                  {/* Key Metadata */}
                  <div className="mt-6 pt-4 border-t border-purple-950/80 grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>{doc.slot_duration_minutes} min slots</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Award className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{doc.experience_years} yrs exp</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{doc.room_number || 'Main Clinic'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>${doc.consultation_fee} Fee</span>
                    </div>
                  </div>
                </div>

                {/* Booking Button */}
                <button
                  onClick={() => onSelectDoctor(doc)}
                  className="mt-6 w-full gradient-btn py-2.5 rounded-xl font-semibold text-white text-xs flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Consultation</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
