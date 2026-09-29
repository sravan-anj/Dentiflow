import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { apiClient } from '../../utils/apiClient';
import {
  Star,
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CornerDownRight,
  ShieldCheck,
  Plus
} from 'lucide-react';

interface FeedbackViewProps {
  currentUser: User;
}

interface FeedbackItem {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  doctorName?: string;
  treatmentName?: string;
  rating: number;
  comment: string;
  verified: boolean;
  published: boolean;
  createdAt: string;
  clinicResponse?: string;
  respondedAt?: string;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ currentUser }) => {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Patient submission form
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [treatmentName, setTreatmentName] = useState('Routine Checkup & Prophylaxis');
  const [doctorName, setDoctorName] = useState('Dr. Ananya Sharma');
  const [submitting, setSubmitting] = useState(false);

  // Clinician / Admin response form
  const [respondingToId, setRespondingToId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);

  const isPatient = currentUser.role === 'patient';
  const isClinicianOrAdmin = currentUser.role === 'doctor' || currentUser.role === 'admin';

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.feedback.list();
      if (res && res.success) {
        setFeedbackList((res as any).feedback || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load reviews and feedback.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 5) {
      alert('Please provide a comment of at least 5 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.feedback.submit({
        rating,
        comment: comment.trim(),
        treatmentName,
        doctorName
      });

      if (res && res.success) {
        setIsSubmitModalOpen(false);
        setComment('');
        setRating(5);
        await loadFeedback();
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResponse = async (feedbackId: string) => {
    if (!responseText.trim()) return;

    try {
      setResponding(true);
      const res = await apiClient.feedback.respond(feedbackId, responseText.trim());
      if (res && res.success) {
        setRespondingToId(null);
        setResponseText('');
        await loadFeedback();
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to record response.');
    } finally {
      setResponding(false);
    }
  };

  const avgRating = feedbackList.length > 0
    ? (feedbackList.reduce((acc, f) => acc + f.rating, 0) / feedbackList.length).toFixed(1)
    : 'N/A';

  const unansweredCount = feedbackList.filter(f => !f.clinicResponse).length;

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-bold uppercase tracking-wider mb-1 border border-[#C8B58D]/30">
            <Sparkles className="w-3 h-3 text-[#C8B58D]" />
            <span>Patient Experience &amp; Reviews Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#252525] tracking-tight">
            Clinical Feedback &amp; Ratings
          </h1>
          <p className="text-xs text-[#6F6D69]">
            {isPatient
              ? 'Share your treatment impressions, rate your attending clinician, and review clinic responses.'
              : 'Monitor real patient sentiment, maintain verified public reviews, and publish clinician replies.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isPatient && (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Review</span>
            </button>
          )}

          <button
            onClick={loadFeedback}
            disabled={loading}
            className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C8B58D] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards for Clinicians & Admins */}
      {isClinicianOrAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-extrabold text-[#6F6D69] uppercase tracking-wide block">Average Rating</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-black text-[#252525]">{avgRating}</span>
              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${Number(avgRating) >= star ? 'fill-current' : 'text-stone-300'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[11px] text-[#6F6D69] mt-0.5">{feedbackList.length} verified submissions</p>
          </div>

          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-extrabold text-[#6F6D69] uppercase tracking-wide block">Total Reviews</span>
            <p className="text-3xl font-black text-[#252525] mt-1">{feedbackList.length}</p>
            <p className="text-[11px] text-[#3B4D3A] font-bold mt-0.5">100% verified authenticated patients</p>
          </div>

          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-extrabold text-[#6F6D69] uppercase tracking-wide block">Awaiting Reply</span>
            <p className="text-3xl font-black text-[#252525] mt-1">{unansweredCount}</p>
            <p className="text-[11px] text-[#C5A66A] font-bold mt-0.5">Clinic responses build patient trust</p>
          </div>
        </div>
      )}

      {/* Main Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#6F6D69] space-y-2">
            <RefreshCw className="w-6 h-6 text-[#C8B58D] animate-spin mx-auto" />
            <p>Loading patient reviews...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-xs text-rose-800">
            <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
            <p className="font-bold">{error}</p>
            <button onClick={loadFeedback} className="mt-2 text-rose-700 underline font-bold">Try Again</button>
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-12 text-center text-xs text-[#6F6D69] space-y-3">
            <MessageSquare className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="font-extrabold text-sm text-[#252525]">No reviews recorded yet</h3>
            <p className="max-w-md mx-auto">
              {isPatient
                ? 'You have not submitted feedback for your dental visits yet. Tell us about your treatment experience.'
                : 'No patient reviews have been recorded in the database yet. Patient submissions will appear here in real-time.'}
            </p>
            {isPatient && (
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="btn-primary text-xs font-bold inline-flex items-center gap-1.5 mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit First Review</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackList.map(item => (
              <div
                key={item.id}
                className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-3"
              >
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#EDE8DE] text-[#252525] font-black text-xs flex items-center justify-center border border-[#C8B58D]/30">
                      {item.patientName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#252525]">{item.patientName}</span>
                        {item.verified && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#8FA88D]/20 text-[#3B4D3A] text-[9px] font-extrabold uppercase">
                            <ShieldCheck className="w-3 h-3 text-[#8FA88D]" />
                            Verified Patient
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6F6D69]">
                        {item.treatmentName || 'Dental Care'} &bull; Attending: {item.doctorName || 'Dr. Ananya Sharma'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex text-amber-500">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${item.rating >= s ? 'fill-current' : 'text-stone-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#6F6D69] font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Review Comment */}
                <p className="text-xs text-[#252525] leading-relaxed">
                  "{item.comment}"
                </p>

                {/* Clinic Response (if any) */}
                {item.clinicResponse ? (
                  <div className="bg-[#EDE8DE]/50 rounded-xl p-3.5 border border-[#C8B58D]/30 flex items-start gap-2.5 text-xs text-[#252525] mt-2">
                    <CornerDownRight className="w-4 h-4 text-[#C8B58D] shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-[#252525]">Oralix Clinical Team Response</span>
                        <span className="text-[10px] text-[#6F6D69]">
                          {item.respondedAt ? new Date(item.respondedAt).toLocaleDateString() : 'Replied'}
                        </span>
                      </div>
                      <p className="text-[#6F6D69] text-xs leading-relaxed">{item.clinicResponse}</p>
                    </div>
                  </div>
                ) : isClinicianOrAdmin ? (
                  <div className="pt-1">
                    {respondingToId === item.id ? (
                      <div className="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
                        <textarea
                          rows={2}
                          value={responseText}
                          onChange={e => setResponseText(e.target.value)}
                          placeholder="Type an official clinic reply to the patient..."
                          className="w-full text-xs p-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#C8B58D]"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setRespondingToId(null);
                              setResponseText('');
                            }}
                            className="px-3 py-1 text-xs text-stone-600 font-bold hover:bg-stone-200 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSendResponse(item.id)}
                            disabled={responding}
                            className="btn-primary text-xs font-bold px-3 py-1 flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>{responding ? 'Saving...' : 'Publish Response'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setRespondingToId(item.id);
                          setResponseText('');
                        }}
                        className="text-xs text-[#C8B58D] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Reply as Clinic Clinician</span>
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Feedback Modal for Patients */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-current" />
                <h3 className="font-extrabold text-base text-[#252525]">Share Visit Feedback</h3>
              </div>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-stone-400 hover:text-stone-600">✕</button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">Overall Satisfaction Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      className="p-1.5 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${s <= rating ? 'text-amber-500 fill-current' : 'text-stone-300'}`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#252525] ml-2">
                    {rating === 5 ? 'Exceptional (5/5)' : rating === 4 ? 'Very Good (4/5)' : rating === 3 ? 'Satisfactory (3/5)' : 'Needs Improvement'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1">Treatment / Procedure</label>
                  <input
                    type="text"
                    value={treatmentName}
                    onChange={e => setTreatmentName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#252525] mb-1">Attending Clinician</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">Clinical Experience Comments</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Describe your appointment, pain management, staff communication, or treatment results..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-[#252525] rounded-xl text-xs font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs font-bold"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
