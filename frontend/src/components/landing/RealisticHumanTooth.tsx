import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, Layers, CheckCircle2, Eye, RotateCw } from 'lucide-react';

interface RealisticHumanToothProps {
  className?: string;
}

type ToothViewMode = 'molar' | 'clinical' | 'crown';

interface ToothSpec {
  id: ToothViewMode;
  label: string;
  tag: string;
  image: string;
  description: string;
  aspectRatio: string;
  anatomyHighlights: {
    title: string;
    description: string;
    position: string; // e.g. top, center, bottom
  }[];
}

const TOOTH_SPECS: Record<ToothViewMode, ToothSpec> = {
  molar: {
    id: 'molar',
    label: 'Adult Human Molar',
    tag: 'Balanced Anatomical Proportions',
    image: '/realistic_human_molar.png',
    description: 'Natural human molar tooth with anatomical occlusal cusps, cervical contour, and dual root structure. Balanced height-to-width ratio.',
    aspectRatio: 'aspect-[485/675]',
    anatomyHighlights: [
      {
        title: 'Natural Enamel Crown',
        description: 'Multi-cusp occlusal anatomy with micro-grooves and light scatter',
        position: 'top-8 left-4',
      },
      {
        title: 'Cementoenamel Junction',
        description: 'Anatomically accurate cervical curvature without artificial distortion',
        position: 'top-1/2 -left-2',
      },
      {
        title: 'Bifurcated Roots',
        description: 'Tapering roots with natural curvature and apical root canals',
        position: 'bottom-10 right-2',
      },
    ],
  },
  clinical: {
    id: 'clinical',
    label: 'Clinical Premolar',
    tag: 'Macro Studio Photography',
    image: '/realistic_human_tooth.png',
    description: 'High-resolution macro dental photography of an authentic restored human tooth showing natural enamel reflections and ivory tones.',
    aspectRatio: 'aspect-[553/1319]',
    anatomyHighlights: [
      {
        title: 'Porcelain/Enamel Lustre',
        description: 'Subtle ivory highlights and natural specular gloss',
        position: 'top-12 right-2',
      },
      {
        title: 'Cervical Transition',
        description: 'Gradual density shift from enamel to root dentin',
        position: 'top-1/2 left-2',
      },
      {
        title: 'Tapering Apex',
        description: 'Single-root anatomy with natural apical curvature',
        position: 'bottom-12 right-4',
      },
    ],
  },
  crown: {
    id: 'crown',
    label: 'Zirconia / Ceramic Crown',
    tag: 'Aesthetic Prosthodontics',
    image: '/realistic_ceramic_crown.png',
    description: 'Precision CAD/CAM biocompatible ceramic crown showcasing high-translucency enamel bevels and clinical photography lighting.',
    aspectRatio: 'aspect-square',
    anatomyHighlights: [
      {
        title: 'Translucent Incisal Edge',
        description: 'Multi-layer ceramic translucency mimicking natural enamel prism optics',
        position: 'top-6 left-6',
      },
      {
        title: 'Micro-Texture Margin',
        description: 'Sub-micron fit margin tailored for gingival seal and gum biocompatibility',
        position: 'bottom-8 right-6',
      },
    ],
  },
};

export const RealisticHumanTooth: React.FC<RealisticHumanToothProps> = ({ className = '' }) => {
  const [activeMode, setActiveMode] = useState<ToothViewMode>('molar');
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, shineX: 50, shineY: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const currentSpec = TOOTH_SPECS[activeMode];

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalize coordinates (-1 to 1)
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    // Subtle realistic tilt (max 10 degrees)
    setTilt({
      x: -normY * 9,
      y: normX * 12,
      shineX: Math.round((x / rect.width) * 100),
      shineY: Math.round((y / rect.height) * 100),
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0, shineX: 50, shineY: 50 });
  }, []);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  return (
    <div
      ref={containerRef}
      id="realistic-human-tooth-container"
      className={`relative w-full h-full flex flex-col items-center justify-center select-none ${className}`}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* Background Operatory Studio Illumination */}
      <div className="absolute inset-2 sm:inset-4 rounded-full bg-gradient-to-tr from-sky-400/20 via-sky-200/25 to-blue-400/10 blur-3xl -z-10 pointer-events-none" />

      {/* Mode Switcher Pill in Top Center */}
      <div className="absolute -top-3 sm:-top-5 z-30 flex items-center p-1 bg-white/90 backdrop-blur-md rounded-full border border-slate-200/80 shadow-md transition-all duration-200">
        {(['molar', 'clinical', 'crown'] as ToothViewMode[]).map((mode) => {
          const isActive = activeMode === mode;
          const spec = TOOTH_SPECS[mode];
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setActiveMode(mode)}
              className={`px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold rounded-full transition-all duration-200 flex items-center gap-1 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-slate-100/60'
              }`}
              title={spec.description}
            >
              <span>{spec.label.split(' ')[mode === 'crown' ? 0 : 1]}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive 3D Perspective Stage */}
      <div
        className="relative w-full h-full flex items-center justify-center p-2 sm:p-4"
        style={{
          perspective: 1000,
        }}
      >
        {/* The Tooth Image Container with Dynamic Studio 3D Tilt */}
        <div
          className="relative max-w-full max-h-[88%] flex items-center justify-center transition-transform duration-150 ease-out cursor-pointer"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.03 : 1})`,
            transformStyle: 'preserve-3d',
          }}
          onClick={() => setShowAnnotations((prev) => !prev)}
          title="Click to toggle anatomical details"
        >
          {/* Photorealistic Human Tooth Asset with custom CSS animation */}
          <img
            src={currentSpec.image}
            alt={currentSpec.label}
            className={`max-h-[260px] sm:max-h-[300px] md:max-h-[330px] w-auto object-contain filter drop-shadow-[0_20px_35px_rgba(2,132,199,0.22)] pointer-events-none transition-all duration-300 ${
              isRotating ? 'animate-tooth-float' : ''
            }`}
            draggable={false}
          />

          {/* Dynamic Enamel Specular Sheen travelling across surface on hover */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 transition-opacity duration-300 mix-blend-overlay"
            style={{
              opacity: isHovered ? 0.35 : 0,
              background: `radial-gradient(circle 90px at ${tilt.shineX}% ${tilt.shineY}%, rgba(255,255,255,0.9), transparent 70%)`,
            }}
          />

          {/* Anatomical Annotations / Callouts (toggleable or on hover) */}
          {showAnnotations && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {currentSpec.anatomyHighlights.map((item, idx) => (
                <div
                  key={idx}
                  className={`absolute ${item.position} flex items-center gap-1.5 animate-fadeIn`}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-sky-500/80 animate-ping absolute" />
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600 border border-white shadow-xs" />
                  </div>
                  <div className="bg-slate-900/90 backdrop-blur-md text-white px-2 py-1 rounded-md shadow-lg border border-slate-700/60 max-w-[150px] sm:max-w-[180px] pointer-events-auto">
                    <p className="text-[10px] font-bold text-sky-200 leading-tight">{item.title}</p>
                    <p className="text-[8px] sm:text-[9px] text-slate-300 leading-tight mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Realistic Soft Contact Shadow on Clinical Ground Floor */}
      <div
        className="absolute bottom-2 sm:bottom-4 w-32 sm:w-44 h-4 sm:h-6 rounded-full bg-slate-900/15 blur-md -z-10 transform scale-y-50 pointer-events-none transition-transform duration-200"
        style={{
          transform: `scale(${isHovered ? 1.15 : 1}) scaleY(0.4) translateX(${tilt.y * 1.5}px)`,
        }}
      />

      {/* Bottom Clinical Quality Verification Pill */}
      <div className="absolute bottom-0 sm:bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs text-[9px] sm:text-[10px] font-semibold text-slate-600 flex items-center gap-1.5 pointer-events-auto transition-all duration-200 hover:border-sky-300">
        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
        <span className="text-slate-700 font-medium">
          Professional Clinical Photography · <strong className="font-bold text-slate-900">{currentSpec.tag}</strong>
        </span>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={() => setIsRotating((prev) => !prev)}
          className={`flex items-center gap-1 font-bold transition-colors ${
            isRotating ? 'text-sky-600 hover:text-sky-800' : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Toggle index.css toothRotate animation"
        >
          <RotateCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          <span>{isRotating ? 'Rotate ON' : 'Rotate OFF'}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={() => setShowAnnotations((prev) => !prev)}
          className="text-sky-600 hover:text-sky-800 underline decoration-sky-300 font-bold"
        >
          {showAnnotations ? 'Hide Markers' : 'Show Anatomy'}
        </button>
      </div>
    </div>
  );
};
