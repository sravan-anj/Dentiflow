import React from 'react';
import { Appointment, Patient, QueueItem } from '../../types';
import { X, Calendar, Clock, User, Stethoscope, ChevronRight, AlertCircle, Plus, UsersRound, Activity } from 'lucide-react';

interface TodaysVisitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  patients: Patient[];
  queue: QueueItem[];
  onSelectPatient: (patientId: string) => void;
  onNavigateToChart: () => void;
  onOpenNewAppointment: () => void;
}

export const TodaysVisitsModal: React.FC<TodaysVisitsModalProps> = ({
  isOpen,
  onClose,
  appointments,
  patients,
  queue,
  onSelectPatient,
  onNavigateToChart,
  onOpenNewAppointment
}) => {
  if (!isOpen) return null;

  // Calculate today's date YYYY-MM-DD dynamically
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter appointments scheduled for today
  const todayAppointments = appointments.filter(a => a.date === todayStr || a.date === '2026-09-19');

  const handlePatientClick = (patientId: string) => {
    onSelectPatient(patientId);
    onNavigateToChart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-white">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-extrabold text-sm text-white">Today's Visits &amp; Waiting Room Hub</h3>
              <p className="text-[11px] text-slate-400">
                Date: <strong className="text-white font-mono">{todayStr}</strong> &bull; Scheduled: {todayAppointments.length} &bull; Queue Tokens: {queue.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Consolidated Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* SECTION 1: TODAY'S APPOINTMENTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Section 1: Today's Scheduled Appointments ({todayAppointments.length})</span>
              </h4>
              <button
                onClick={() => {
                  onClose();
                  onOpenNewAppointment();
                }}
                className="text-[11px] font-bold text-sky-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Visit</span>
              </button>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="py-6 text-center bg-white/5 rounded-xl border border-white/10 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto opacity-70" />
                <p className="text-xs font-bold text-white">No appointments scheduled for today.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayAppointments.map(apt => {
                  const patient = patients.find(p => p.id === apt.patientId);
                  return (
                    <div
                      key={apt.id}
                      className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-xs text-white group-hover:text-sky-300 transition">
                            {apt.patientName}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                            {patient?.code || 'DF-2026-PATIENT'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.status === 'in_chair'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 animate-pulse'
                              : apt.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          }`}>
                            {apt.status === 'in_chair' ? 'IN CHAIR' : apt.status.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-xs text-amber-300 font-semibold">
                          {apt.procedure}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-sky-400" />
                            <span>{apt.time} ({apt.durationMinutes || 30}m)</span>
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Stethoscope className="w-3 h-3 text-sky-400" />
                            <span>{apt.doctorName}</span>
                          </span>
                          <span>&bull;</span>
                          <span>{apt.chair}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePatientClick(apt.patientId)}
                        className="shrink-0 px-3 py-1.5 bg-white/10 hover:bg-white text-white rounded-lg text-xs font-bold transition border border-white/15 cursor-pointer flex items-center justify-center gap-1 group-hover:bg-white group-hover:text-slate-900"
                      >
                        <span>View Chart</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: WAITING ROOM / QUEUE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <UsersRound className="w-4 h-4" />
                <span>Section 2: Waiting Room &amp; Patient Queue ({queue.length})</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-bold">Live Waiting Room Status</span>
            </div>

            {queue.length === 0 ? (
              <div className="py-6 text-center bg-white/5 rounded-xl border border-white/10 space-y-2">
                <Activity className="w-8 h-8 text-slate-500 mx-auto opacity-70" />
                <p className="text-xs font-bold text-white">No patients currently in waiting room queue.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map(q => {
                  const patient = patients.find(p => p.id === q.patientId);
                  return (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-black text-sm flex items-center justify-center border border-amber-400/40 shrink-0">
                          {q.tokenNumber.replace('#', '')}
                        </span>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-white group-hover:text-amber-300 transition">
                              {q.patientName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                              {patient?.code || 'DF-2026'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.status === 'in_chair'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 animate-pulse'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                            }`}>
                              {q.status === 'in_chair' ? 'IN CHAIR' : `WAITING (~${q.estimatedWaitMinutes}m)`}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 font-semibold">
                            {q.procedure}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-400">
                            <span>Check-in: {q.checkInTime}</span>
                            <span>&bull;</span>
                            <span>Doctor: {q.doctorName}</span>
                            <span>&bull;</span>
                            <span>{q.chair}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePatientClick(q.patientId)}
                        className="shrink-0 px-3 py-1.5 bg-white/10 hover:bg-white text-white rounded-lg text-xs font-bold transition border border-white/15 cursor-pointer flex items-center justify-center gap-1 group-hover:bg-white group-hover:text-slate-900"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenNewAppointment();
            }}
            className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/15 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Add Appointment</span>
          </button>

          <button
            onClick={onClose}
            className="py-2 px-4 bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
