import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TOOTH_VERTICES, TOOTH_COLORS, TOOTH_INDICES } from '../../data/toothGeometry';
import {
  RotateCcw,
  RotateCw,
  Play,
  Pause,
  Maximize2,
  Sparkles,
  Layers,
  Check,
  Eye,
  Sliders
} from 'lucide-react';

export type ToothShadingMode = 'enamel' | 'zirconia' | 'translucent' | 'cadcam';

interface Realistic3DToothProps {
  className?: string;
}

/**
 * Generates an ultra-fine 8K procedural enamel bump texture
 * mimicking natural human tooth perikymata (microscopic horizontal growth lines)
 * and prismatic crystalline enamel reflection.
 */
function createEnamelBumpTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Neutral base 128
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Fine microscopic horizontal perikymata waves
  for (let y = 0; y < size; y += 3) {
    const wave = Math.sin(y * 0.12) * 5 + Math.sin(y * 0.035) * 3;
    const val = Math.floor(128 + wave);
    ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
    ctx.fillRect(0, y, size, 2);
  }

  // Micro enamel prism crystalline noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 8);
  return texture;
}

/**
 * Creates a high-end surgical dental operatory studio HDR environment reflection map
 * with dual overhead softboxes, cool surgical blue rim, and warm fill.
 */
function createStudioEnvMap(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Clinical studio gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#e0f2fe'); // surgical cyan ceiling
  grad.addColorStop(0.45, '#ffffff'); // neutral white horizon
  grad.addColorStop(1, '#f1f5f9'); // clean operatory floor
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Surgical Softbox Light 1 (Top Left)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(100, 30, 260, 160);

  // Surgical Softbox Light 2 (Top Right)
  ctx.fillRect(660, 40, 260, 160);

  // Overhead Focused Dental Operatory Spotlight
  const spot = ctx.createRadialGradient(512, 90, 10, 512, 90, 180);
  spot.addColorStop(0, 'rgba(255, 255, 255, 1)');
  spot.addColorStop(0.5, 'rgba(224, 242, 254, 0.75)');
  spot.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = spot;
  ctx.beginPath();
  ctx.arc(512, 90, 180, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

export const Realistic3DTooth: React.FC<Realistic3DToothProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Rotation controls: default is right-to-left continuous turntable loop
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState<-1 | 1>(-1); // -1 = Right to Left, 1 = Left to Right
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [shadingMode, setShadingMode] = useState<ToothShadingMode>('enamel');
  const [showControls, setShowControls] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  // References for render loop & pointer interactions
  const toothGroupRef = useRef<THREE.Group | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialsRef = useRef<Record<ToothShadingMode, THREE.Material> | null>(null);
  const isDraggingRef = useRef(false);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const manualVelocityRef = useRef({ x: 0, y: 0 });
  const isPlayingRef = useRef(true);
  const directionRef = useRef<-1 | 1>(-1);
  const speedMultiplierRef = useRef(1);

  // Keep ref values in sync with state for zero-lag in 60fps RAF loop
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    speedMultiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);

  // Update material when shadingMode changes
  useEffect(() => {
    if (meshRef.current && materialsRef.current) {
      meshRef.current.material = materialsRef.current[shadingMode];
    }
  }, [shadingMode]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Three.js Scene Setup
    const scene = new THREE.Scene();

    // 2. Perspective Camera (calibrated for clinical studio macro inspection)
    const width = container.clientWidth || 380;
    const height = container.clientHeight || 380;
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 5.5);
    camera.lookAt(0, 0, 0);

    // 3. High-Performance WebGL Renderer with ACES Filmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    // 4. Clinical 5-Point Studio Lighting Setup
    // Soft overall ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    // Key Light - Surgical illumination from upper-right
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
    keyLight.position.set(4.0, 5.0, 4.5);
    scene.add(keyLight);

    // Signature Dental Cyan Rim Light - Accentuates enamel crown perimeter
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
    rimLight.position.set(-4.5, 3.0, -3.5);
    scene.add(rimLight);

    // Warm Soft Fill Light - Balances natural dentin depth
    const fillLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    fillLight.position.set(-3.5, -1.0, 3.5);
    scene.add(fillLight);

    // Overhead Dental Spotlight
    const topLight = new THREE.PointLight(0xffffff, 2.2, 15);
    topLight.position.set(0, 4.5, 1.5);
    scene.add(topLight);

    // Soft Root Base Light
    const bottomLight = new THREE.DirectionalLight(0xe0f2fe, 1.1);
    bottomLight.position.set(0, -4.5, 2.0);
    scene.add(bottomLight);

    // 5. Procedural 8K Textures
    const bumpTexture = createEnamelBumpTexture();
    const envTexture = createStudioEnvMap();
    scene.environment = envTexture;

    // 6. Geometry & Centering
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(TOOTH_VERTICES, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(TOOTH_COLORS, 3));
    geometry.setIndex(TOOTH_INDICES);
    geometry.computeVertexNormals();
    geometry.center(); // Perfect pivot point so rotation is completely symmetrical

    // 7. Physical Shading Materials
    const enamelMaterial = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.13,
      metalness: 0.01,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      transmission: 0.22,
      ior: 1.63, // Refractive index of natural human hydroxyapatite enamel
      reflectivity: 0.9,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      bumpMap: bumpTexture,
      bumpScale: 0.0035,
      envMap: envTexture,
      envMapIntensity: 0.95,
    });

    const zirconiaMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xfcfcfd),
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      reflectivity: 0.98,
      specularIntensity: 1.0,
      bumpMap: bumpTexture,
      bumpScale: 0.002,
      envMap: envTexture,
      envMapIntensity: 1.1,
    });

    const translucentMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x38bdf8),
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.72,
      ior: 1.5,
      transparent: true,
      opacity: 0.88,
      clearcoat: 0.9,
      envMap: envTexture,
      envMapIntensity: 1.2,
    });

    const cadcamMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x0284c7),
      wireframe: true,
      roughness: 0.4,
      metalness: 0.2,
    });

    materialsRef.current = {
      enamel: enamelMaterial,
      zirconia: zirconiaMaterial,
      translucent: translucentMaterial,
      cadcam: cadcamMaterial,
    };

    // 8. Tooth Mesh & Group
    const toothGroup = new THREE.Group();
    scene.add(toothGroup);
    toothGroupRef.current = toothGroup;

    const toothMesh = new THREE.Mesh(geometry, materialsRef.current[shadingMode]);
    // Slight natural anatomical tilt for photogenic presentation
    toothMesh.rotation.x = 0.06;
    toothMesh.rotation.z = -0.04;
    toothGroup.add(toothMesh);
    meshRef.current = toothMesh;

    // 9. Continuous Animation Loop (Right-to-Left loop)
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      if (toothGroupRef.current) {
        if (!isDraggingRef.current) {
          // Auto turntable loop: direction -1 means Right-to-Left
          if (isPlayingRef.current) {
            const baseSpeed = 0.55; // Radians per second
            toothGroupRef.current.rotation.y +=
              directionRef.current * baseSpeed * speedMultiplierRef.current * delta;
          }

          // Inertia damping after manual user drag
          toothGroupRef.current.rotation.y += manualVelocityRef.current.x;
          toothGroupRef.current.rotation.x += manualVelocityRef.current.y;
          manualVelocityRef.current.x *= 0.92;
          manualVelocityRef.current.y *= 0.92;
        }

        // Subtle organic levitation float
        toothGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.06;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });

    resizeObserver.observe(container);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      geometry.dispose();
      bumpTexture.dispose();
      envTexture.dispose();
      enamelMaterial.dispose();
      zirconiaMaterial.dispose();
      translucentMaterial.dispose();
      cadcamMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  // Interactive 3D Orbit Handlers (Touch & Mouse)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    setIsInteracting(true);
    pointerPosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !toothGroupRef.current) return;

    const deltaX = e.clientX - pointerPosRef.current.x;
    const deltaY = e.clientY - pointerPosRef.current.y;

    const rotSensitivity = 0.0075;
    toothGroupRef.current.rotation.y += deltaX * rotSensitivity;
    toothGroupRef.current.rotation.x += deltaY * rotSensitivity;

    // Store inertia velocity
    manualVelocityRef.current = {
      x: deltaX * 0.0035,
      y: deltaY * 0.0035,
    };

    pointerPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;
    setTimeout(() => setIsInteracting(false), 600);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, []);

  const handleResetOrientation = () => {
    if (toothGroupRef.current) {
      toothGroupRef.current.rotation.set(0, 0, 0);
      manualVelocityRef.current = { x: 0, y: 0 };
    }
  };

  return (
    <div
      ref={containerRef}
      id="realistic-3d-tooth-stage"
      className={`relative w-full h-full flex items-center justify-center select-none touch-none ${className}`}
    >
      {/* Dynamic Ambient Optical Glow Behind Model */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-sky-400/25 via-sky-200/30 to-blue-400/15 blur-3xl -z-10 pointer-events-none" />

      {/* WebGL Canvas for 8K Photorealistic 3D Tooth */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain cursor-grab active:cursor-grabbing filter drop-shadow-[0_25px_40px_rgba(2,132,199,0.22)]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Soft Clinical Contact Floor Shadow */}
      <div className="absolute bottom-3 sm:bottom-6 w-36 sm:w-52 h-5 sm:h-7 rounded-full bg-slate-900/15 blur-md -z-10 transform scale-y-50 pointer-events-none transition-transform duration-300" />

      {/* Primary Floating Badge: Status & Direction */}
      <div
        className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md text-[11px] font-semibold text-slate-700 flex items-center gap-2 transition-all duration-300 pointer-events-none ${
          isInteracting ? 'scale-105 border-sky-400 text-sky-700 bg-white ring-2 ring-sky-200/60' : 'opacity-95'
        }`}
      >
        <span className="flex items-center gap-1 text-sky-600 font-bold">
          <RotateCcw className={`w-3.5 h-3.5 ${isPlaying && direction === -1 ? 'animate-spin' : ''}`} style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
          <span>8K 3D Molar</span>
        </span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-600">
          {isPlaying
            ? direction === -1
              ? 'Loop: Right → Left'
              : 'Loop: Left → Right'
            : 'Paused'}
        </span>
      </div>

      {/* Studio Interactive Control Bar (Top Corners) */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 z-20">
        {/* Play / Pause Rotation */}
        <button
          type="button"
          onClick={() => setIsPlaying((prev) => !prev)}
          className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 shadow-xs text-slate-700 hover:text-sky-600 transition-all text-[11px] font-medium flex items-center gap-1.5"
          title={isPlaying ? 'Pause 3D rotation loop' : 'Resume continuous rotation loop'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span className="hidden sm:inline">Play</span>
            </>
          )}
        </button>

        {/* Direction Switcher (Right-to-Left by default) */}
        <button
          type="button"
          onClick={() => setDirection((prev) => (prev === -1 ? 1 : -1))}
          className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl border shadow-xs transition-all text-[11px] font-medium flex items-center gap-1.5 ${
            direction === -1
              ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
              : 'bg-white/90 text-slate-700 border-slate-200/80 hover:bg-white'
          }`}
          title="Toggle rotation direction: Right-to-Left vs Left-to-Right"
        >
          {direction === -1 ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline font-bold">Right → Left</span>
            </>
          ) : (
            <>
              <RotateCw className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline font-bold">Left → Right</span>
            </>
          )}
        </button>
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
        {/* Speed presets */}
        <div className="hidden sm:flex items-center bg-white/90 border border-slate-200/80 rounded-xl p-0.5 shadow-xs">
          {[0.5, 1, 1.8].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeedMultiplier(s)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                speedMultiplier === s
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Shader / Material Selector Toggle */}
        <button
          type="button"
          onClick={() => setShowControls((prev) => !prev)}
          className={`p-1.5 sm:px-2 sm:py-1 rounded-xl border shadow-xs transition-all text-[11px] font-medium flex items-center gap-1 ${
            showControls
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white/90 hover:bg-white text-slate-700 border-slate-200/80 hover:text-sky-600'
          }`}
          title="Toggle anatomical shading presets"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline capitalize font-semibold">{shadingMode}</span>
        </button>

        {/* Re-center view */}
        <button
          type="button"
          onClick={handleResetOrientation}
          className="p-1.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 shadow-xs text-slate-600 hover:text-sky-600 transition-all text-[11px]"
          title="Reset orientation"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Shading Presets Overlay Menu */}
      {showControls && (
        <div className="absolute top-11 right-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-2 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            8K Optical Shading
          </div>
          <div className="flex flex-col gap-1 mt-0.5">
            {[
              { id: 'enamel', label: '8K Natural Enamel', desc: 'Physiological hydroxyapatite PBR' },
              { id: 'zirconia', label: 'Zirconia Ceramic', desc: 'High-gloss lab monolithic crown' },
              { id: 'translucent', label: 'Diagnostic X-Ray', desc: 'Translucent blue pulp vision' },
              { id: 'cadcam', label: 'CAD/CAM Mesh', desc: 'Micron clinical wireframe' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setShadingMode(mode.id as ToothShadingMode);
                  setShowControls(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-between text-xs ${
                  shadingMode === mode.id
                    ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200/60'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <div>
                  <div className="text-[11px] leading-tight">{mode.label}</div>
                  <div className="text-[9px] text-slate-400 font-normal leading-tight mt-0.5">{mode.desc}</div>
                </div>
                {shadingMode === mode.id && <Check className="w-3.5 h-3.5 text-sky-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
