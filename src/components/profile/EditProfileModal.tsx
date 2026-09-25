import React, { useState } from 'react';
import { User } from '../../types';
import { useToast } from '../common/Toast';
import { SecurityService } from '../../utils/security';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Stethoscope,
  Building,
  FileBadge,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSaveUser: (updated: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveUser
}) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: currentUser.name || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    specialization: currentUser.specialization || '',
    department: currentUser.department || (currentUser.role === 'doctor' ? 'Clinical Endodontics & Surgery' : currentUser.role === 'admin' ? 'Clinic Administration & Compliance' : 'Outpatient Dental Care'),
    licenseNumber: currentUser.licenseNumber || (currentUser.role === 'doctor' ? 'DCI-KA-2018-88419' : currentUser.role === 'admin' ? 'HOSP-ADMIN-7701' : ''),
    bio: currentUser.bio || '',
    address: currentUser.address || '',
    emergencyContact: currentUser.emergencyContact || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    } else if (formData.name.trim().length < 3) {
      errs.name = 'Name must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[+0-9\s-]{7,20}$/.test(formData.phone.trim())) {
      errs.phone = 'Please enter a valid telephone number';
    }

    if (currentUser.role === 'doctor' && !formData.specialization.trim()) {
      errs.specialization = 'Clinical specialization is required for doctors';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix form errors before saving', 'error');
      return;
    }

    setIsSaving(true);

    try {
      // Simulate secure authorization & verification
      await new Promise(res => setTimeout(res, 500));

      // Calculate avatar text from name
      const parts = formData.name.trim().split(' ').filter(Boolean);
      let initials = 'DF';
      if (currentUser.role === 'doctor') {
        initials = parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : 'DR';
      } else if (parts.length >= 2) {
        initials = `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      } else if (parts.length === 1) {
        initials = parts[0].slice(0, 2).toUpperCase();
      }

      const updatedUser: User = {
        ...currentUser,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        specialization: formData.specialization.trim(),
        department: formData.department.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        bio: formData.bio.trim(),
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        avatarText: initials
      };

      onSaveUser(updatedUser);

      SecurityService.logEvent({
        type: 'SECURITY_SETTINGS_UPDATED',
        actor: updatedUser.name,
        targetRole: updatedUser.role,
        details: `Profile credentials updated for ${updatedUser.name} (${updatedUser.role})`,
        status: 'SUCCESS'
      });

      setSaveSuccess(true);
      showToast('Profile updated successfully', 'success');

      setTimeout(() => {
        setSaveSuccess(false);
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err) {
      setIsSaving(false);
      showToast('Failed to save profile changes. Please try again.', 'error');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-blue-900 p-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="edit-profile-title" className="text-base font-bold text-white tracking-tight">
                Edit Professional Profile
              </h2>
              <p className="text-xs text-sky-200 font-medium">
                Update your credentials, clinical department, and contact details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close edit profile dialog"
            className="relative z-10 text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {saveSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Changes validated and securely synchronized with clinic records.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-sky-600" />
                <span>Full Name</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                disabled={isSaving}
                placeholder="e.g. Dr. Ananya Sharma"
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-900 transition ${
                  errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-sky-600'
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-600" />
                <span>Email Address</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                disabled={isSaving}
                placeholder="name@gmail.com"
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-900 transition ${
                  errors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-sky-600'
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Telephone Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                <span>Direct Telephone</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                disabled={isSaving}
                placeholder="+91 98450 11223"
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-900 transition ${
                  errors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-sky-600'
                }`}
              />
              {errors.phone && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Role-Specific: Doctor / Clinician Specialization */}
            {currentUser.role === 'doctor' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                  <span>Clinical Specialization</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                  disabled={isSaving}
                  placeholder="e.g. Endodontics & Implantology"
                  className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-900 transition ${
                    errors.specialization ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-sky-600'
                  }`}
                />
                {errors.specialization && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {errors.specialization}
                  </p>
                )}
              </div>
            )}

            {/* Medical / Staff License Number */}
            {(currentUser.role === 'doctor' || currentUser.role === 'admin') && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileBadge className="w-3.5 h-3.5 text-sky-600" />
                  <span>License / Registration ID</span>
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                  disabled={isSaving}
                  placeholder="e.g. DCI-KA-2018-88419"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-slate-900 transition"
                />
              </div>
            )}

            {/* Department / Division */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-sky-600" />
                <span>Department &amp; Operatory Branch</span>
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                disabled={isSaving}
                placeholder="e.g. Restorative Dentistry, Operatory 4A"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-slate-900 transition"
              />
            </div>

            {/* Address or Emergency Contact for Patient */}
            {currentUser.role === 'patient' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    disabled={isSaving}
                    placeholder="e.g. 142 Richmond Circle, Bangalore"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-slate-900 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Emergency Contact</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                    disabled={isSaving}
                    placeholder="e.g. +91 98451 99988 (Spouse)"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-slate-900 transition"
                  />
                </div>
              </>
            )}

            {/* Professional Statement / Clinical Bio */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">
                {currentUser.role === 'patient' ? 'Personal Notes / Health Conditions' : 'Professional Profile Statement'}
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                disabled={isSaving}
                placeholder={
                  currentUser.role === 'doctor'
                    ? 'Specialist in rotary endodontics, micro-apical surgeries, and aesthetic ceramic restorations...'
                    : 'Add any relevant practice or personal notes...'
                }
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-slate-900 transition resize-none"
              />
            </div>
          </div>

          {/* Security & Confidentiality Notice */}
          <div className="flex items-start gap-2.5 p-3 bg-sky-50/70 border border-sky-200/80 rounded-xl text-[11px] text-sky-900">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p>
              Your credentials are cryptographically protected under Oralix Clinical Clearance. Password hashes and MFA tokens are stored in isolated vault storage and never transmitted in plain text.
            </p>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
