import React from 'react';
import { Appointment, QueueItem, Patient } from '../../types';
import { X, Activity, User, Clock, Stethoscope, Hash, MapPin, AlertCircle, Plus } from 'lucide-react';

interface ChairData {
  chairId: string;
  chairName: string;
  doctorName: string;
  appointment?: Appointment;
  queueItem?: QueueItem;
  patient?: Patient;
}

interface OperatoryChairModalProps {
  isOpen: boolean;
  onClose: () => void;
  chairData: ChairData | null;
  onSelectPatient: (patientId: string) => void;
  onNavigateToChart: () => void;
  onOpenNewAppointment: () => void;
}

export const OperatoryChairModal: React.FC<OperatoryChairModalProps> = ({
  isOpen,
  onClose,
  chairData,
  onSelectPatient,
  onNavigateToChart,
  onOpenNewAppointment
}) => {
  if (!isOpen || !chairData) return null;

  const { chairName, appointment, queueItem, patient } = chairData;
  const isOccupied = Boolean(appointment || queueItem);

  const handleViewPatientChart = () => {
    if (appointment?.patientId) {
      onSelectPatient(appointment.patientId);
      onNavigateToChart();
      onClose();
    } else if (queueItem?.patientId) {
      onSelectPatient(queueItem.patientId);
      onNavigateToChart();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-white">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-extrabold text-sm text-white">{chairName}</h3>
              <p className="text-[11px] text-slate-400">Operatory Terminal &bull; Live Status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs font-bold text-slate-300">Current Operatory State</span>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
              isOccupied
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
            }`}>
              {isOccupied ? (appointment?.status === 'in_chair' ? 'Treatment In Progress' : 'Occupied / In Chair') : 'Available / Ready'}
            </span>
          </div>

          {isOccupied ? (
            <div className="space-y-4">
              {/* Patient Details Panel */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-base text-white">
                      {appointment?.patientName || queueItem?.patientName}
                    </h4>
                    <p className="text-xs text-sky-300 font-mono font-semibold">
                      Patient Code: {patient?.code || 'DF-2026-ACTIVE'}
                    </p>
                  </div>
                  {(appointment?.tokenNumber || queueItem?.tokenNumber) && (
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-extrabold text-xs border border-sky-400/30">
                      Token {appointment?.tokenNumber || queueItem?.tokenNumber}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Assigned Doctor</span>
                    <span className="font-bold text-white">{appointment?.doctorName || chairData.doctorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Appointment Time</span>
                    <span className="font-bold text-white">{appointment?.time || queueItem?.checkInTime || 'Active Now'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[10px] block">Procedure / Treatment</span>
                    <span className="font-bold text-amber-300">{appointment?.procedure || queueItem?.procedure || 'General Examination'}</span>
                  </div>
                </div>

                {appointment?.notes && (
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
                    <span className="font-bold text-slate-200 block text-[10px] uppercase tracking-wider mb-0.5">Clinical Notes</span>
                    {appointment.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleViewPatientChart}
                  className="flex-1 py-2.5 px-4 bg-white text-slate-900 hover:bg-slate-100 font-black text-xs rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Stethoscope className="w-4 h-4 text-sky-700" />
                  <span>Open 3D Dental Chart</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition border border-white/15 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-3 text-center">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-16 h-16 mx-auto flex items-center justify-center">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Operatory Chair Available</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  This chair is currently sterilized and ready for the next scheduled patient or walk-in consultation.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenNewAppointment();
                  }}
                  className="py-2.5 px-5 bg-white text-slate-900 hover:bg-slate-100 font-black text-xs rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-sky-700" />
                  <span>Book &amp; Assign Patient</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
