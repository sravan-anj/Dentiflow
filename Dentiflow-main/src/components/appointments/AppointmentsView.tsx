import React, { useState } from 'react';
import { Appointment, Patient, User, AppointmentStatus } from '../../types';
import { useToast } from '../common/Toast';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Filter,
  UserCheck,
  Sparkles,
  MapPin,
  AlertCircle,
  CalendarCheck,
  ChevronRight,
  Check,
  FileText,
  PhoneCall,
  Smile,
  ShieldCheck
} from 'lucide-react';

interface AppointmentsViewProps {
  currentUser: User;
  appointments: Appointment[];
  patients: Patient[];
  onSaveAppointments: (appointments: Appointment[]) => void;
  onSelectPatient: (patientId: string) => void;
  onNavigateToChart: () => void;
  isBookingModalOpen: boolean;
  setIsBookingModalOpen: (open: boolean) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  currentUser,
  appointments,
  patients,
  onSaveAppointments,
  onSelectPatient,
  onNavigateToChart,
  isBookingModalOpen,
  setIsBookingModalOpen
}) => {
  const { showToast } = useToast();
  const isPatient = currentUser.role === 'patient';
  const currentPatient = isPatient
    ? patients.find(p => p.id === (currentUser.patientId || 'p-1')) || patients[0]
    : null;

  const [patientSubTab, setPatientSubTab] = useState<'upcoming' | 'history'>('upcoming');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Appointment Form State
  const [newPatientId, setNewPatientId] = useState(patients[0]?.id || '');
  const [newDoctorName, setNewDoctorName] = useState('Dr. Ananya Sharma');
  const [newChair, setNewChair] = useState('Chair 1 - Endodontics');
  const [newDate, setNewDate] = useState('2026-09-19');
  const [newTime, setNewTime] = useState('12:00 PM');
  const [newDuration, setNewDuration] = useState(45);
  const [newProcedure, setNewProcedure] = useState('Dental Examination & Assessment');
  const [newNotes, setNewNotes] = useState('');

  const filteredAppointments = appointments.filter(apt => {
    if (filterDoctor !== 'all' && apt.doctorName !== filterDoctor) return false;
    if (filterStatus !== 'all' && apt.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        apt.patientName.toLowerCase().includes(q) ||
        apt.procedure.toLowerCase().includes(q) ||
        apt.chair.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpdateStatus = (id: string, newStatus: AppointmentStatus) => {
    const updated = appointments.map(a =>
      a.id === id ? { ...a, status: newStatus } : a
    );
    onSaveAppointments(updated);
    showToast(`Appointment status updated to ${newStatus.replace('_', ' ')}`, 'success');
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === newPatientId) || patients[0];
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      doctorName: newDoctorName,
      doctorId: 'u-doctor',
      chair: newChair,
      date: newDate,
      time: newTime,
      durationMinutes: newDuration,
      procedure: newProcedure,
      status: 'confirmed',
      tokenNumber: `#D-${Math.floor(100 + Math.random() * 900)}`,
      notes: newNotes
    };

    onSaveAppointments([newApt, ...appointments]);
    setIsBookingModalOpen(false);
    showToast(`Booked appointment for ${patient.name} with ${newDoctorName}`, 'success');
  };

  const patientAppointments = appointments.filter(
    a => a.patientId === (currentPatient?.id || 'p-1')
  );
  const upcomingPatientApts = patientAppointments.filter(
    a => a.status !== 'completed' && a.status !== 'cancelled'
  );
  const historyPatientApts = patientAppointments.filter(
    a => a.status === 'completed' || a.status === 'cancelled'
  );

  const handleAddToCalendar = (apt: Appointment) => {
    showToast(`Event "${apt.procedure}" exported to your calendar`, 'success');
  };

  const handleRequestReschedule = (apt: Appointment) => {
    showToast(`Reschedule requested for ${apt.time}. Clinic reception will call you within 15 mins.`, 'info');
  };

  // -------------------------------------------------------------
  // PATIENT VIEW: Dedicated, Level 10 Patient Appointments Portal
  // -------------------------------------------------------------
  if (isPatient && currentPatient) {
    return (
      <div className="space-y-6">
        {/* Top Header Banner matching Main UI */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-extrabold uppercase tracking-wider mb-1.5 border border-[#C8B58D]/30 shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#C8B58D]" />
              <span>Patient Care Schedule &bull; Record {currentPatient.code}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#252525] tracking-tight">
              My Appointments &amp; Visits
            </h1>
            <p className="text-xs text-[#6F6D69]">
              Review upcoming clinical appointments, chair allocations, visit history, and preparation instructions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
            <button
              onClick={onNavigateToChart}
              className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#C8B58D]" />
              <span>Odontogram</span>
            </button>
          </div>
        </div>

        {/* 4 Patient KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6F6D69]">Upcoming Visits</span>
              <span className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
                <CalendarCheck className="w-4 h-4 text-[#C8B58D]" />
              </span>
            </div>
            <p className="text-2xl font-black text-[#252525]">{upcomingPatientApts.length}</p>
            <p className="text-[11px] text-[#6F6D69] font-semibold mt-1">
              {upcomingPatientApts[0] ? `Next: ${upcomingPatientApts[0].date} at ${upcomingPatientApts[0].time}` : 'No upcoming visits'}
            </p>
          </div>

          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6F6D69]">Primary Clinician</span>
              <span className="p-2 rounded-xl bg-[#EDE8DE] text-[#252525]">
                <Stethoscope className="w-4 h-4 text-[#C8B58D]" />
              </span>
            </div>
            <p className="text-lg font-black text-[#252525]">Dr. Ananya Sharma</p>
            <p className="text-[11px] text-[#6F6D69] font-semibold mt-1">Endodontics &amp; Restorative</p>
          </div>

          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6F6D69]">Completed Visits</span>
              <span className="p-2 rounded-xl bg-[#8FA88D]/20 text-[#3B4D3A]">
                <CheckCircle2 className="w-4 h-4 text-[#8FA88D]" />
              </span>
            </div>
            <p className="text-2xl font-black text-[#252525]">{historyPatientApts.length}</p>
            <p className="text-[11px] text-[#3B4D3A] font-semibold mt-1">Clinical records archived</p>
          </div>

          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6F6D69]">Assigned Operatory</span>
              <span className="p-2 rounded-xl bg-[#C5A66A]/20 text-[#594723]">
                <MapPin className="w-4 h-4 text-[#C5A66A]" />
              </span>
            </div>
            <p className="text-lg font-black text-[#252525]">Chair 1 &bull; Suite 101</p>
            <p className="text-[11px] text-[#594723] font-semibold mt-1">Equipped with 3D Scanner</p>
          </div>
        </div>

        {/* Sub-tabs: Upcoming vs History */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
          <button
            onClick={() => setPatientSubTab('upcoming')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
              patientSubTab === 'upcoming'
                ? 'btn-primary text-[#252525] shadow-xs'
                : 'btn-secondary text-[#252525]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming Visits ({upcomingPatientApts.length})</span>
          </button>
          <button
            onClick={() => setPatientSubTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
              patientSubTab === 'history'
                ? 'btn-primary text-[#252525] shadow-xs'
                : 'btn-secondary text-[#252525]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Past Completed Visits ({historyPatientApts.length})</span>
          </button>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {(patientSubTab === 'upcoming' ? upcomingPatientApts : historyPatientApts).length === 0 ? (
            <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-8 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE8DE] text-[#252525] flex items-center justify-center mx-auto mb-3 border border-[#C8B58D]/30">
                <Calendar className="w-6 h-6 text-[#C8B58D]" />
              </div>
              <h3 className="text-sm font-bold text-[#252525]">
                {patientSubTab === 'upcoming' ? 'No Upcoming Visits Scheduled' : 'No Past Visits on Record'}
              </h3>
              <p className="text-xs text-[#6F6D69] mt-1 max-w-sm mx-auto">
                {patientSubTab === 'upcoming'
                  ? 'Would you like to book your next routine checkup, scale & polish, or treatment follow-up?'
                  : 'Completed appointment records will appear here after clinical treatment.'}
              </p>
              {patientSubTab === 'upcoming' && (
                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="mt-4 btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Book Appointment Now</span>
                </button>
              )}
            </div>
          ) : (
            (patientSubTab === 'upcoming' ? upcomingPatientApts : historyPatientApts).map(apt => (
              <div
                key={apt.id}
                className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs transition hover:border-[#C8B58D]"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-extrabold uppercase tracking-wider border border-[#C8B58D]/30">
                        {apt.chair}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        apt.status === 'in_chair'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse'
                          : apt.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : apt.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {apt.status === 'in_chair' ? 'Currently In Chair' : apt.status.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        Token: {apt.tokenNumber || '#D-342'}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900">
                      {apt.procedure}
                    </h3>

                    <p className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-900">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span>{apt.date} at {apt.time} ({apt.durationMinutes || 45} mins)</span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                        <span>{apt.doctorName}</span>
                      </span>
                    </p>

                    <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 text-xs text-slate-600">
                      <strong className="text-slate-800">Preparation &amp; Care Guidance: </strong>
                      {apt.notes || 'Please arrive 10 minutes prior to your time. Operatory has been sterilized with medical-grade autoclave. Bring any list of ongoing medications.'}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleAddToCalendar(apt)}
                      className="flex-1 md:flex-none px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>Add to Calendar</span>
                    </button>
                    {apt.status !== 'completed' && (
                      <button
                        onClick={() => handleRequestReschedule(apt)}
                        className="flex-1 md:flex-none px-3.5 py-2 bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reschedule</span>
                      </button>
                    )}
                    <button
                      onClick={onNavigateToChart}
                      className="flex-1 md:flex-none px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-bold transition border border-sky-200 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                      <span>Odontogram</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Preparation Guidelines Card */}
        <div className="bg-gradient-to-r from-sky-50 to-blue-50/60 border border-sky-200/80 rounded-2xl p-5 shadow-xs text-xs text-slate-700">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sky-950 text-sm">Oralix Clinical Standards &amp; Safety Protocol</h4>
              <p className="mt-1 leading-relaxed text-slate-600">
                All operatory chairs undergo ISO-certified surgical sterilization between patient sittings. If you experience unexpected tooth pain, cold sensitivity, or swelling prior to your appointment, please contact the clinic reception immediately at <span className="font-bold text-sky-900">+91 98765 43210</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Book Appointment Modal */}
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Book Dental Appointment</h2>
                  <p className="text-xs text-slate-500">Patient: {currentPatient.name} ({currentPatient.code})</p>
                </div>
                <button
                  onClick={() => setIsBookingModalOpen(false)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Doctor *
                    </label>
                    <select
                      value={newDoctorName}
                      onChange={e => setNewDoctorName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Dr. Ananya Sharma">Dr. Ananya Sharma (Endodontics)</option>
                      <option value="Dr. Vikram Mehta">Dr. Vikram Mehta (Surgery &amp; Implants)</option>
                      <option value="Dr. Priya Sen">Dr. Priya Sen (Aesthetics &amp; Ortho)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Operatory Chair *
                    </label>
                    <select
                      value={newChair}
                      onChange={e => setNewChair(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Chair 1 - Endodontics">Chair 1 - Endodontics</option>
                      <option value="Chair 2 - Surgery">Chair 2 - Surgery</option>
                      <option value="Chair 3 - Aesthetics & Hygiene">Chair 3 - Hygiene</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      required
                      className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Time *
                    </label>
                    <input
                      type="text"
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      placeholder="10:30 AM"
                      required
                      className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Duration
                    </label>
                    <select
                      value={newDuration}
                      onChange={e => setNewDuration(Number(e.target.value))}
                      className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                    >
                      <option value={15}>15 mins</option>
                      <option value={30}>30 mins</option>
                      <option value={45}>45 mins</option>
                      <option value={60}>60 mins</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Procedure / Reason for Visit *
                  </label>
                  <input
                    type="text"
                    value={newProcedure}
                    onChange={e => setNewProcedure(e.target.value)}
                    placeholder="e.g. Tooth #16 Zirconia Crown Delivery"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notes for Doctor
                  </label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    placeholder="Any sensitivity or special requests..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Confirm Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            SCHEDULE &bull; OPERATORY QUEUE
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Appointments
          </h1>
          <p className="text-xs text-gray-500">
            Coordinate every chair, clinician, and patient seamlessly.
          </p>
        </div>

        {currentUser.role !== 'admin' && currentUser.role !== 'doctor' && (
          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500">Total Visits Scheduled</div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{appointments.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500">In Chair / In Progress</div>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {appointments.filter(a => a.status === 'in_chair').length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500">Confirmed</div>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {appointments.filter(a => a.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-xs font-semibold text-gray-500">Completed Today</div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {appointments.filter(a => a.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search patient, procedure, chair..."
            className="w-full text-xs bg-transparent focus:outline-none text-gray-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filterDoctor}
              onChange={e => setFilterDoctor(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 text-gray-700"
            >
              <option value="all">All Doctors</option>
              <option value="Dr. Ananya Sharma">Dr. Ananya Sharma</option>
              <option value="Dr. Vikram Mehta">Dr. Vikram Mehta</option>
              <option value="Dr. Priya Sen">Dr. Priya Sen</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 text-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_chair">In Chair</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List / Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Time &amp; Token</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Doctor &amp; Operatory Chair</th>
                <th className="py-3 px-4">Procedure</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No appointments matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{apt.time}</div>
                      <div className="text-[10px] text-gray-400 font-medium">
                        {apt.tokenNumber || '#D-000'} &bull; {apt.date}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          onSelectPatient(apt.patientId);
                          onNavigateToChart();
                        }}
                        className="font-bold text-blue-600 hover:underline text-left cursor-pointer"
                      >
                        {apt.patientName}
                      </button>
                      <div className="text-[10px] text-gray-400">
                        {apt.durationMinutes} mins allocated
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{apt.doctorName}</div>
                      <div className="text-[10px] text-gray-500">{apt.chair}</div>
                    </td>

                    <td className="py-3 px-4 max-w-[220px]">
                      <div className="font-medium text-gray-900 truncate">
                        {apt.procedure}
                      </div>
                      {apt.notes && (
                        <div className="text-[10px] text-gray-400 truncate">
                          {apt.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        apt.status === 'in_chair'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : apt.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : apt.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {apt.status === 'in_chair' ? 'In Chair Now' : apt.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {apt.status !== 'in_chair' && apt.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'in_chair')}
                            className="px-2 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition cursor-pointer"
                          >
                            To Chair
                          </button>
                        )}
                        {apt.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'completed')}
                            className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition cursor-pointer"
                          >
                            Complete
                          </button>
                        )}
                        {apt.status !== 'cancelled' && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Cancel appointment"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal - Patient Context Only */}
      {isBookingModalOpen && isPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Schedule New Appointment</h2>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Patient *
                </label>
                <select
                  value={newPatientId}
                  onChange={e => setNewPatientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) - {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Doctor *
                  </label>
                  <select
                    value={newDoctorName}
                    onChange={e => setNewDoctorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Dr. Ananya Sharma">Dr. Ananya Sharma (Endodontics)</option>
                    <option value="Dr. Vikram Mehta">Dr. Vikram Mehta (Surgery)</option>
                    <option value="Dr. Priya Sen">Dr. Priya Sen (Aesthetics & Ortho)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Operatory Chair *
                  </label>
                  <select
                    value={newChair}
                    onChange={e => setNewChair(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Chair 1 - Endodontics">Chair 1 - Endodontics</option>
                    <option value="Chair 2 - Surgery">Chair 2 - Surgery</option>
                    <option value="Chair 3 - Aesthetics & Hygiene">Chair 3 - Aesthetics</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    placeholder="10:30 AM"
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Duration (mins)
                  </label>
                  <select
                    value={newDuration}
                    onChange={e => setNewDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Procedure / Reason for Visit *
                </label>
                <input
                  type="text"
                  value={newProcedure}
                  onChange={e => setNewProcedure(e.target.value)}
                  placeholder="e.g. Tooth #16 Root Canal Preparation"
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Clinical Pre-visit Notes / Precautions
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="e.g. Check blood pressure before local anesthetic..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-2xs cursor-pointer"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
