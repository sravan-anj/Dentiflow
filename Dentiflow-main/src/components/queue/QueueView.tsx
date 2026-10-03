import React, { useState } from 'react';
import { QueueItem, Patient, QueueStatus } from '../../types';
import { useToast } from '../common/Toast';
import {
  UsersRound,
  Bell,
  Clock,
  CheckCircle2,
  Plus,
  Play,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface QueueViewProps {
  queue: QueueItem[];
  patients: Patient[];
  onSaveQueue: (queue: QueueItem[]) => void;
  onSelectPatient: (patientId: string) => void;
  onNavigateToChart: () => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  queue,
  patients,
  onSaveQueue,
  onSelectPatient,
  onNavigateToChart
}) => {
  const { showToast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [assignedDoctor, setAssignedDoctor] = useState('Dr. Ananya Sharma');
  const [assignedChair, setAssignedChair] = useState('Chair 1');
  const [procedure, setProcedure] = useState('Dental Examination & Diagnostics');

  const handleUpdateStatus = (id: string, newStatus: QueueStatus) => {
    const item = queue.find(q => q.id === id);
    const updated = queue.map(q =>
      q.id === id ? { ...q, status: newStatus } : q
    );
    onSaveQueue(updated);
    showToast(
      `${item?.patientName} (${item?.tokenNumber}) status updated to ${newStatus.replace('_', ' ')}`,
      'success'
    );
  };

  const handleCallPatient = (item: QueueItem) => {
    // Visual and sound chime
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      // Audio context might be restricted before interaction
    }

    handleUpdateStatus(item.id, 'in_chair');
    showToast(`🔔 Paging ${item.tokenNumber}: ${item.patientName} to ${item.chair}!`, 'info');
  };

  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === selectedPatientId) || patients[0];
    const token = `#D-${Math.floor(100 + Math.random() * 900)}`;

    const newItem: QueueItem = {
      id: `q-${Date.now()}`,
      tokenNumber: token,
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      doctorName: assignedDoctor,
      chair: assignedChair,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'waiting',
      estimatedWaitMinutes: 15,
      procedure: procedure
    };

    onSaveQueue([...queue, newItem]);
    setIsAddModalOpen(false);
    showToast(`Added ${patient.name} (${token}) to live queue`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8B58D]">
            WAITING ROOM &bull; TRIAGE FLOW
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#252525]">
            Queue Management
          </h1>
          <p className="text-xs text-[#6F6D69]">
            Real-time patient flow across waiting room, operatories, and checkout desk.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Check-in Patient</span>
        </button>
      </div>

      {/* Queue Stat Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">In Waiting Lounge</div>
          <p className="text-2xl font-bold text-[#594723] mt-1">
            {queue.filter(q => q.status === 'waiting').length}
          </p>
        </div>
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">Currently In Chair</div>
          <p className="text-2xl font-bold text-[#252525] mt-1">
            {queue.filter(q => q.status === 'in_chair').length}
          </p>
        </div>
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">Billing Desk</div>
          <p className="text-2xl font-bold text-[#252525] mt-1">
            {queue.filter(q => q.status === 'billing').length}
          </p>
        </div>
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">Completed Today</div>
          <p className="text-2xl font-bold text-[#3B4D3A] mt-1">
            {queue.filter(q => q.status === 'completed').length + 8}
          </p>
        </div>
      </div>

      {/* Live Queue Cards / Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Waiting */}
        <div className="bg-[#EDE8DE]/40 border border-stone-200/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C5A66A]" />
              <h2 className="text-xs font-bold text-[#252525] uppercase tracking-wide">
                Waiting ({queue.filter(q => q.status === 'waiting').length})
              </h2>
            </div>
            <span className="text-[11px] text-[#6F6D69]">Reception Lounge</span>
          </div>

          <div className="space-y-3">
            {queue.filter(q => q.status === 'waiting').length === 0 ? (
              <p className="text-xs text-[#999690] py-6 text-center">
                No patients waiting currently.
              </p>
            ) : (
              queue
                .filter(q => q.status === 'waiting')
                .map(item => (
                  <div
                    key={item.id}
                    className="bg-white/90 border border-stone-200/80 rounded-xl p-3.5 shadow-xs space-y-2 hover:border-[#C8B58D] transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#C5A66A]/20 text-[#594723] border border-[#C5A66A]/30">
                        {item.tokenNumber}
                      </span>
                      <span className="text-[10px] text-[#999690] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#C8B58D]" />
                        In since {item.checkInTime}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-[#252525]">{item.patientName}</h3>
                      <p className="text-[11px] text-[#6F6D69]">{item.procedure}</p>
                      <p className="text-[10px] text-[#999690]">
                        Assignee: {item.doctorName} &bull; {item.chair}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] text-[#594723] font-semibold">
                        ~{item.estimatedWaitMinutes} mins est.
                      </span>
                      <button
                        onClick={() => handleCallPatient(item)}
                        className="btn-primary text-xs cursor-pointer flex items-center gap-1"
                      >
                        <Bell className="w-3 h-3" />
                        <span>Call Next</span>
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Column 2: In Chair */}
        <div className="bg-blue-50/40 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-blue-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                In Chair ({queue.filter(q => q.status === 'in_chair').length})
              </h2>
            </div>
            <span className="text-[11px] text-blue-700 font-medium">Active Treatment</span>
          </div>

          <div className="space-y-3">
            {queue.filter(q => q.status === 'in_chair').length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                All chairs currently unoccupied.
              </p>
            ) : (
              queue
                .filter(q => q.status === 'in_chair')
                .map(item => (
                  <div
                    key={item.id}
                    className="bg-white border border-blue-300 rounded-lg p-3.5 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-600 text-white">
                        {item.tokenNumber}
                      </span>
                      <span className="text-[11px] font-bold text-blue-700">{item.chair}</span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-gray-900">{item.patientName}</h3>
                      <p className="text-[11px] text-gray-600">{item.procedure}</p>
                      <p className="text-[10px] text-gray-400">Dr: {item.doctorName}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          onSelectPatient(item.patientId);
                          onNavigateToChart();
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Odontogram &rarr;
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'billing')}
                        className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition cursor-pointer"
                      >
                        Ready for Bill
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Column 3: Billing & Discharge */}
        <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Billing Desk ({queue.filter(q => q.status === 'billing').length})
              </h2>
            </div>
            <span className="text-[11px] text-gray-400">Checkout</span>
          </div>

          <div className="space-y-3">
            {queue.filter(q => q.status === 'billing').length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                No patients awaiting billing.
              </p>
            ) : (
              queue
                .filter(q => q.status === 'billing')
                .map(item => (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
                        {item.tokenNumber}
                      </span>
                      <span className="text-[10px] text-gray-400">Treatment completed</span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-gray-900">{item.patientName}</h3>
                      <p className="text-[11px] text-gray-500">{item.procedure}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'completed')}
                        className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Discharge</span>
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

      </div>

      {/* Check In Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Check In Patient to Queue</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddToQueue} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Patient *
                </label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assign Doctor *
                </label>
                <select
                  value={assignedDoctor}
                  onChange={e => setAssignedDoctor(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                >
                  <option value="Dr. Ananya Sharma">Dr. Ananya Sharma (Chair 1)</option>
                  <option value="Dr. Vikram Mehta">Dr. Vikram Mehta (Chair 2)</option>
                  <option value="Dr. Priya Sen">Dr. Priya Sen (Chair 3)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Procedure *
                </label>
                <input
                  type="text"
                  value={procedure}
                  onChange={e => setProcedure(e.target.value)}
                  placeholder="e.g. Tooth #16 Root Canal Preparation"
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-2xs cursor-pointer"
                >
                  Issue Queue Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
