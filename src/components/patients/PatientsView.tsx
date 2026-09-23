import React, { useState } from 'react';
import { Patient, User } from '../../types';
import { useToast } from '../common/Toast';
import {
  Users,
  Search,
  Plus,
  AlertTriangle,
  Stethoscope,
  Phone,
  Mail,
  Shield,
  CreditCard,
  Calendar,
  X
} from 'lucide-react';

interface PatientsViewProps {
  currentUser: User;
  patients: Patient[];
  onSavePatients: (patients: Patient[]) => void;
  onSelectPatient: (patientId: string) => void;
  onNavigateToChart: () => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  currentUser,
  patients,
  onSavePatients,
  onSelectPatient,
  onNavigateToChart
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patients[0] || null);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);

  // New Patient Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalAlerts, setMedicalAlerts] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');

  const filteredPatients = patients.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    const newCode = `DF-2026-00${patients.length + 1}`;
    const newPatient: Patient = {
      id: `p-${Date.now()}`,
      code: newCode,
      name,
      age: Number(age),
      gender,
      phone,
      email,
      address,
      bloodGroup,
      emergencyContact,
      medicalAlerts: medicalAlerts ? medicalAlerts.split(',').map(s => s.trim()) : [],
      insuranceProvider: insuranceProvider || 'Self-pay',
      balanceDue: 0,
      lastVisitDate: new Date().toISOString().split('T')[0]
    };

    const updated = [newPatient, ...patients];
    onSavePatients(updated);
    setSelectedPatient(newPatient);
    setIsAddPatientModalOpen(false);
    showToast(`Registered new patient ${newPatient.name} (${newCode})`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8B58D]">
            CARE DIRECTORY &bull; CLINICAL RECORDS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#252525]">
            Patients
          </h1>
          <p className="text-xs text-[#6F6D69]">
            A clear clinical story for every person you care for.
          </p>
        </div>

        <button
          onClick={() => setIsAddPatientModalOpen(true)}
          className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Patient</span>
        </button>
      </div>

      {/* Directory Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">Active Patients</div>
          <p className="text-2xl font-bold text-[#252525] mt-1">{patients.length + 1280}</p>
        </div>
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">New This Month</div>
          <p className="text-2xl font-bold text-[#3B4D3A] mt-1">42</p>
        </div>
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">Visits Scheduled</div>
          <p className="text-2xl font-bold text-[#252525] mt-1">8</p>
        </div>
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">Insurance Enrolled</div>
          <p className="text-2xl font-bold text-[#252525] mt-1">86%</p>
        </div>
      </div>

      {/* Main Split: Directory List & Patient Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 7 Cols: Patient List */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID code (DF-2026-001), phone..."
              className="w-full text-xs bg-transparent focus:outline-none text-gray-800"
            />
          </div>

          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {filteredPatients.map(p => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`p-4 transition cursor-pointer flex items-center justify-between ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      {p.name.substring(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{p.name}</span>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {p.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {p.age} yrs &bull; {p.gender} &bull; {p.phone}
                      </p>
                      {p.medicalAlerts.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold mt-0.5">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{p.medicalAlerts[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-800 block">
                      {p.balanceDue > 0 ? `₹${p.balanceDue.toLocaleString()} due` : 'Paid'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Last: {p.lastVisitDate || 'Never'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Selected Patient Detail Card */}
        {selectedPatient ? (
          <div className="lg:col-span-5 bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                  {selectedPatient.name.substring(0, 2).toUpperCase()}
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{selectedPatient.name}</h3>
                  <p className="text-xs text-gray-500">
                    ID: {selectedPatient.code} &bull; Blood Group: {selectedPatient.bloodGroup || 'O+'}
                  </p>
                </div>
              </div>
            </div>

            {/* Medical Alerts */}
            {selectedPatient.medicalAlerts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Medical &amp; Allergy Precautions</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedPatient.medicalAlerts.map((alert, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] bg-amber-100 text-amber-900 font-semibold border border-amber-200"
                    >
                      {alert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact & Demographics */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{selectedPatient.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>{selectedPatient.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="w-3.5 h-3.5 text-gray-400" />
                <span>Insurance: {selectedPatient.insuranceProvider || 'Self-pay'}</span>
              </div>
            </div>

            {/* Dental History Summary */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Clinical History Summary
              </span>
              <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-md border border-gray-100 leading-relaxed">
                {selectedPatient.dentalHistorySummary || 'No past dental history recorded yet.'}
              </p>
            </div>

            {/* Financial Ledger status */}
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-500 font-medium">Outstanding Balance</span>
                <p className="text-sm font-bold text-gray-900">
                  INR ₹{selectedPatient.balanceDue.toLocaleString()}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Ledger in good standing
              </span>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onSelectPatient(selectedPatient.id);
                  onNavigateToChart();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Open Patient Odontogram Chart &rarr;</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400 text-xs">
            Select a patient to inspect their dental record and history.
          </div>
        )}

      </div>

      {/* Add Patient Modal */}
      {isAddPatientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Register New Patient</h2>
              <button
                onClick={() => setIsAddPatientModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Indiranagar, Bangalore"
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Medical Alerts &amp; Allergies (comma separated)
                </label>
                <input
                  type="text"
                  value={medicalAlerts}
                  onChange={e => setMedicalAlerts(e.target.value)}
                  placeholder="e.g. Penicillin Allergy, Hypertensive, Diabetic"
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  value={insuranceProvider}
                  onChange={e => setInsuranceProvider(e.target.value)}
                  placeholder="e.g. Star Health / ICICI Lombard Dental"
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddPatientModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-2xs cursor-pointer"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
