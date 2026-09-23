import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  Calendar
} from 'lucide-react';

interface ServiceItem {
  id: string;
  number: string;
  title: string;
  tagline: string;
  description: string;
  duration: string;
  clinicalTier: string;
  image: string;
  highlights: string[];
  clinicalFocus: string;
}

interface ServicesSectionProps {
  onOpenBooking: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onOpenBooking }) => {
  const [activeServiceId, setActiveServiceId] = useState<string>('01');

  const services: ServiceItem[] = [
    {
      id: '01',
      number: '01',
      title: 'GENERAL DENTISTRY & PROPHYLAXIS',
      tagline: 'Ultrasonic Biofilm Decontamination & Biomimetic Restorations',
      description: 'Comprehensive dental exams, computerized caries detection, non-invasive composite bonding, and painless EMS AirFlow guided biofilm therapy for absolute gum longevity.',
      duration: '45 – 60 min',
      clinicalTier: 'Preventive Protocol',
      image: '/Check-up.png',
      highlights: [
        'EMS AirFlow warm-water prophylaxis',
        'Sub-surface laser fluorescence caries diagnostics',
        'Biomimetic nano-hybrid composites matching natural enamel translucency',
        'Full periodontal probing & digital chart mapping'
      ],
      clinicalFocus: 'Preventive, Restorative, Periodontal Longevity'
    },
    {
      id: '02',
      number: '02',
      title: 'COSMETIC VENEERS & SMILE DESIGN',
      tagline: 'Hand-Layered Biocompatible E.max & Feldspathic Ceramic Veneers',
      description: 'Custom smile architecture calculated using facial golden ratios and 3D mock-ups. Minimal to zero-prep ultra-thin ceramic veneers engineered to match your natural facial symmetry.',
      duration: '2 appointments',
      clinicalTier: 'Aesthetic Masterclass',
      image: '/Interaction.png',
      highlights: [
        '3D Digital Smile Design (DSD) facial video preview',
        '0.3mm ultra-conservative enamel preservation prep',
        'Multi-shaded ceramic layering with micro-texture',
        '10-year clinical fracture warranty'
      ],
      clinicalFocus: 'Aesthetic Symmetry, Enamel Preservation, Color Matching'
    },
    {
      id: '03',
      number: '03',
      title: 'PRECISION ORTHODONTICS & INVISALIGN',
      tagline: 'Sub-Millimeter Biomechanical Clear Aligner Therapy',
      description: 'Advanced computer-simulated tooth kinematics. Achieve harmonious occlusal alignment, correct deep bites, and relieve jaw tension without metal brackets or speech obstruction.',
      duration: '6 – 14 months',
      clinicalTier: 'Orthodontic Kinematics',
      image: '/Consulting.png',
      highlights: [
        'AI simulated ClinCheck 3D root movement',
        'SmartTrack multi-layer polymer for predictable torque',
        'Zero-wire hygiene accessibility and comfortable wear',
        'Accelerated photobiomodulation option for 50% faster movement'
      ],
      clinicalFocus: 'Occlusion, TMJ Health, Arch Expansion'
    },
    {
      id: '04',
      number: '04',
      title: 'GUIDED IMPLANTOLOGY & SURGERY',
      tagline: 'Computer-Navigated Titanium & Zirconia Osteointegration',
      description: 'CBCT 3D guided surgical placement with robotic surgical stents. Safe, sub-millimeter trajectory avoiding anatomical nerves, paired with biologically integrated zirconia crowns.',
      duration: '1 – 2 appointments',
      clinicalTier: 'Guided Surgical Implant',
      image: '/Pre-check up.png',
      highlights: [
        'Stereolithographic 3D surgical guide template',
        'Straumann Roxolid SLActive rapid bone integration',
        'Platelet-Rich Fibrin (PRF) biological accelerated healing',
        'Immediate provisional aesthetic loading'
      ],
      clinicalFocus: 'Structural Rehabilitation, Bone Density, Permanent Stability'
    },
    {
      id: '05',
      number: '05',
      title: 'LASER TEETH WHITENING',
      tagline: 'Non-Peroxide Enamel Polishing & Diode Photothermal Whitening',
      description: 'In-office cold blue laser and photothermal gel activation. Lifts stubborn extrinsic and intrinsic stains by up to 8 VITA shades in under 45 minutes with zero hypersensitivity.',
      duration: '45 min',
      clinicalTier: 'Laser Aesthetic Care',
      image: '/Check-up.png',
      highlights: [
        'Dual-wavelength LED cold blue activation',
        'Desensitizing potassium nitrate and calcium phosphate remineralization',
        'Up to 8 VITA bleach shade improvement in one visit',
        'Long-lasting enamel gloss & stain protection seal'
      ],
      clinicalFocus: 'Enamel Brightening, Hydroxyapatite Glazing, Stain Removal'
    },
    {
      id: '06',
      number: '06',
      title: 'MICROSCOPIC ENDODONTICS',
      tagline: 'Zeiss 25x Magnification Root Canal Preservation',
      description: 'Endodontic therapy performed under high-power surgical microscopy with 3D sonic irrigation and biocompatible bioceramic obturation, saving severely compromised natural teeth.',
      duration: '60 – 90 min',
      clinicalTier: 'Microscopic Endodontics',
      image: '/Analyzing the problem.png',
      highlights: [
        'Zeiss ProErgo continuous coaxial illumination',
        'GentleWave 3D fluid multi-sonic root canal disinfection',
        'Bioceramic warm vertical hydraulic seal (MTA)',
        'Zero-pain computerized wand anesthesia delivery'
      ],
      clinicalFocus: 'Tooth Preservation, Neural Comfort, Canal Anatomy'
    }
  ];

  const currentService = services.find((s) => s.id === activeServiceId) || services[0];

  return (
    <section id="services" className="py-24 bg-transparent text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-display [text-shadow:_0_3px_15px_rgba(0,0,0,0.9)]">
              COMPREHENSIVE <br />
              DENTAL ARCHITECTURE
            </h2>
          </div>
          <p className="text-sm text-slate-200 max-w-md font-medium leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            Every procedure is planned using 3D digital telemetry and executed under optical magnification to preserve maximum natural tooth structure.
          </p>
        </div>

        {/* Main Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Service Numbered List */}
          <div className="lg:col-span-6 flex flex-col divide-y divide-slate-800/80">
            {services.map((item) => {
              const isActive = item.id === activeServiceId;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveServiceId(item.id)}
                  onMouseEnter={() => setActiveServiceId(item.id)}
                  className={`py-5 px-4 sm:px-6 rounded-2xl transition-all duration-300 cursor-pointer group flex items-start gap-4 sm:gap-6 ${
                    isActive
                      ? 'bg-slate-950/40 border border-white/10 shadow-xl backdrop-blur-xl'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {/* Number Accent */}
                  <span
                    className={`text-xl sm:text-2xl font-black font-display tracking-tight transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  >
                    {item.number}
                  </span>

                  {/* Title & Tagline */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-base sm:text-lg font-black tracking-tight font-display transition-colors ${
                          isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                        }`}
                      >
                        {item.title}
                      </h3>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-white text-slate-950 font-black translate-x-0'
                            : 'bg-transparent text-slate-600 group-hover:text-slate-300'
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">
                      {item.tagline}
                    </p>
                    {isActive && (
                      <div className="mt-3 flex items-center gap-4 text-xs font-bold text-slate-300 animate-in fade-in duration-200">
                        <span className="flex items-center gap-1 text-white">
                          <Clock className="w-3.5 h-3.5" />
                          {item.duration}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span>Tier: {item.clinicalTier}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Clinical Showcase Card */}
          <div className="lg:col-span-6 lg:sticky lg:top-28">
            <div className="bg-slate-950/40 rounded-3xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-2xl text-white p-6 sm:p-8 flex flex-col justify-between relative">
              {/* Top Meta Badges */}
              <div className="flex items-center justify-between mb-6 z-10">
                <span className="text-xs uppercase font-extrabold tracking-widest text-slate-200 bg-white/10 border border-white/20 px-3 py-1 rounded-full">
                  Procedure {currentService.number} / 06
                </span>
                <span className="text-xs font-bold text-slate-300">
                  Focus: {currentService.clinicalFocus}
                </span>
              </div>

              {/* Dynamic Image Preview */}
              <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden mb-6 group border border-white/10">
                <img
                  key={currentService.image}
                  src={currentService.image}
                  alt={currentService.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Clinically Validated Protocol
                  </span>
                  <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    Est. {currentService.duration}
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="mb-6 z-10">
                <h4 className="text-xl sm:text-2xl font-black text-white font-display mb-2">
                  {currentService.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium mb-5">
                  {currentService.description}
                </p>

                {/* Key Procedure Steps */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Key Clinical Highlights:
                  </span>
                  {currentService.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Ribbon */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Clinical Classification
                  </span>
                  <span className="text-lg sm:text-xl font-black text-white font-display">
                    {currentService.clinicalTier}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="relative overflow-hidden group w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/90 hover:bg-white text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer border border-white/60"
                >
                  <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />
                  <Calendar className="w-4 h-4 relative z-10 text-slate-950" />
                  <span className="relative z-10 text-slate-950 font-black">Schedule Consultation</span>
                  <ArrowUpRight className="w-4 h-4 relative z-10 text-slate-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
