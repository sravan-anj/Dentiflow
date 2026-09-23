import React, { useState } from 'react';
import { Patient, ToothFinding, ToothConditionType, ToothSurface, User } from '../../types';
import { useToast } from '../common/Toast';
import {
  CheckCircle2,
  Plus,
  Stethoscope,
  Info
} from 'lucide-react';

interface DentalChartProps {
  currentUser?: User;
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  toothFindings: ToothFinding[];
  onUpdateFinding: (finding: ToothFinding) => void;
  onAddToTreatmentPlan: (toothNumber: number, diagnosis: string, condition: ToothConditionType) => void;
}

// Tooth naming metadata
const TOOTH_NAMES: Record<number, { name: string; quadrant: string; universal: number }> = {
  // Upper Right (Q1)
  18: { name: 'Third Molar (Wisdom)', quadrant: 'Upper Right (Maxillary)', universal: 1 },
  17: { name: 'Second Molar', quadrant: 'Upper Right (Maxillary)', universal: 2 },
  16: { name: 'First Molar', quadrant: 'Upper Right (Maxillary)', universal: 3 },
  15: { name: 'Second Premolar (Bicuspid)', quadrant: 'Upper Right (Maxillary)', universal: 4 },
  14: { name: 'First Premolar (Bicuspid)', quadrant: 'Upper Right (Maxillary)', universal: 5 },
  13: { name: 'Canine (Cuspid)', quadrant: 'Upper Right (Maxillary)', universal: 6 },
  12: { name: 'Lateral Incisor', quadrant: 'Upper Right (Maxillary)', universal: 7 },
  11: { name: 'Central Incisor', quadrant: 'Upper Right (Maxillary)', universal: 8 },

  // Upper Left (Q2)
  21: { name: 'Central Incisor', quadrant: 'Upper Left (Maxillary)', universal: 9 },
  22: { name: 'Lateral Incisor', quadrant: 'Upper Left (Maxillary)', universal: 10 },
  23: { name: 'Canine (Cuspid)', quadrant: 'Upper Left (Maxillary)', universal: 11 },
  24: { name: 'First Premolar (Bicuspid)', quadrant: 'Upper Left (Maxillary)', universal: 12 },
  25: { name: 'Second Premolar (Bicuspid)', quadrant: 'Upper Left (Maxillary)', universal: 13 },
  26: { name: 'First Molar', quadrant: 'Upper Left (Maxillary)', universal: 14 },
  27: { name: 'Second Molar', quadrant: 'Upper Left (Maxillary)', universal: 15 },
  28: { name: 'Third Molar (Wisdom)', quadrant: 'Upper Left (Maxillary)', universal: 16 },

  // Lower Right (Q4)
  48: { name: 'Third Molar (Wisdom)', quadrant: 'Lower Right (Mandibular)', universal: 32 },
  47: { name: 'Second Molar', quadrant: 'Lower Right (Mandibular)', universal: 31 },
  46: { name: 'First Molar', quadrant: 'Lower Right (Mandibular)', universal: 30 },
  45: { name: 'Second Premolar (Bicuspid)', quadrant: 'Lower Right (Mandibular)', universal: 29 },
  44: { name: 'First Premolar (Bicuspid)', quadrant: 'Lower Right (Mandibular)', universal: 28 },
  43: { name: 'Canine (Cuspid)', quadrant: 'Lower Right (Mandibular)', universal: 27 },
  42: { name: 'Lateral Incisor', quadrant: 'Lower Right (Mandibular)', universal: 26 },
  41: { name: 'Central Incisor', quadrant: 'Lower Right (Mandibular)', universal: 25 },

  // Lower Left (Q3)
  31: { name: 'Central Incisor', quadrant: 'Lower Left (Mandibular)', universal: 24 },
  32: { name: 'Lateral Incisor', quadrant: 'Lower Left (Mandibular)', universal: 23 },
  33: { name: 'Canine (Cuspid)', quadrant: 'Lower Left (Mandibular)', universal: 22 },
  34: { name: 'First Premolar (Bicuspid)', quadrant: 'Lower Left (Mandibular)', universal: 21 },
  35: { name: 'Second Premolar (Bicuspid)', quadrant: 'Lower Left (Mandibular)', universal: 20 },
  36: { name: 'First Molar', quadrant: 'Lower Left (Mandibular)', universal: 19 },
  37: { name: 'Second Molar', quadrant: 'Lower Left (Mandibular)', universal: 18 },
  38: { name: 'Third Molar (Wisdom)', quadrant: 'Lower Left (Mandibular)', universal: 17 }
};

export const DentalChart: React.FC<DentalChartProps> = ({
  currentUser,
  patients,
  selectedPatientId,
  onSelectPatient,
  toothFindings,
  onUpdateFinding,
  onAddToTreatmentPlan
}) => {
  const { showToast } = useToast();
  const isPatient = currentUser?.role === 'patient';
  const patientIdToUse = isPatient
    ? (currentUser?.patientId || 'p-1')
    : selectedPatientId;

  const currentPatient = patients.find(p => p.id === patientIdToUse) || patients[0];
  const [selectedTooth, setSelectedTooth] = useState<number>(16);

  // Edit form state for selected tooth
  const existingFinding = toothFindings.find(
    f => f.patientId === currentPatient?.id && f.toothNumber === selectedTooth
  );

  const [activeCondition, setActiveCondition] = useState<ToothConditionType>(
    existingFinding ? existingFinding.condition : 'healthy'
  );
  const [diagnosisText, setDiagnosisText] = useState(
    existingFinding ? existingFinding.diagnosis : 'Normal appearance. Healthy periodontium.'
  );
  const [selectedSurfaces, setSelectedSurfaces] = useState<ToothSurface[]>(
    existingFinding?.surfaces || ['occlusal']
  );
  const [estimatedCost, setEstimatedCost] = useState<number>(
    existingFinding?.estimatedCost || 0
  );

  // Sync state whenever selected tooth or patient changes
  React.useEffect(() => {
    const finding = toothFindings.find(
      f => f.patientId === currentPatient?.id && f.toothNumber === selectedTooth
    );
    if (finding) {
      setActiveCondition(finding.condition);
      setDiagnosisText(finding.diagnosis);
      setSelectedSurfaces(finding.surfaces);
      setEstimatedCost(finding.estimatedCost || 0);
    } else {
      setActiveCondition('healthy');
      setDiagnosisText('No documented condition');
      setSelectedSurfaces(['occlusal']);
      setEstimatedCost(0);
    }
  }, [selectedTooth, currentPatient?.id, toothFindings]);

  const handleSaveFinding = () => {
    if (!currentPatient) return;
    const newFinding: ToothFinding = {
      id: existingFinding?.id || `tf-${Date.now()}`,
      patientId: currentPatient.id,
      toothNumber: selectedTooth,
      universalNumber: TOOTH_NAMES[selectedTooth]?.universal,
      condition: activeCondition,
      surfaces: selectedSurfaces,
      diagnosis: diagnosisText,
      doctorName: currentUser?.name || 'Dr. Ananya Sharma',
      date: new Date().toISOString().split('T')[0],
      estimatedCost: estimatedCost
    };

    onUpdateFinding(newFinding);
    showToast(`Updated clinical finding for Tooth #${selectedTooth}`, 'success');
  };

  const handleQuickAddPlan = () => {
    onAddToTreatmentPlan(selectedTooth, diagnosisText, activeCondition);
    showToast(`Added Tooth #${selectedTooth} to Treatment Plan`, 'success');
  };

  const toggleSurface = (surf: ToothSurface) => {
    setSelectedSurfaces(prev =>
      prev.includes(surf) ? prev.filter(s => s !== surf) : [...prev, surf]
    );
  };

  // Color styles mapping
  const getToothVisualClasses = (toothNum: number) => {
    const finding = toothFindings.find(
      f => f.patientId === currentPatient?.id && f.toothNumber === toothNum
    );
    const cond = finding ? finding.condition : 'healthy';

    switch (cond) {
      case 'cavity':
        return {
          fill: '#fecaca',
          stroke: '#dc2626',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          label: 'Cavity / Caries'
        };
      case 'watch':
        return {
          fill: '#fef3c7',
          stroke: '#d97706',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          label: 'Watch / Inactive'
        };
      case 'filling':
        return {
          fill: '#dbeafe',
          stroke: '#2563eb',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          label: 'Composite / Amalgam'
        };
      case 'crown':
        return {
          fill: '#fef08a',
          stroke: '#ca8a04',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          label: 'Full Crown'
        };
      case 'root_canal':
        return {
          fill: '#f3e8ff',
          stroke: '#9333ea',
          badge: 'bg-purple-100 text-purple-800 border-purple-200',
          label: 'Root Canal (RCT)'
        };
      case 'missing':
        return {
          fill: '#e2e8f0',
          stroke: '#64748b',
          badge: 'bg-slate-200 text-slate-700 border-slate-300',
          label: 'Extracted / Missing'
        };
      case 'implant':
        return {
          fill: '#ccfbf1',
          stroke: '#0d9488',
          badge: 'bg-teal-100 text-teal-800 border-teal-200',
          label: 'Dental Implant'
        };
      case 'healthy':
      default:
        return {
          fill: '#ffffff',
          stroke: '#10b981',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Healthy'
        };
    }
  };

  const patientFindingsCount = toothFindings.filter(
    f => f.patientId === currentPatient?.id
  ).length;

  return (
    <div className="space-y-6">
      {/* Header and Patient Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8B58D]">
            ODONTOGRAM &bull; CLINICAL VISUALIZATION
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#252525]">
            Dental chart
          </h1>
          <p className="text-xs text-[#6F6D69]">
            Inspect tooth-by-tooth diagnoses and restorations for each patient.
          </p>
        </div>

        {!isPatient ? (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#6F6D69]">Patient:</label>
            <select
              value={currentPatient?.id}
              onChange={e => onSelectPatient(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone-200 bg-white/90 text-[#252525] shadow-2xs focus:ring-1 focus:ring-[#C8B58D]"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-lg bg-[#EDE8DE] text-[#252525] border border-[#C8B58D]/30 text-xs font-bold">
            Personal Dental Record &bull; {currentPatient?.name}
          </div>
        )}
      </div>

      {/* Main Odontogram & Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 Cols: Interactive Mouth Chart */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Adult dentition &bull; {currentPatient?.name}
              </h2>
              <p className="text-[11px] text-gray-500">
                {patientFindingsCount} tooth record(s) documented
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Chart Sync
            </span>
          </div>

          {/* Condition Legend */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 py-2 px-3 bg-gray-50 rounded-md border border-gray-200 text-xs mb-4">
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-white border border-emerald-500" />
              Healthy
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-600" />
              Watch
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-700" />
              Cavity
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-700" />
              Filling
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600" />
              Crown
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-purple-500 border border-purple-700" />
              Root Canal
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-slate-400 border border-slate-600" />
              Missing
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-teal-500 border border-teal-700" />
              Implant
            </span>
          </div>

          {/* Odontogram SVG Grid */}
          <div className="overflow-x-auto py-2">
            <div className="min-w-[620px]">
              
              {/* Upper Arch Label */}
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1.5">
                <span>Upper Right (Q1)</span>
                <span className="text-gray-500 font-extrabold">UPPER ARCH (MAXILLA)</span>
                <span>Upper Left (Q2)</span>
              </div>

              {/* Upper Teeth Row (18 down to 11, then 21 to 28) */}
              <div className="grid grid-cols-16 gap-1 bg-gray-50/60 p-2 rounded-lg border border-gray-200 mb-4">
                {/* Upper Right: 18 -> 11 */}
                {[18, 17, 16, 15, 14, 13, 12, 11].map(num => {
                  const style = getToothVisualClasses(num);
                  const isSelected = selectedTooth === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedTooth(num)}
                      className={`relative flex flex-col items-center p-1 rounded transition group cursor-pointer ${
                        isSelected ? 'ring-2 ring-blue-600 bg-blue-50/80' : 'hover:bg-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-500 mb-1">
                        {num}
                      </span>
                      {/* SVG Tooth representation */}
                      <svg width="34" height="44" viewBox="0 0 34 44" className="drop-shadow-2xs">
                        <rect
                          x="2"
                          y="2"
                          width="30"
                          height="40"
                          rx="6"
                          fill={style.fill}
                          stroke={style.stroke}
                          strokeWidth={isSelected ? '2.5' : '1.5'}
                        />
                        {/* Anatomy cross surfaces */}
                        <line x1="2" y1="22" x2="32" y2="22" stroke={style.stroke} strokeWidth="0.7" opacity="0.6" />
                        <line x1="17" y1="2" x2="17" y2="42" stroke={style.stroke} strokeWidth="0.7" opacity="0.6" />
                        {/* Root indication lines */}
                        <path d="M10 38 Q17 44 24 38" fill="none" stroke={style.stroke} strokeWidth="1" opacity="0.8" />
                      </svg>
                      <span className="text-[9px] text-gray-400 mt-1">
                        #{TOOTH_NAMES[num]?.universal}
                      </span>
                    </button>
                  );
                })}

                {/* Upper Left: 21 -> 28 */}
                {[21, 22, 23, 24, 25, 26, 27, 28].map(num => {
                  const style = getToothVisualClasses(num);
                  const isSelected = selectedTooth === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedTooth(num)}
                      className={`relative flex flex-col items-center p-1 rounded transition group cursor-pointer ${
                        isSelected ? 'ring-2 ring-blue-600 bg-blue-50/80' : 'hover:bg-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-500 mb-1">
                        {num}
                      </span>
                      <svg width="34" height="44" viewBox="0 0 34 44" className="drop-shadow-2xs">
                        <rect
                          x="2"
                          y="2"
                          width="30"
                          height="40"
                          rx="6"
                          fill={style.fill}
                          stroke={style.stroke}
                          strokeWidth={isSelected ? '2.5' : '1.5'}
                        />
                        <line x1="2" y1="22" x2="32" y2="22" stroke={style.stroke} strokeWidth="0.7" opacity="0.6" />
                        <line x1="17" y1="2" x2="17" y2="42" stroke={style.stroke} strokeWidth="0.7" opacity="0.6" />
                        <path d="M10 38 Q17 44 24 38" fill="none" stroke={style.stroke} strokeWidth="1" opacity="0.8" />
                      </svg>
                      <span className="text-[9px] text-gray-400 mt-1">
                        #{TOOTH_NAMES[num]?.universal}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Lower Arch Label */}
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1.5 pt-2">
                <span>Lower Right (Q4)</span>
                <span className="text-gray-500 font-extrabold">LOWER ARCH (MANDIBLE)</span>
                <span>Lower Left (Q3)</span>
              </div>

              {/* Lower Teeth Row (48 down to 41, then 31 to 38) */}
              <div className="grid grid-cols-16 gap-1 bg-gray-50/60 p-2 rounded-lg border border-gray-200">
                {/* Lower Right: 48 -> 41 */}
                {[48, 47, 46, 45, 44, 43, 42, 41].map(num => {
                  const style = getToothVisualClasses(num);
                  const isSelected = selectedTooth === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedTooth(num)}
                      className={`relative flex flex-col items-center p-1 rounded transition group cursor-pointer ${
                        isSelected ? 'ring-2 ring-blue-600 bg-blue-50/80' : 'hover:bg-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-500 mb-1">
                        {num}
                      </span>
                      <svg width="34" height="44" viewBox="0 0 34 44" className="drop-shadow-2xs">
                        <rect
                          x="2"
                          y="2"
                          width="30"
                          height="40"
                          rx="6"
                          fill={style.fill}
                          stroke={style.stroke}
                          strokeWidth={isSelected ? '2.5' : '1.5'}
                        />
                        <line x1="2" y1="22" x2="32" y2="22" stroke={style.stroke} strokeWidth="0.7" opacity="0.6" />
                        <line x1="17" y1="2" x2="17" y2="42" stroke={style.stroke} strokeWidth="0.7" opacity="0.6" />
                        <path d="M10 6 Q17 0 24 6" fill="none" stroke={style.stroke} strokeWidth="1" opacity="0.8" />
                      </svg>
                      <span className="text-[9px] text-gray-400 mt-1">
                        #{TOOTH_NAMES[num]?.universal}
                      </span>
                    </button>
                  );
                })}

                {/* Lower Left: 31 -> 38 */}
                {[31, 32, 33, 34, 35, 36, 37, 38].map(num => {
                  const style = getToothVisualClasses(num);
                  const isSelected = selectedTooth === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedTooth(num)}
                      className={`relative flex flex-col items-center p-1 rounded transition group cursor-pointer ${
                        isSelected ? 'ring-2 ring-blue-600 bg-blue-50/80' : 'hover:bg-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-500 mb-1">
                        {num}
                      </span>
                      <svg width="34" height="44" viewBox="0 0 34 44" className="drop-shadow-2xs">
                        <rect
                          x="2"
                          y="2"
                          width="30"
                          height="40"
                          rx="6"
                          fill={style.fill}
                          stroke={style.stroke}
                          strokeWidth={isSelected ? '2.5' : '1.5'}
                        />
                        <line x1="2" y1="22" x2="32" y2="22" stroke={style.stroke} strokeWidth="0.7" opacity="0.6" />
                        <line x1="17" y1="2" x2="17" y2="42" stroke={style.stroke} strokeWidth="0.7" opacity="0.6" />
                        <path d="M10 6 Q17 0 24 6" fill="none" stroke={style.stroke} strokeWidth="1" opacity="0.8" />
                      </svg>
                      <span className="text-[9px] text-gray-400 mt-1">
                        #{TOOTH_NAMES[num]?.universal}
                      </span>
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>FDI Two-Digit Notation (Upper: 18-28, Lower: 48-38)</span>
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              Click any tooth to examine surfaces &amp; update diagnosis
            </span>
          </div>
        </div>

        {/* Right 4 Cols: Selected Tooth Clinical Inspector */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              SELECTED TOOTH INSPECTION
            </span>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-lg font-bold text-gray-900">
                Tooth #{selectedTooth}
              </h3>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getToothVisualClasses(selectedTooth).badge}`}>
                {getToothVisualClasses(selectedTooth).label}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium mt-0.5">
              {TOOTH_NAMES[selectedTooth]?.name} &bull; {TOOTH_NAMES[selectedTooth]?.quadrant}
            </p>
            <p className="text-[11px] text-gray-400">
              Universal Code: #{TOOTH_NAMES[selectedTooth]?.universal}
            </p>
          </div>

          {isPatient ? (
            /* Patient View: Read-Only Documented Information */
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Recorded Condition
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {existingFinding ? existingFinding.condition.replace('_', ' ').toUpperCase() : 'HEALTHY / NORMAL'}
                </p>
                <span className="text-xs text-slate-500 block">
                  {existingFinding?.surfaces?.length ? `Surfaces: ${existingFinding.surfaces.join(', ')}` : 'Full Tooth Crown'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Clinical Diagnosis &amp; Notes
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {existingFinding?.diagnosis || 'No documented condition'}
                </p>
              </div>

              {existingFinding?.recommendedTreatment && (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 block">
                    Recommended Care
                  </span>
                  <p className="text-xs font-bold text-sky-950">
                    {existingFinding.recommendedTreatment}
                  </p>
                </div>
              )}

              {existingFinding?.doctorName && (
                <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  Examined by {existingFinding.doctorName} on {existingFinding.date}
                </p>
              )}
            </div>
          ) : (
            /* Doctor View: Interactive Form Controls */
            <>
              {/* Condition Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Clinical Condition
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'healthy', label: 'Healthy' },
                      { id: 'watch', label: 'Watch / Plaque' },
                      { id: 'cavity', label: 'Caries / Cavity' },
                      { id: 'filling', label: 'Filling' },
                      { id: 'crown', label: 'Full Crown' },
                      { id: 'root_canal', label: 'Root Canal' },
                      { id: 'missing', label: 'Missing' },
                      { id: 'implant', label: 'Implant' }
                    ] as { id: ToothConditionType; label: string }[]
                  ).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCondition(c.id)}
                      className={`px-2 py-1.5 rounded text-xs font-semibold text-left border transition cursor-pointer ${
                        activeCondition === c.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Affected Surfaces */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Surfaces Involved
                </label>
                <div className="flex flex-wrap gap-1">
                  {(['occlusal', 'mesial', 'distal', 'buccal', 'lingual'] as ToothSurface[]).map(s => {
                    const isSelected = selectedSurfaces.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSurface(s)}
                        className={`px-2.5 py-1 rounded text-xs font-medium uppercase border transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {s[0]} - {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clinical Findings / Diagnosis text */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Diagnostic Notes
                </label>
                <textarea
                  rows={3}
                  value={diagnosisText}
                  onChange={e => setDiagnosisText(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-md border border-gray-200 bg-white text-gray-800 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  placeholder="e.g. Deep occlusal caries with pulpal involvement..."
                />
              </div>

              {/* Estimated Procedure Cost */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Est. Procedure Fee (INR ₹)
                </label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={e => setEstimatedCost(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-800 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSaveFinding}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Tooth Diagnostic Record</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickAddPlan}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Treatment Plan</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
