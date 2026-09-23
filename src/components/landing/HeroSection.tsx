import React, { useState } from 'react';
import {
  Calendar,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Clock,
  CheckCircle2,
  ChevronDown,
  Activity,
  Award
} from 'lucide-react';

interface HeroSectionProps {
  onOpenBooking: () => void;
  onOpenPortal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenBooking,
  onOpenPortal
}) => {
  const [isHoveredCta, setIsHoveredCta] = useState(false);

  return (
    <section
      id="hero"
      className="relative min-h-[90vh] pt-28 pb-16 flex flex-col justify-center items-center overflow-hidden bg-transparent text-white"
    >
      {/* Main Composition: Flanking Editorial Pure White Typography & Open Central Viewport for Background Tooth */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Large Editorial Headline Structure */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-2 my-4 sm:my-6">
          
          {/* Left Typography Block */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black tracking-tight text-white font-display leading-[0.95] select-none [text-shadow:_0_3px_15px_rgba(0,0,0,0.9)]">
              SHINE <br />
              BRIGHT <br />
              LIKE
            </h1>
            <p className="mt-4 text-xs sm:text-sm font-medium text-white max-w-xs leading-relaxed hidden lg:block drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Architectural smile restoration engineered with sub-10 micron optical accuracy and computerized microscopic comfort.
            </p>
          </div>

          {/* Clean Open Negative Space — Allows the background video tooth to sit prominently in the visual center */}
          <div className="hidden lg:block lg:col-span-2 min-h-[160px] pointer-events-none" />

          {/* Right Typography Block */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end text-center lg:text-right z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black tracking-tight text-white font-display leading-[0.95] select-none [text-shadow:_0_3px_15px_rgba(0,0,0,0.9)]">
              A DENTAL <br />
              GLOW!
            </h1>
            <p className="mt-4 text-xs sm:text-sm font-medium text-white max-w-xs leading-relaxed hidden lg:block text-right drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Same-day AI ceramic crowns, robotic 3D cone-beam implantology, and painless laser aesthetic whitening.
            </p>
          </div>
        </div>

        {/* Narrative Subtitle for Mobile / Tablet */}
        <p className="lg:hidden text-center text-sm font-medium text-white max-w-md my-4 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          Architectural dental medicine combining digital precision, painless computerized anesthesia, and biocompatible ceramics.
        </p>

        {/* Master Call To Action — "BOOK YOUR APPOINTMENT NOW" */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xl z-10">
          <button
            type="button"
            id="hero-book-cta"
            onClick={onOpenBooking}
            onMouseEnter={() => setIsHoveredCta(true)}
            onMouseLeave={() => setIsHoveredCta(false)}
            className="relative overflow-hidden w-full sm:w-auto px-8 sm:px-10 py-4 rounded-2xl bg-white/90 hover:bg-white text-slate-950 font-black text-sm sm:text-base tracking-wider shadow-[0_0_30px_rgba(255,255,255,0.35)] hover:shadow-[0_0_45px_rgba(255,255,255,0.6)] transition-all duration-200 flex items-center justify-center gap-3 group active:scale-[0.98] cursor-pointer border border-white/60 backdrop-blur-md"
          >
            {/* Shimmer light sweep */}
            <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

            <Calendar className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform relative z-10" />
            <span className="relative z-10 text-slate-950 font-black">BOOK YOUR APPOINTMENT NOW</span>
            {isHoveredCta ? (
              <ArrowUpRight className="w-5 h-5 text-slate-950 transition-all translate-x-0.5 -translate-y-0.5 relative z-10" />
            ) : (
              <ArrowRight className="w-5 h-5 text-slate-950 transition-all group-hover:translate-x-1 relative z-10" />
            )}
          </button>

          <a
            href="#technology"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm tracking-wide shadow-lg border border-white/15 backdrop-blur-md transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.98]"
          >
            <span>Explore Technology</span>
            <ChevronDown className="w-4 h-4 text-white group-hover:translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* Clinical Value Proof Ribbon */}
        <div className="mt-12 pt-8 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 text-center z-10 backdrop-blur-md bg-slate-950/30 border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-black text-white font-display">14,200+</span>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">Smiles Perfected</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-black text-white font-display">&lt; 10 µm</span>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">Scan Accuracy</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-black text-white font-display">45 Mins</span>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">Same-Day Crown</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-black text-white font-display">4.9 / 5.0</span>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">Verified Reviews</span>
          </div>
        </div>
      </div>
    </section>
  );
};
