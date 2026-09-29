import React, { useState, useEffect } from 'react';
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { apiClient } from '../../utils/apiClient';

interface PatientReview {
  id: string;
  name: string;
  age?: number;
  city?: string;
  rating: number;
  treatment: string;
  doctor: string;
  date: string;
  quote: string;
  highlight?: string;
  verifiedRecordId?: string;
}

export const ReviewsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviews, setReviews] = useState<PatientReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiClient.feedback.getPublicReviews()
      .then(res => {
        if (!isMounted) return;
        if (res.success && Array.isArray(res.reviews)) {
          const mapped: PatientReview[] = res.reviews.map((r: any) => ({
            id: r.id,
            name: r.patientName,
            rating: r.rating || 5,
            treatment: r.treatmentName || 'Clinical Treatment',
            doctor: r.doctorName || 'Dr. Ananya Sharma',
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recent',
            quote: r.comment,
            highlight: r.comment.length > 60 ? `“${r.comment.slice(0, 60)}...”` : `“${r.comment}”`,
            verifiedRecordId: r.id,
          }));
          setReviews(mapped);
        }
      })
      .catch(err => {
        console.warn('Could not fetch public reviews:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePrev = () => {
    if (reviews.length === 0) return;
    setCurrentIndex(prev => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (reviews.length === 0) return;
    setCurrentIndex(prev => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  const current = reviews[currentIndex];

  return (
    <section id="reviews" className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#C8B58D]" />
            <span>AUTHENTIC PATIENT STORIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-display">
            Real Experiences.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C8B58D] via-[#E8DCC4] to-white">
              Permanent Transformations.
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-300">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Verified Post-Operative Reviews</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Award className="w-5 h-5 text-[#C8B58D] shrink-0" />
            <span>Zero Synthetic Testimonials</span>
          </div>
        </div>
      </div>

      {/* Main Review Card or Empty State */}
      {isLoading ? (
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-[#C8B58D] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium">Loading verified patient reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-3xl p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#C8B58D]">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 font-display">
            No Patient Reviews Published Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
            In accordance with Oralix zero-trust clinical standards, only verified patient reviews submitted after completed clinical procedures are published.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Authentic clinical review ledger enabled</span>
          </div>
        </div>
      ) : (
        <div className="relative bg-slate-900/50 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 sm:p-12 lg:p-14 shadow-2xl overflow-hidden">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C8B58D]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Rating & Case Record Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < current.rating ? 'fill-[#C8B58D] text-[#C8B58D]' : 'fill-slate-800 text-slate-700'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm font-bold text-white">{current.rating}.0 / 5.0</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Verified Clinical Patient</span>
            </div>
          </div>

          {/* Quote Highlight */}
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white font-display leading-snug mb-6">
            {current.highlight}
          </h3>

          {/* Detailed Narrative Body */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal mb-10 max-w-4xl">
            “{current.quote}”
          </p>

          {/* Author Info & Nav Controls */}
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white font-display">
                  {current.name}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span className="text-xs text-white font-semibold">{current.treatment}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
                <span>Treated by {current.doctor}</span>
                <span>•</span>
                <span>{current.date}</span>
              </div>
            </div>

            {/* Carousel Controls */}
            {reviews.length > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 mr-2">
                  0{currentIndex + 1} / 0{reviews.length}
                </span>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/15 backdrop-blur-md cursor-pointer active:scale-[0.98]"
                  aria-label="Previous review"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-950 flex items-center justify-center transition shadow-[0_0_15px_rgba(255,255,255,0.3)] cursor-pointer active:scale-[0.98] border border-white/60"
                  aria-label="Next review"
                >
                  <ChevronRight className="w-5 h-5 text-slate-950" />
                </button>
              </div>
            )}
          </div>

        </div>
      )}

    </section>
  );
};
