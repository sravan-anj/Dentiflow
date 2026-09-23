import React, { useState } from 'react';
import { ToothIcon } from '../common/ToothIcon';
import { Appointment, Patient } from '../../types';
import { useToast } from '../common/Toast';
import {
  Calendar,
  Clock,
  CheckCircle2,
  X,
  UserCheck,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  ShieldCheck,
  Check
} from 'lucide-react';

interface PublicBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment: (newApt: Appointment) => void;
  existingPatients: Patient[];
}

const SERVICES = [
  { id: 's-1', name: 'Dental Examination & Hygiene Assessment', fee: 1500, duration: 30, desc: 'Comprehensive intraoral check-up, digital X-rays & plaque evaluation' },
  { id: 's-2', name: 'Root Canal Therapy & Endodontics', fee: 8500, duration: 60, desc: 'Microscopic painless pulp extirpation & sealing for infected teeth' },
  { id: 's-3', name: 'Zirconia Crown & Restorative Core', fee: 12000, duration: 45, desc: '3D CAD/CAM scan, precision crown prep & shade matching' },
  { id: 's-4', name: 'Teeth Whitening & Polish', fee: 5000, duration: 45, desc: 'Laser accelerated enamel bleaching & stain removal' },
  { id: 's-5', name: 'Invisalign & Orthodontic Consultation', fee: 2500, duration: 30, desc: 'Digital bite alignment analysis & clear aligner treatment plan' },
  { id: 's-6', name: 'Emergency Pain Relief & X-Ray', fee: 2000, duration: 30, desc: 'Immediate diagnosis, prescription & emergency stabilization' }
];

const DOCTORS = [
  { id: 'd-1', name: 'Dr. Ananya Sharma', specialty: 'Endodontics & Restorative Surgery', qualification: 'MDS (Endodontics)', exp: '12+ Yrs Exp' },
  { id: 'd-2', name: 'Dr. Vikram Mehta', specialty: 'Oral & Maxillofacial Surgery', qualification: 'MDS (Oral Surgery)', exp: '15+ Yrs Exp' },
  { id: 'd-3', name: 'Dr. Rajesh Verma', specialty: 'Periodontics & Dental Implants', qualification: 'MDS (Periodontics)', exp: '10+ Yrs Exp' },
  { id: 'd-4', name: 'Dr. Priya Nair', specialty: 'Aesthetic Dentistry & Orthodontics', qualification: 'MDS (Orthodontics)', exp: '8+ Yrs Exp' }
];

const TIME_SLOTS = [
  '09:30 AM',
  '10:30 AM',
  '11:30 AM',
  '02:00 PM',
  '03:30 PM',
  '04:30 PM'
];

export const PublicBookingModal: React.FC<PublicBookingModalProps> = ({
  isOpen,
  onClose,
  onBookAppointment,
  existingPatients
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<number>(1);
  
  // Selection states
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS[0]);
  const [preferredDate, setPreferredDate] = useState('2026-09-24');
  const [preferredTime, setPreferredTime] = useState('11:30 AM');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Result state
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleNextStep = () => {
    if (step === 3 && preferredDate < todayStr) {
      showToast('Validation Error: Please select today or a future date for your appointment.', 'error');
      return;
    }
    if (step === 5) {
      if (!patientName.trim()) {
        showToast('Please enter your full name.', 'error');
        return;
      }
      if (!phone.trim() || phone.trim().length < 8) {
        showToast('Please enter a valid phone number for appointment confirmation.', 'error');
        return;
      }
      handleFinalBooking();
      return;
    }
    setStep(prev => Math.min(6, prev + 1));
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleFinalBooking = () => {
    const token = `#D-${Math.floor(100 + Math.random() * 900)}`;
    setGeneratedToken(token);

    const newApt: Appointment = {
      id: `apt-pub-${Date.now()}`,
      patientId: 'p-1',
      patientName: patientName.trim(),
      doctorName: selectedDoctor.name,
      doctorId: 'u-doctor',
      chair: 'Chair 1 - Endodontics',
      date: preferredDate,
      time: preferredTime,
      durationMinutes: selectedService.duration,
      procedure: selectedService.name,
      status: 'confirmed',
      tokenNumber: token,
      notes: `Online Self-Booking Studio. Phone: ${phone}. Notes: ${notes || 'None'}`
    };

    onBookAppointment(newApt);
    setIsSuccess(true);
    setStep(6);
    showToast(`Appointment confirmed! Queue Token: ${token}`, 'success');
  };

  const handleResetAndClose = () => {
    setStep(1);
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252525]/60 backdrop-blur-md">
      <div className="bg-white/95 backdrop-blur-2xl border border-stone-200/80 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden text-[#252525] flex flex-col max-h-[90vh]">
        {/* Top Studio Header */}
        <div className="bg-[#F7F5F1] p-5 border-b border-stone-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 flex items-center justify-center text-[#252525] shadow-2xs">
              <ToothIcon size={20} />
            </span>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EDE8DE] text-[10px] font-extrabold uppercase tracking-wider text-[#252525] border border-[#C8B58D]/20 mb-0.5">
                <Sparkles className="w-3 h-3 text-[#C8B58D]" />
                <span>Clinical Booking Studio</span>
              </div>
              <h2 className="text-base font-extrabold text-[#252525] tracking-tight">
                Schedule Your Appointment
              </h2>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-xl text-[#6F6D69] hover:text-[#252525] hover:bg-[#EDE8DE] flex items-center justify-center text-sm cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        {!isSuccess && (
          <div className="bg-white px-6 py-3 border-b border-stone-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <div
                  key={s}
                  onClick={() => s < step && setStep(s)}
                  className={`flex items-center justify-center rounded-full text-[11px] font-extrabold transition cursor-pointer ${
                    step === s
                      ? 'w-6 h-6 bg-[#252525] text-white shadow-2xs'
                      : s < step
                      ? 'w-6 h-6 bg-[#8FA88D]/20 text-[#3B4D3A] border border-[#8FA88D]/30'
                      : 'w-6 h-6 bg-[#EDE8DE] text-[#6F6D69]'
                  }`}
                >
                  {s < step ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
              ))}
            </div>
            <span className="text-xs font-bold text-[#6F6D69]">
              {step === 1 && 'Step 1: Choose Service'}
              {step === 2 && 'Step 2: Select Clinician'}
              {step === 3 && 'Step 3: Select Date'}
              {step === 4 && 'Step 4: Select Available Time'}
              {step === 5 && 'Step 5: Review & Patient Info'}
            </span>
          </div>
        )}

        {/* Modal Body / Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 grow">
          {/* STEP 1: CHOOSE SERVICE */}
          {step === 1 && (
            <div className="space-y-3.5">
              <div>
                <h3 className="text-sm font-extrabold text-[#252525]">Step 1: Select Dental Service / Treatment</h3>
                <p className="text-xs text-[#6F6D69]">Choose the primary reason for your clinical appointment.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICES.map(srv => {
                  const isSelected = selectedService.id === srv.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedService(srv)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer text-left space-y-1.5 ${
                        isSelected
                          ? 'bg-[#EDE8DE]/60 border-[#C8B58D] text-[#252525] shadow-xs'
                          : 'bg-white/80 border-stone-200/80 text-[#252525] hover:border-[#C8B58D]/60 hover:bg-[#F7F5F1]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#252525]">{srv.name}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#252525] text-white flex items-center justify-center text-[10px]">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6F6D69] leading-tight">{srv.desc}</p>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="font-extrabold text-[#594723]">₹{srv.fee.toLocaleString()}</span>
                        <span className="text-[#999690]">{srv.duration} mins</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE DOCTOR */}
          {step === 2 && (
            <div className="space-y-3.5">
              <div>
                <h3 className="text-sm font-extrabold text-[#252525]">Step 2: Select Preferred Specialist</h3>
                <p className="text-xs text-[#6F6D69]">Select your treating dentist or clinician.</p>
              </div>

              <div className="space-y-2.5">
                {DOCTORS.map(doc => {
                  const isSelected = selectedDoctor.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#EDE8DE]/60 border-[#C8B58D] text-[#252525] shadow-xs'
                          : 'bg-white/80 border-stone-200/80 text-[#252525] hover:border-[#C8B58D]/60 hover:bg-[#F7F5F1]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 flex items-center justify-center text-[#252525] font-bold text-sm shrink-0">
                          <Stethoscope className="w-5 h-5 text-[#C8B58D]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#252525]">{doc.name}</h4>
                          <p className="text-[11px] text-[#6F6D69]">{doc.specialty}</p>
                          <span className="text-[10px] font-semibold text-[#999690]">{doc.qualification} &bull; {doc.exp}</span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-[#252525] text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#C8B58D]">Select</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: CHOOSE DATE */}
          {step === 3 && (
            <div className="space-y-3.5">
              <div>
                <h3 className="text-sm font-extrabold text-[#252525]">Step 3: Choose Appointment Date</h3>
                <p className="text-xs text-[#6F6D69]">Select your preferred calendar date for the clinical visit.</p>
              </div>

              <div className="p-4 bg-white/80 rounded-2xl border border-stone-200/80 space-y-3">
                <label className="block text-xs font-bold text-[#252525]">
                  Select Date *
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C8B58D]" />
                  <input
                    type="date"
                    min={todayStr}
                    value={preferredDate}
                    onChange={e => setPreferredDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-stone-200/80 rounded-xl bg-white text-[#252525] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 font-bold"
                  />
                </div>
                <p className="text-[11px] text-[#6F6D69]">
                  Same-day emergency consultation slots are open based on operatory availability.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: CHOOSE TIME */}
          {step === 4 && (
            <div className="space-y-3.5">
              <div>
                <h3 className="text-sm font-extrabold text-[#252525]">Step 4: Select Available Time Slot</h3>
                <p className="text-xs text-[#6F6D69]">Choose an operatory time slot for {preferredDate}.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {TIME_SLOTS.map(t => {
                  const isSelected = preferredTime === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPreferredTime(t)}
                      className={`p-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#252525] border-[#252525] text-white shadow-xs'
                          : 'bg-white border-stone-200 text-[#252525] hover:bg-[#F7F5F1] hover:border-[#C8B58D]'
                      }`}
                    >
                      <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C8B58D]' : 'text-[#6F6D69]'}`} />
                      <span>{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & PATIENT DETAILS */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#252525]">Step 5: Patient Details &amp; Summary</h3>
                <p className="text-xs text-[#6F6D69]">Review appointment information and provide contact details.</p>
              </div>

              {/* Summary Card */}
              <div className="p-4 bg-[#EDE8DE]/40 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
                <div className="flex justify-between pb-1.5 border-b border-stone-200/80 font-extrabold text-[#C8B58D] text-[11px] uppercase tracking-wider">
                  <span>Appointment Summary</span>
                  <span>DentiFlow Studio</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F6D69]">Service:</span>
                  <span className="font-bold text-[#252525]">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F6D69]">Clinician:</span>
                  <span className="font-bold text-[#252525]">{selectedDoctor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F6D69]">Date &amp; Time:</span>
                  <span className="font-bold text-[#252525]">{preferredDate} at {preferredTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F6D69]">Estimated Fee:</span>
                  <span className="font-extrabold text-[#594723]">₹{selectedService.fee.toLocaleString()}</span>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    className="w-full px-3 py-2 text-xs border border-stone-200/80 rounded-xl bg-white text-[#252525] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1">
                    Phone Number (for SMS &amp; Token updates) *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full px-3 py-2 text-xs border border-stone-200/80 rounded-xl bg-white text-[#252525] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1">
                    Additional Symptoms / Treatment Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Tooth sensitivity or mild ache in lower right molar..."
                    className="w-full p-2.5 text-xs border border-stone-200/80 rounded-xl bg-white text-[#252525] focus:outline-none focus:border-[#C8B58D] focus:ring-2 focus:ring-[#C8B58D]/20 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: CONFIRMATION SUCCESS STATE */}
          {step === 6 && isSuccess && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-[#8FA88D]/20 border border-[#8FA88D]/40 text-[#3B4D3A] rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-[#8FA88D]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#252525]">Your Appointment is Confirmed!</h3>
                <p className="text-xs text-[#6F6D69] mt-1">
                  We look forward to seeing you, <span className="font-bold text-[#252525]">{patientName}</span>.
                </p>
              </div>

              <div className="p-4 bg-[#EDE8DE]/40 rounded-2xl border border-stone-200/80 text-xs space-y-2 text-left max-w-sm mx-auto">
                <div className="flex justify-between pb-1.5 border-b border-stone-200/80 font-bold text-[#C8B58D] text-[11px] uppercase tracking-wider">
                  <span>Queue Token Number</span>
                  <span className="font-mono text-[#252525] text-xs font-black">{generatedToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F6D69]">Date &amp; Time:</span>
                  <span className="font-bold text-[#252525]">{preferredDate} at {preferredTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F6D69]">Clinician:</span>
                  <span className="font-bold text-[#252525]">{selectedDoctor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F6D69]">Procedure:</span>
                  <span className="font-bold text-[#252525]">{selectedService.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-[#F7F5F1] p-4 border-t border-stone-200/80 flex items-center justify-between shrink-0">
          {!isSuccess ? (
            <>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="button"
                onClick={handleNextStep}
                className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>{step === 5 ? 'Confirm Appointment' : 'Next Step'}</span>
                <ChevronRight className="w-4 h-4 text-[#C8B58D]" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleResetAndClose}
              className="btn-primary w-full text-xs cursor-pointer py-2.5"
            >
              Done &amp; Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
