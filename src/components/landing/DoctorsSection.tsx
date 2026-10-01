import React, { useState } from 'react';
import {
  Award,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowUpRight,
  Shield,
  Stethoscope,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { INITIAL_STAFF } from '../../data/seedData';
import { StaffMember } from '../../types';

interface DoctorsSectionProps {
  onOpenBooking: () => void;
}

export const DoctorsSection: React.FC<DoctorsSectionProps> = ({ onOpenBooking }) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(INITIAL_STAFF[0].id);

  // Real clinical staff from the database seedData
  const doctors: (StaffMember & {
    experienceYears: string;
    biography: string;
    education: string[];
    specialtyFocus: string[];
    photo: string;
  })[] = [
    {
      ...INITIAL_STAFF[0],
      experienceYears: '14+ Years Clinical Mastery',
      biography: 'Specializes in high-precision microscopic endodontics, pulp revascularization, and complex tooth preservation. Trained in advanced microscopic endodontics, Dr. Sharma uses 25x optical magnification to ensure every root canal retains natural tooth longevity with zero surgical discomfort.',
      education: ['MDS Endodontics & Conservative Dentistry', 'Advanced Microscopic Endodontics Fellow', 'Reg. No. KDC-18921-A'],
      specialtyFocus: ['Microscopic Root Canal Therapy', 'Biomimetic Tooth Reconstruction', 'CAD/CAM Zirconia Crowns'],
      photo: '/Consulting.png'
    },
    {
      ...INITIAL_STAFF[1],
      experienceYears: '18+ Years Surgical Experience',
      biography: 'Fellow of the International Board for Oral & Maxillofacial Surgery (FIBOMS). Renowned for computer-guided full-arch implant rehabilitation, ridge augmentation, and painless third molar extractions under conscious sedation.',
      education: ['MDS Oral & Maxillofacial Surgery', 'FIBOMS Fellow of Int. Board', 'Reg. No. KDC-14209-B'],
      specialtyFocus: ['Computer-Guided 3D Implants', 'Full-Arch All-on-4 Rehabilitation', 'Sinus Lift & Bone Grafting'],
      photo: '/Analyzing the problem.png'
    },
    {
      ...INITIAL_STAFF[2],
      experienceYears: '11+ Years Aesthetic Focus',
      biography: 'Pioneer in facial aesthetic harmony, clear aligner biomechanics, and hand-layered ultra-thin porcelain veneers. Dr. Sen merges digital smile simulation with minimal-prep techniques to craft bespoke, luminous smiles.',
      education: ['BDS Dental Surgery', 'PGD Orthodontics & Clear Aligners', 'Reg. No. KDC-22019-C'],
      specialtyFocus: ['Invisalign Clear Aligners', 'Biocompatible E.max Veneers', 'Laser Gingival Contouring'],
      photo: '/Interaction.png'
    },
    {
      ...INITIAL_STAFF[3],
      experienceYears: '12+ Years Preventive Leadership',
      biography: 'Oversees clinic-wide sterile operatory protocols, ultrasonic biofilm decontamination, and non-peroxide cold laser enamel brightening. Certified in pain-free EMS AirFlow prophylaxis.',
      education: ['RDH Registered Dental Hygienist', 'Infection Control Protocol Master', 'Reg. No. DHC-0912'],
      specialtyFocus: ['EMS AirFlow Biofilm Prophylaxis', 'Diode Laser Teeth Whitening', 'Deep Periodontal Therapy'],
      photo: '/Check-up.png'
    }
  ];

  const activeDoctor = doctors.find((d) => d.id === selectedStaffId) || doctors[0];

  return (
    <section id="doctors" className="py-24 bg-transparent relative overflow-hidden text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-display [text-shadow:_0_3px_15px_rgba(0,0,0,0.9)]">
              MASTER CLINICIANS &amp; <br />
              DENTAL SURGEONS
            </h2>
          </div>
          <p className="text-sm text-slate-200 max-w-md font-medium leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            Our multi-disciplinary team brings together board-certified endodontists, maxillofacial surgeons, and aesthetic orthodontists operating with calibrated clinical precision.
          </p>
        </div>

        {/* Doctors Roster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {doctors.map((doc) => {
            const isSelected = doc.id === selectedStaffId;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedStaffId(doc.id)}
                className={`rounded-3xl p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-slate-900/80 border-white/60 shadow-lg shadow-white/10 scale-[1.02]'
                    : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                {/* Portrait Thumbnail */}
                <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-4 border border-slate-800/80">
                  <img
                    src={doc.photo}
                    alt={doc.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${isSelected ? 'from-slate-950/90' : 'from-slate-950/70'} via-transparent to-transparent`} />
                  
                  {/* Status chip */}
                  <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{(doc.assignedChair || 'Operatory Chair 1').split(' - ')[0]}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest block mb-1 text-white">
                    {doc.role}
                  </span>
                  <h3 className="text-lg font-black tracking-tight font-display mb-1 text-white">
                    {doc.name}
                  </h3>
                  <p className="text-xs font-semibold mb-3 text-slate-400">
                    {doc.specialization}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-white" />
                    {(doc.availability || 'Mon - Fri 09:00 - 18:00').split(' (')[0]}
                  </span>
                  <span className="text-white">
                    Inspect Profile →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Clinician Comprehensive Dossier */}
        <div className="bg-slate-950/40 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-8 flex flex-col">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
              <span className="text-xs font-black uppercase tracking-widest bg-white/10 text-slate-200 px-3 py-1 rounded-md border border-white/20">
                {activeDoctor.role}
              </span>
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-white" />
                {activeDoctor.registrationNumber}
              </span>
              <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                {activeDoctor.experienceYears}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight mb-2">
              {activeDoctor.name}
            </h3>
            <p className="text-sm font-bold text-white mb-4">
              {activeDoctor.specialization}
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium mb-6">
              {activeDoctor.biography}
            </p>

            {/* Specialties & Education */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                  Clinical Focus Areas:
                </span>
                <div className="space-y-1.5">
                  {activeDoctor.specialtyFocus.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                  Accreditations &amp; Fellowships:
                </span>
                <div className="space-y-1.5">
                  {activeDoctor.education.map((edu, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{edu}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-white" />
                Clinic Hours: {activeDoctor.availability}
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-white" />
                {activeDoctor.assignedChair}
              </span>
            </div>
          </div>

          {/* Right Column: Direct Booking Action Card */}
          <div className="lg:col-span-4 bg-slate-950/40 rounded-2xl border border-white/10 p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider mb-1">
                Direct Operatory Allocation
              </span>
              <h4 className="text-base font-black text-white font-display mb-2">
                Consult With {activeDoctor.name}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Schedule your comprehensive oral evaluation or procedure directly with this clinician. Our scheduling engine reserves sterile operatory setup specifically for your case.
              </p>

              <div className="bg-white/10 rounded-xl p-3 border border-white/20 text-xs font-bold text-slate-200 mb-6 flex items-center justify-between backdrop-blur-md">
                <span>Active Cases Today:</span>
                <span className="font-black text-white">{activeDoctor.activePatientsToday} Patients</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenBooking}
              className="relative overflow-hidden group w-full py-3.5 px-4 rounded-xl bg-white/90 hover:bg-white text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer border border-white/60"
            >
              <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />
              <Calendar className="w-4 h-4 text-slate-950 relative z-10" />
              <span className="relative z-10 text-slate-950 font-black">Book With {activeDoctor.name.split(' ')[1]}</span>
              <ArrowUpRight className="w-4 h-4 text-slate-950 relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
