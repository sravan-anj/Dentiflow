import React, { useState, useRef, useCallback } from 'react';
import {
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronRight,
  User,
  Sliders
} from 'lucide-react';

interface CaseStudy {
  id: string;
  patientName: string;
  treatment: string;
  duration: string;
  doctor: string;
  beforeDescription: string;
  afterDescription: string;
  shadeTransition: string;
  clinicalNotes: string;
  // Visual representations for Before and After
  beforeImg: string;
  afterImg: string;
  beforeBadge: string;
  afterBadge: string;
}

export const BeforeAfterSection: React.FC = () => {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cases: CaseStudy[] = [
    {
      id: 'case-1',
      patientName: 'Ashwini Goud (Age 28)',
      treatment: 'Hand-Layered Biocompatible E.max Porcelain Veneers (6 Upper Anteriors)',
      duration: '2 Appointments (10 Days)',
      doctor: 'Dr. Priya Sen (Cosmetic Associate)',
      beforeDescription: 'Moderate midline diastema (2.8mm gap), severe tetracycline enamel discoloration, uneven incisal edge embrasures.',
      afterDescription: 'Harmonious golden proportion smile architecture, closed midline gap, ultra-thin 0.3mm ceramic veneers in VITA Bleach Shade BL2 with lifelike mamelon translucency.',
      shadeTransition: 'VITA A3.5 → BL2 Bleach',
      clinicalNotes: 'Zero dental pulp exposure; conservative enamel preservation prep; 100% bonded with light-cure resin.',
      beforeImg: '/Consulting.png',
      afterImg: '/Interaction.png',
      beforeBadge: 'Pre-Op: Diastema & Tetracycline Stains',
      afterBadge: 'Post-Op: 6 Hand-Layered E.max Veneers'
    },
    {
      id: 'case-2',
      patientName: 'Aravind Kumar (Age 34)',
      treatment: 'Microscopic Endodontic Retreatment & Monolithic Zirconia Crown (#16)',
      duration: '1 Single Appointment (45 Mins Milling)',
      doctor: 'Dr. Ananya Sharma (Chief Dental Surgeon)',
      beforeDescription: 'Symptomatic irreversible pulpitis with deep disto-occlusal cavitated lesion and periapical lesion on mesiobuccal root.',
      afterDescription: 'Fully decontaminated root canals sealed with bioceramic sealer; robotic 5-axis milled monolithic zirconia crown with anatomical fissural characterization.',
      shadeTransition: 'VITA C3 → A2 Natural Gradient',
      clinicalNotes: 'Working lengths established with electronic apex locator; complete periapical bone healing confirmed at 6 months.',
      beforeImg: '/Analyzing the problem.png',
      afterImg: '/Check-up.png',
      beforeBadge: 'Pre-Op: Deep Cavity & Periapical Pulpitis',
      afterBadge: 'Post-Op: Precision Zirconia Crown'
    },
    {
      id: 'case-3',
      patientName: 'Vishal Rao (Age 42)',
      treatment: 'Cold Laser Teeth Whitening & Composite Gum Recontouring',
      duration: '1 Visit (60 Mins)',
      doctor: 'Kavita Sundaram & Dr. Priya Sen',
      beforeDescription: 'Heavy coffee & nicotine enamel saturation, superficial micro-cracks, and asymmetric gingival margins on tooth #11 and #21.',
      afterDescription: 'Diode laser photothermal whitening yielding 7 shades of brightness; painless diode laser gingivectomy creating symmetrical scalloped margins.',
      shadeTransition: 'VITA A4 → B1 Bright Natural',
      clinicalNotes: 'Neutral pH desensitizing calcium phosphate mousse applied post-treatment; zero dentinal hypersensitivity reported.',
      beforeImg: '/Pre-check up.png',
      afterImg: '/Interaction.png',
      beforeBadge: 'Pre-Op: Nicotine Saturation & Uneven Gingiva',
      afterBadge: 'Post-Op: Laser Whitened + Gingival Scallop'
    }
  ];

  const currentCase = cases[activeCaseIndex];

  // Drag interaction logic for mouse and touch
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const clampedX = Math.max(0, Math.min(offsetX, rect.width));
    const percent = (clampedX / rect.width) * 100;
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <section id="results" className="py-24 bg-transparent relative overflow-hidden text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-display [text-shadow:_0_3px_15px_rgba(0,0,0,0.9)]">
            CLINICAL TRANSFORMATIONS &amp; <br />
            BEFORE &amp; AFTER RESULTS
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-200 font-medium leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            Drag the tactile central divider to examine the millimeter precision, enamel shade transition, and natural anatomic translucency achieved in our operatory.
          </p>
        </div>

        {/* Case Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          {cases.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveCaseIndex(idx);
                setSliderPosition(50);
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer border ${
                activeCaseIndex === idx
                  ? 'bg-white/90 text-slate-950 border-white/60 shadow-[0_0_15px_rgba(255,255,255,0.35)] font-black active:scale-[0.98]'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 backdrop-blur-md active:scale-[0.98]'
              }`}
            >
              <span>Case 0{idx + 1}: {c.treatment.split(' (')[0]}</span>
            </button>
          ))}
        </div>

        {/* Main Interactive Comparison Grid */}
        <div className="bg-slate-950/40 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Real Drag-To-Compare Viewport */}
          <div
            className="lg:col-span-7 relative h-80 sm:h-96 md:h-[480px] bg-slate-950 select-none overflow-hidden cursor-ew-resize group"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
          >
            {/* After Image (Background Layer) */}
            <div className="absolute inset-0 w-full h-full">
              <img
                src={currentCase.afterImg}
                alt="After restoration"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center pointer-events-none"
              />
              <div className="absolute top-4 right-4 bg-emerald-600/90 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-md backdrop-blur-md uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AFTER: {currentCase.afterBadge}</span>
              </div>
            </div>

            {/* Before Image (Clipped Foreground Layer) */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <div className="absolute inset-0 w-[100vw] lg:w-[58vw] h-full">
                <img
                  src={currentCase.beforeImg}
                  alt="Before treatment"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center pointer-events-none filter saturate-75 contrast-95"
                />
              </div>
              <div className="absolute top-4 left-4 bg-slate-950/90 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-md backdrop-blur-md uppercase tracking-wider border border-white/20">
                <span>BEFORE: {currentCase.beforeBadge}</span>
              </div>
            </div>

            {/* Draggable Divider Line & Central Grab Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-950 text-white shadow-2xl flex items-center justify-center border-2 border-white cursor-grab active:cursor-grabbing pointer-events-auto hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Bottom Slider Interaction Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/10 pointer-events-none flex items-center gap-2">
              <span>Drag slider left / right</span>
              <span className="text-white font-mono font-black">{Math.round(sliderPosition)}%</span>
            </div>
          </div>

          {/* Right Column: Case Clinical Dossier */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-slate-900/90 border-t lg:border-t-0 lg:border-l border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 bg-slate-900 px-2.5 py-1 rounded-md border border-white/20">
                  Case Study #0{activeCaseIndex + 1}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {currentCase.duration}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight mb-2">
                {currentCase.treatment}
              </h3>
              
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6">
                <User className="w-3.5 h-3.5 text-white" />
                <span>Patient: {currentCase.patientName}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300">{currentCase.doctor}</span>
              </div>

              {/* Before vs After Clinical Comparison */}
              <div className="space-y-4 mb-6">
                <div className="bg-red-950/30 rounded-xl p-3.5 border border-red-900/40">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400 block mb-1">
                    Pre-Operative Condition:
                  </span>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {currentCase.beforeDescription}
                  </p>
                </div>

                <div className="bg-emerald-950/30 rounded-xl p-3.5 border border-emerald-900/40">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-1">
                    Post-Operative Architectural Outcome:
                  </span>
                  <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                    {currentCase.afterDescription}
                  </p>
                </div>
              </div>

              {/* Shade Transition Metric */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 mb-4">
                <span className="text-xs font-bold text-slate-400">VITA Color Metric:</span>
                <span className="text-xs font-black text-white font-mono bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                  {currentCase.shadeTransition}
                </span>
              </div>
            </div>

            {/* Quality Seal */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Clinical Photography
              </span>
              <span>Zero Post-Production Filter</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
