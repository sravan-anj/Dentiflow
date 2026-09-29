import React, { useState } from 'react';
import {
  Cpu,
  Scan,
  Layers,
  Eye,
  CheckCircle,
  Activity,
  Zap,
  Shield,
  Gauge,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface TechPillar {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  specs: { label: string; value: string }[];
  summary: string;
  advantages: string[];
}

export const TechnologySection: React.FC = () => {
  const [activeTechId, setActiveTechId] = useState('scan3d');

  const pillars: TechPillar[] = [
    {
      id: 'scan3d',
      title: 'TRIOS 5 WIRELESS 3D INTRAORAL SCANNER',
      subtitle: 'Sub-10 Micron Optical Surface Topography',
      badge: 'Zero Impression Putty',
      icon: <Scan className="w-6 h-6 text-white" />,
      specs: [
        { label: 'Optical Resolution', value: '< 6.9 µm accuracy' },
        { label: 'Capture Speed', value: '2,400 3D frames / sec' },
        { label: 'Shade Mapping', value: 'Photometric AI Shade Guide' },
        { label: 'Patient Comfort', value: '100% Gag-Reflex Free' }
      ],
      summary: 'Replaces uncomfortable analog silicone impressions with a lightweight, pen-sized optical scanner. Projects 2,400 multi-angle photogrammetry frames per second to construct an exact micron-grade digital twin of your dentition.',
      advantages: [
        'Instant 3D digital model transmission to chairside milling robotic unit',
        'Real-time automated caries and micro-leakage fluorescence detection',
        'Absolute digital arch measurement with zero material distortion'
      ]
    },
    {
      id: 'cbct',
      title: 'CBCT 3D CONE-BEAM BONE TOMOGRAPHY',
      subtitle: 'Millimeter-Safe Anatomical Volumetric Mapping',
      badge: 'Ultra-Low Radiation',
      icon: <Layers className="w-6 h-6 text-white" />,
      specs: [
        { label: 'Voxel Resolution', value: '75 µm isotropic voxel' },
        { label: 'Radiation Index', value: '85% lower than medical CT' },
        { label: 'Field of View', value: 'Full Maxilla & Mandible' },
        { label: 'Planning Mode', value: 'Computer Stent Guided' }
      ],
      summary: '3D volumetric reconstruction of cortical bone density, mandibular canal nerve paths, and maxillary sinus floors. Ensures robotic dental implant placement occurs with absolute anatomical safety.',
      advantages: [
        'Precise bone density evaluation before surgical intervention',
        'Custom 3D-printed surgical template guides avoid all neural structures',
        'Same-day virtual implant trajectory simulation with live patient review'
      ]
    },
    {
      id: 'cadcam',
      title: 'AI CAD/CAM ROBOTIC 5-AXIS MILLING',
      subtitle: 'Same-Day Ceramic Restoration in Under 45 Minutes',
      badge: 'Chairside Sintering',
      icon: <Cpu className="w-6 h-6 text-white" />,
      specs: [
        { label: 'Milling Spindle', value: '100,000 RPM 5-Axis' },
        { label: 'Material Grade', value: 'Monolithic Translucent Zirconia' },
        { label: 'Fabrication Time', value: '38 minutes chairside' },
        { label: 'Marginal Integrity', value: '< 25 µm edge fit' }
      ],
      summary: 'Direct chairside fabrication of monolithic zirconia, lithium disilicate (E.max), and hybrid ceramic crowns. Your permanent biocompatible restoration is designed, milled, glazed, and seated in a single appointment.',
      advantages: [
        'Eliminates temporary crowns and awkward second follow-up visits',
        'Diamond-coated micro-tools carve natural anatomical grooves',
        'Zero shrinkage sintering process ensures lifelong seal and comfort'
      ]
    },
    {
      id: 'microscope',
      title: 'ZEISS PROERGO SURGICAL MICROSCOPY',
      subtitle: '25x Coaxial Optical Magnification & Canal Illumination',
      badge: 'Micro-Invasive',
      icon: <Eye className="w-6 h-6 text-white" />,
      specs: [
        { label: 'Optical Power', value: 'Up to 25x continuous zoom' },
        { label: 'Illumination', value: 'Shadow-free Xenon Coaxial' },
        { label: 'Ergonomic Stance', value: 'Vibration-free counterbalanced' },
        { label: 'Preservation', value: 'Maximal dentin conservation' }
      ],
      summary: 'Operating with up to 25-fold magnification reveals hidden canal branches, microscopic fractures, and calcified canals that are completely invisible to the naked human eye.',
      advantages: [
        'Guarantees total decontamination of complex multi-rooted teeth',
        'Preserves maximum sound structural dentin, extending natural tooth life',
        'High-definition video documentation displayed live to the patient'
      ]
    }
  ];

  const activePillar = pillars.find((p) => p.id === activeTechId) || pillars[0];

  return (
    <section id="technology" className="py-24 bg-transparent text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-display [text-shadow:_0_3px_15px_rgba(0,0,0,0.9)]">
            PRECISION MEETS <br />
            MODERN TECHNOLOGY
          </h2>
          <p className="mt-4 text-slate-200 text-sm sm:text-base font-medium leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            We have replaced guesswork with sub-millimeter optics, automated robotics, and real-time 3D volumetry to ensure every dental restoration fits with microscopic accuracy.
          </p>
        </div>

        {/* 4 Interactive Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-12">
          {pillars.map((pillar) => {
            const isSelected = pillar.id === activeTechId;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActiveTechId(pillar.id)}
                className={`p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 flex flex-col justify-between border cursor-pointer ${
                  isSelected
                    ? 'bg-slate-950/40 border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-[1.02] backdrop-blur-xl'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'}`}>
                    {pillar.icon}
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                    isSelected ? 'bg-white/10 text-slate-200 border-white/30' : 'bg-slate-950/40 text-slate-400 border-white/10'
                  }`}>
                    {pillar.badge}
                  </span>
                </div>
                <div>
                  <h3 className={`text-xs sm:text-sm font-black tracking-tight line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {pillar.title}
                  </h3>
                  <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                    {pillar.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Technology Interactive Telemetry Console */}
        <div className="bg-slate-950/40 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Console: Specs & Narrative */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>ACTIVE SYSTEM SPECIFICATION</span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight mb-2">
              {activePillar.title}
            </h3>
            <p className="text-sm font-semibold text-slate-300 mb-6">
              {activePillar.subtitle}
            </p>

            <p className="text-sm text-slate-300 leading-relaxed font-normal mb-8">
              {activePillar.summary}
            </p>

            {/* Advantages Checklist */}
            <div className="space-y-3 mb-8">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Clinical Safety Advantages:
              </span>
              {activePillar.advantages.map((adv, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                  <CheckCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span>{adv}</span>
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-300">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Calibrated weekly according to National Dental Accreditation protocols</span>
            </div>
          </div>

          {/* Right Console: Live Digital Telemetry Gauges */}
          <div className="lg:col-span-5 bg-slate-950/40 rounded-2xl border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-xl">
            {/* Visual Scan Line Effect */}
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent animate-scan-line pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                  Telemetry Engine Online
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-white/20">
                v4.8 CALIBRATED
              </span>
            </div>

            {/* Spec Matrix Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {activePillar.specs.map((spec, i) => (
                <div key={i} className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    {spec.label}
                  </span>
                  <span className="text-sm sm:text-base font-black text-white font-mono">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Live Scan Preview Aesthetic Box */}
            <div className="w-full bg-slate-900 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block">
                    Zero Error Tolerance
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Micron margin verification passed
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">100% READY</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
