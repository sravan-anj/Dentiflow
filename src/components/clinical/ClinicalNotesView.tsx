import React, { useState } from 'react';
import { ClinicalNote, Patient, User } from '../../types';
import { useToast } from '../common/Toast';
import {
  FileText,
  Plus,
  Stethoscope,
  Pill,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Search
} from 'lucide-react';

interface ClinicalNotesViewProps {
  currentUser: User;
  notes: ClinicalNote[];
  patients: Patient[];
  onSaveNotes: (notes: ClinicalNote[]) => void;
  onSelectPatient: (patientId: string) => void;
  onNavigateToChart: () => void;
}

export const ClinicalNotesView: React.FC<ClinicalNotesViewProps> = ({
  currentUser,
  notes,
  patients,
  onSaveNotes,
  onSelectPatient,
  onNavigateToChart
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);

  // Form State
  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [toothNumber, setToothNumber] = useState<number>(16);
  const [prescriptionDrugs, setPrescriptionDrugs] = useState('Amoxicillin 500mg (1 cap TDS x 5 days), Ibuprofen 400mg (1 tab SOS)');

  const filteredNotes = notes.filter(n => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.patientName.toLowerCase().includes(q) ||
      (n.chiefComplaint && n.chiefComplaint.toLowerCase().includes(q)) ||
      n.assessment.toLowerCase().includes(q)
    );
  });

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === patientId) || patients[0];

    const newNote: ClinicalNote = {
      id: `cn-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      doctorName: currentUser.name || 'Dr. Ananya Sharma',
      date: new Date().toISOString().split('T')[0],
      toothNumber: toothNumber,
      chiefComplaint,
      subjective,
      objective,
      assessment,
      plan,
      prescriptions: prescriptionDrugs ? prescriptionDrugs.split(',').map(s => s.trim()) : [],
      isSigned: true
    };

    onSaveNotes([newNote, ...notes]);
    setIsAddNoteModalOpen(false);
    showToast(`Saved clinical SOAP note for ${patient.name}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8B58D]">
            ELECTRONIC HEALTH RECORDS &bull; SOAP FORMAT
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#252525]">
            Clinical notes
          </h1>
          <p className="text-xs text-[#6F6D69]">
            Document patient assessments, diagnostics, treatment progress, and prescriptions.
          </p>
        </div>

        <button
          onClick={() => setIsAddNoteModalOpen(true)}
          className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New SOAP Note</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-2xs flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by patient, diagnosis, or complaint..."
          className="w-full text-xs bg-transparent focus:outline-none text-gray-800"
        />
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.map(note => (
          <div
            key={note.id}
            className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4 hover:border-gray-300 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                  {note.patientName.substring(0, 2).toUpperCase()}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">{note.patientName}</h2>
                  <p className="text-xs text-gray-500">
                    {note.doctorName} &bull; {note.date}
                    {note.toothNumber && ` • Tooth #${note.toothNumber}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {note.isSigned && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Clinically Signed</span>
                  </span>
                )}
                <button
                  onClick={() => {
                    onSelectPatient(note.patientId);
                    onNavigateToChart();
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Odontogram &rarr;
                </button>
              </div>
            </div>

            {/* Chief Complaint */}
            <div className="bg-gray-50 p-2.5 rounded-md border border-gray-200/60 text-xs">
              <span className="font-bold text-gray-700">Chief Complaint: </span>
              <span className="text-gray-900">{note.chiefComplaint}</span>
            </div>

            {/* SOAP Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-gray-50/50 rounded-md border border-gray-100">
                <span className="font-bold text-blue-700 block mb-1">
                  S - Subjective History
                </span>
                <p className="text-gray-700 leading-relaxed">{note.subjective}</p>
              </div>

              <div className="p-3 bg-gray-50/50 rounded-md border border-gray-100">
                <span className="font-bold text-blue-700 block mb-1">
                  O - Objective Findings
                </span>
                <p className="text-gray-700 leading-relaxed">{note.objective}</p>
              </div>

              <div className="p-3 bg-gray-50/50 rounded-md border border-gray-100">
                <span className="font-bold text-blue-700 block mb-1">
                  A - Assessment &amp; Diagnosis
                </span>
                <p className="text-gray-700 leading-relaxed">{note.assessment}</p>
              </div>

              <div className="p-3 bg-gray-50/50 rounded-md border border-gray-100">
                <span className="font-bold text-blue-700 block mb-1">
                  P - Treatment Executed &amp; Plan
                </span>
                <p className="text-gray-700 leading-relaxed">{note.plan}</p>
              </div>
            </div>

            {/* Prescriptions */}
            {note.prescriptions && note.prescriptions.length > 0 && (
              <div className="p-3 bg-emerald-50/50 rounded-md border border-emerald-100 text-xs flex items-start gap-2.5">
                <Pill className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-900">Rx Prescriptions: </span>
                  <span className="text-emerald-800">{note.prescriptions.join(' • ')}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New Note Modal */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Document Clinical SOAP Note</h2>
              <button
                onClick={() => setIsAddNoteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Select Patient *
                  </label>
                  <select
                    value={patientId}
                    onChange={e => setPatientId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
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
                    Tooth Number (Optional)
                  </label>
                  <input
                    type="number"
                    value={toothNumber}
                    onChange={e => setToothNumber(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Chief Complaint *
                </label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                  placeholder="e.g. Throbbing pain in upper right quadrant for 3 days"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  S - Subjective
                </label>
                <textarea
                  rows={2}
                  value={subjective}
                  onChange={e => setSubjective(e.target.value)}
                  placeholder="Patient reports acute sensitivity to hot/cold, nocturnal pain..."
                  className="w-full p-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  O - Objective
                </label>
                <textarea
                  rows={2}
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  placeholder="Tender to percussion (+2), pulp tester delayed response, deep disto-occlusal cavity..."
                  className="w-full p-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  A - Assessment &amp; Diagnosis *
                </label>
                <input
                  type="text"
                  value={assessment}
                  onChange={e => setAssessment(e.target.value)}
                  placeholder="Symptomatic Irreversible Pulpitis #16 with Symptomatic Apical Periodontitis"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  P - Treatment Plan &amp; Execution *
                </label>
                <textarea
                  rows={2}
                  value={plan}
                  onChange={e => setPlan(e.target.value)}
                  placeholder="Access opening performed under rubber dam isolation, canal negotiation with #10 K-file, Ca(OH)2 dressing placed..."
                  required
                  className="w-full p-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Prescriptions (comma separated)
                </label>
                <input
                  type="text"
                  value={prescriptionDrugs}
                  onChange={e => setPrescriptionDrugs(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-2xs cursor-pointer"
                >
                  Sign &amp; Save SOAP Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
