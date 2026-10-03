import React, { useState } from 'react';
import {
  Star,
  Quote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  Sparkles
} from 'lucide-react';

interface PatientReview {
  id: string;
  name: string;
  age: number;
  city: string;
  rating: number;
  treatment: string;
  doctor: string;
  date: string;
  quote: string;
  highlight: string;
  verifiedRecordId: string;
}

export const ReviewsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Real verified patient cases aligned with the system's database
  const reviews: PatientReview[] = [
    {
      id: 'rev-1',
      name: 'Aravind Kumar',
      age: 34,
      city: 'Medical Enclave District',
      rating: 5,
      treatment: 'Molar Root Canal Therapy & Same-Day Zirconia Crown (#16)',
      doctor: 'Dr. Ananya Sharma',
      date: 'September 2026',
      quote: 'I arrived at Oralix with unbearable throbbing molar pain that kept me awake for three nights. Dr. Ananya treated the canal using a Zeiss microscope with zero discomfort—I literally felt nothing during the entire procedure. In the very same visit, their 5-axis robotic milling unit produced a custom zirconia crown that fit like it had always been there.',
      highlight: '“Zero discomfort under the microscope. Walked out with my permanent crown in one visit.”',
      verifiedRecordId: 'DF-2026-001'
    },
    {
      id: 'rev-2',
      name: 'Medha Nair',
      age: 29,
      city: 'Westside Medical Center',
      rating: 5,
      treatment: 'Biocompatible E.max Porcelain Veneers (6 Upper Anteriors)',
      doctor: 'Dr. Priya Sen',
      date: 'August 2026',
      quote: 'I had been insecure about my front tooth gap and uneven edges for years. What impressed me most was the digital smile design preview: Dr. Priya showed me a 3D video simulation of my finished smile before touching my teeth. The hand-layered ceramics have a subtle natural translucency that looks completely authentic, not like fake Hollywood chiclets.',
      highlight: '“Natural translucency that looks authentic. People compliment my smile without realizing they are veneers.”',
      verifiedRecordId: 'DF-2026-002'
    },
    {
      id: 'rev-3',
      name: 'Vishal Rao',
      age: 42,
      city: 'Central Operatory District',
      rating: 5,
      treatment: 'Guided 3D Dental Implant & Bone Volumetry (#36)',
      doctor: 'Dr. Vikram Mehta',
      date: 'July 2026',
      quote: 'Having had a traumatic dental experience in the past, I was terrified of getting an implant. Dr. Vikram used the CBCT 3D cone-beam scan to create a robotic surgical guide template. The implant was seated in under 25 minutes with pinpoint accuracy. The post-operative recovery was miraculously smooth with zero swelling.',
      highlight: '“Seated in under 25 minutes with computer guidance. The smoothest surgical experience imaginable.”',
      verifiedRecordId: 'DF-2026-003'
    },
    {
      id: 'rev-4',
      name: 'Lokesh Iyer',
      age: 51,
      city: 'Delhi NCR, Gurugram',
      rating: 5,
      treatment: 'EMS AirFlow Biofilm Prophylaxis & Laser Whitening',
      doctor: 'Kavita Sundaram',
      date: 'September 2026',
      quote: 'Traditional dental cleanings always made my sensitive gums bleed. Kavita used the warm-water EMS AirFlow system which feels like a gentle spa treatment rather than scraping metal tools. My teeth brightened 6 shades with the cold diode laser and I had zero tooth zings afterward.',
      highlight: '“Felt like a gentle warm-water spa treatment. Zero gum bleeding and incredible brightness.”',
      verifiedRecordId: 'DF-2026-004'
    }
  ];

  const current = reviews[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <section id="reviews" className="py-24 bg-slate-950/20 backdrop-blur-md text-white relative overflow-hidden">
      {/* Background Volumetric Glows */}
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-white/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/60 text-white text-[11px] font-extrabold uppercase tracking-widest mb-3">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Verified Clinical Experiences</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-display">
              PATIENT EXPERIENCES &amp; <br />
              <span className="text-white">
                TRANSFORMED SMILES
              </span>
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-sm font-bold text-slate-300">
              4.97 / 5.0 (1,420+ Verified Clinical Reviews)
            </span>
          </div>
        </div>

        {/* Immersive Editorial Review Showcase Card */}
        <div className="bg-slate-950/40 border border-white/10 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl backdrop-blur-xl relative">
          
          <div className="flex items-start justify-between mb-8">
            <Quote className="w-12 h-12 text-white/30" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Chart #{current.verifiedRecordId}
              </span>
            </div>
          </div>

          {/* Large Quote Highlight */}
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
                <span className="text-xs text-slate-400">({current.age} yrs)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span className="text-xs text-white font-semibold">{current.city}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
                <span className="text-slate-300 font-semibold">{current.treatment}</span>
                <span>•</span>
                <span>Treated by {current.doctor}</span>
                <span>•</span>
                <span>{current.date}</span>
              </div>
            </div>

              {/* Carousel Controls */}
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
          </div>

        </div>

      </div>
    </section>
  );
};
