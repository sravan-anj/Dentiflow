import React, { useState } from 'react';
import { StaffMember } from '../../types';
import { useToast } from '../common/Toast';
import {
  UserCheck,
  Plus,
  Mail,
  Phone,
  ShieldCheck,
  Clock,
  Search
} from 'lucide-react';

interface StaffViewProps {
  staff: StaffMember[];
  onSaveStaff: (staff: StaffMember[]) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({ staff, onSaveStaff }) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('Chief Dental Surgeon');
  const [specialization, setSpecialization] = useState('Periodontics & Implantology');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [availability, setAvailability] = useState('Mon - Fri (09:00 AM - 05:00 PM)');
  const [assignedChair, setAssignedChair] = useState('Chair 1 - Endodontics');
  const [registrationNumber, setRegistrationNumber] = useState('KDC-30192-A');

  const filteredStaff = staff.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.specialization && s.specialization.toLowerCase().includes(q)) ||
      s.role.toLowerCase().includes(q)
    );
  });

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name,
      role,
      specialization,
      email,
      phone,
      availability,
      assignedChair,
      registrationNumber,
      activePatientsToday: 0,
      avatarText: name.substring(0, 2).toUpperCase(),
      status: 'active'
    };

    onSaveStaff([...staff, newMember]);
    setIsAddModalOpen(false);
    showToast(`Added ${newMember.name} to clinic staff roster`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8B58D]">
            CLINICAL ROSTER &bull; DOCTORS &amp; ASSISTANTS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#252525]">
            Doctors &amp; Staff
          </h1>
          <p className="text-xs text-[#6F6D69]">
            Manage practicing clinicians, credentials, operatory allocations, and shifts.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Clinician / Staff</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-2xs flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, role, specialization..."
          className="w-full text-xs bg-transparent focus:outline-none text-gray-800"
        />
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map(member => (
          <div
            key={member.id}
            className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4 hover:border-gray-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-sm flex items-center justify-center">
                    {member.avatarText}
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">{member.name}</h2>
                    <p className="text-xs text-blue-600 font-semibold">{member.role}</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  ACTIVE
                </span>
              </div>

              {member.specialization && (
                <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-100 text-xs text-gray-700">
                  <span className="font-semibold text-gray-900">Specialty: </span>
                  {member.specialization}
                </div>
              )}

              <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                {member.registrationNumber && (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Reg #: {member.registrationNumber}</span>
                  </div>
                )}
                {member.assignedChair && (
                  <div className="flex items-center gap-2 font-medium text-gray-800">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Assigned: {member.assignedChair}</span>
                  </div>
                )}
                {member.availability && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{member.availability}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{member.phone}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Patients Managed Today</span>
              <span className="font-bold text-blue-700">{member.activePatientsToday || 4}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Register Clinician / Staff</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name &amp; Title *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Pillai (MDS)"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Chief Dental Surgeon">Chief Dental Surgeon</option>
                    <option value="Endodontist">Endodontist</option>
                    <option value="Oral Surgeon">Oral Surgeon</option>
                    <option value="Orthodontist">Orthodontist</option>
                    <option value="Senior Dental Assistant">Senior Dental Assistant</option>
                    <option value="Dental Hygienist">Dental Hygienist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Operatory Chair
                  </label>
                  <select
                    value={assignedChair}
                    onChange={e => setAssignedChair(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Chair 1 - Endodontics">Chair 1 - Endodontics</option>
                    <option value="Chair 2 - Surgery">Chair 2 - Surgery</option>
                    <option value="Chair 3 - Aesthetics & Hygiene">Chair 3 - Aesthetics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Specialization / Qualifications
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={e => setSpecialization(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Dental Council Registration #
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="doctor@oralix.clinic"
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98450 00000"
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Availability / Shift Hours
                </label>
                <input
                  type="text"
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
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
                  Save Clinician Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
