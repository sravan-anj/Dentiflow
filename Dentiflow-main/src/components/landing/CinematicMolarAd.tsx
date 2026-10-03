import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TOOTH_VERTICES, TOOTH_COLORS, TOOTH_INDICES } from '../../data/toothGeometry';

interface CinematicMolarAdProps {
  className?: string;
  autoPlay?: boolean;
}

/**
 * Procedural microscopic enamel texture
 * Creates subtle horizontal perikymata growth waves and micro-crystalline reflections
 */
function createEnamelBumpTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Microscopic horizontal perikymata growth waves
  for (let y = 0; y < size; y += 3) {
    const wave = Math.sin(y * 0.12) * 4 + Math.sin(y * 0.04) * 2;
    const val = Math.floor(128 + wave);
    ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
    ctx.fillRect(0, y, size, 2);
  }

  // Micro-crystalline prismatic noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 6;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 6);
  return texture;
}

/**
 * Ultra-soft clinical studio HDRI environment reflection map
 * Produces broad diffused softbox highlights and delicate horizon reflection
 */
function createClinicalStudioEnvMap(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Minimalist studio gradient: soft white to faint surgical pale blue
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#e8f2fc'); // soft sky-tint ceiling
  grad.addColorStop(0.35, '#ffffff'); // bright studio softbox zone
  grad.addColorStop(0.7, '#f8fafc'); // neutral horizon
  grad.addColorStop(1, '#e2e8f0'); // calm floor plane
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Primary Diffused Softbox (Upper-Left Key)
  const softboxGrad1 = ctx.createRadialGradient(280, 110, 10, 280, 110, 200);
  softboxGrad1.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  softboxGrad1.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
  softboxGrad1.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = softboxGrad1;
  ctx.beginPath();
  ctx.arc(280, 110, 200, 0, Math.PI * 2);
  ctx.fill();

  // Secondary Softbox (Upper-Right Rim)
  const softboxGrad2 = ctx.createRadialGradient(780, 140, 10, 780, 140, 180);
  softboxGrad2.addColorStop(0, 'rgba(240, 249, 255, 0.9)');
  softboxGrad2.addColorStop(0.6, 'rgba(224, 242, 254, 0.4)');
  softboxGrad2.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = softboxGrad2;
  ctx.beginPath();
  ctx.arc(780, 140, 180, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

/**
 * Creates an atmospheric glow sprite texture
 */
function createGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.2, 'rgba(224, 242, 254, 0.65)');
  grad.addColorStop(0.5, 'rgba(186, 230, 253, 0.25)');
  grad.addColorStop(0.8, 'rgba(254, 243, 199, 0.08)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

export const CinematicMolarAd: React.FC<CinematicMolarAdProps> = ({
  className = '',
  autoPlay = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Refs for 60fps Animation loop
  const isPlayingRef = useRef(isPlaying);
  const timelineSecRef = useRef(0);
  const isDraggingRef = useRef(false);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const manualVelocityRef = useRef({ x: 0, y: 0 });

  // Three.js object references
  const toothGroupRef = useRef<THREE.Group | null>(null);
  const orbitalGroupRef = useRef<THREE.Group | null>(null);
  const auraSpriteRef = useRef<THREE.Sprite | null>(null);
  const shadowMeshRef = useRef<THREE.Mesh | null>(null);
  const primaryLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Keep ref in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Main Three.js Setup & Animation
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera - Locked-off 70mm equivalent cinematic lens
    const width = container.clientWidth || 420;
    const height = container.clientHeight || 420;
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
    // Locked-off perspective camera positioned for central 38-44% composition
    camera.position.set(0, 0.15, 5.8);
    camera.lookAt(0, 0, 0);

    // 3. Renderer with ACES Filmic Tone Mapping & High Precision
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // 4. Cinematic Studio Lighting
    // Ambient light - Pure soft white illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    // Primary Softbox: Large diffused softbox from upper/front side (Right-side key)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(3.8, 4.5, 4.2);
    scene.add(keyLight);
    primaryLightRef.current = keyLight;

    // Secondary Fill: Very soft fill from opposite side (Left-side fill) with gentle warmth
    const fillLight = new THREE.DirectionalLight(0xffedd5, 1.2);
    fillLight.position.set(-4.0, -0.5, 3.5);
    scene.add(fillLight);

    // Rim Light: Subtle cool rim lighting around tooth edges to separate from pale background
    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 2.4);
    rimLight.position.set(-3.5, 3.2, -3.2);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Subtle Overhead Spotlight for Crown Cusps
    const overheadSpot = new THREE.PointLight(0xffffff, 1.8, 12);
    overheadSpot.position.set(0, 4.2, 1.2);
    scene.add(overheadSpot);

    // Textures & Environment
    const bumpTexture = createEnamelBumpTexture();
    const envTexture = createClinicalStudioEnvMap();
    const glowTexture = createGlowTexture();
    scene.environment = envTexture;

    // 5. Anatomically Accurate Adult Human Molar Geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(TOOTH_VERTICES, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(TOOTH_COLORS, 3));
    geometry.setIndex(TOOTH_INDICES);
    geometry.computeVertexNormals();
    geometry.center(); // Center pivot for perfect symmetrical rotation

    // 6. Photorealistic Enamel Material
    // Hydroxyapatite refractive index (IOR 1.63), realistic translucency, and natural root warmth
    const toothMaterial = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.13,
      metalness: 0.02,
      clearcoat: 0.96,
      clearcoatRoughness: 0.04,
      transmission: 0.20, // Anatomical enamel translucency
      ior: 1.63, // Refractive index of human tooth enamel
      reflectivity: 0.92,
      specularIntensity: 0.95,
      specularColor: new THREE.Color(0xffffff),
      bumpMap: bumpTexture,
      bumpScale: 0.003,
      envMap: envTexture,
      envMapIntensity: 1.05,
    });

    // 7. Tooth Mesh & Container Group
    const toothGroup = new THREE.Group();
    scene.add(toothGroup);
    toothGroupRef.current = toothGroup;

    const toothMesh = new THREE.Mesh(geometry, toothMaterial);
    // Slight initial anatomical tilt for optimal medical-commercial showcase
    toothMesh.rotation.x = 0.05;
    toothMesh.rotation.z = -0.03;
    toothGroup.add(toothMesh);

    // 8. Subtle Atmospheric Luminosity Sprite (Aura around tooth)
    const auraMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const auraSprite = new THREE.Sprite(auraMaterial);
    auraSprite.scale.set(4.2, 4.2, 1);
    auraSprite.position.set(0, 0, -0.2);
    scene.add(auraSprite);
    auraSpriteRef.current = auraSprite;

    // 9. Delicate Luminous Orbital Energy / Light Trails (7s–10s)
    const orbitalGroup = new THREE.Group();
    scene.add(orbitalGroup);
    orbitalGroupRef.current = orbitalGroup;

    // Primary Orbital Ring (Subtle cyan-white luminous arc)
    const createOrbitalRing = (
      radiusX: number,
      radiusZ: number,
      tiltX: number,
      tiltZ: number,
      colorHex: number,
      accentHex: number
    ) => {
      const pointsCount = 120;
      const points: THREE.Vector3[] = [];
      const colors: number[] = [];

      const baseColor = new THREE.Color(colorHex);
      const accentColor = new THREE.Color(accentHex);

      for (let i = 0; i <= pointsCount; i++) {
        const theta = (i / pointsCount) * Math.PI * 2;
        const x = Math.cos(theta) * radiusX;
        const z = Math.sin(theta) * radiusZ;
        const y = Math.sin(theta * 2) * 0.12; // Slight harmonic wave
        points.push(new THREE.Vector3(x, y, z));

        // Translucent gradient along the arc
        const blend = (Math.sin(theta) + 1) / 2;
        const c = baseColor.clone().lerp(accentColor, blend * 0.6);
        colors.push(c.r, c.g, c.b);
      }

      const ringGeo = new THREE.BufferGeometry().setFromPoints(points);
      ringGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const ringMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        linewidth: 1.5,
      });

      const ringLine = new THREE.Line(ringGeo, ringMat);
      ringLine.rotation.x = tiltX;
      ringLine.rotation.z = tiltZ;

      // Small luminous particle node traveling on the ring
      const cometGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const cometMat = new THREE.MeshBasicMaterial({
        color: accentHex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const comet = new THREE.Mesh(cometGeo, cometMat);
      ringLine.add(comet);

      return { line: ringLine, material: ringMat, comet, cometMat, radiusX, radiusZ };
    };

    // Arc 1: Elegant primary thin luminous arc (pale blue / cyan)
    const arc1 = createOrbitalRing(1.85, 1.55, 0.38, -0.22, 0xffffff, 0x38bdf8);
    // Arc 2: Counter-orbital secondary delicate arc (subtle champagne / gold)
    const arc2 = createOrbitalRing(1.65, 1.75, -0.32, 0.42, 0xffffff, 0xfef08a);
    orbitalGroup.add(arc1.line);
    orbitalGroup.add(arc2.line);

    // 10. Soft Diffused Contact Floor Shadow (Hovering effect)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (shadowCtx) {
      const sGrad = shadowCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
      sGrad.addColorStop(0, 'rgba(15, 23, 42, 0.22)');
      sGrad.addColorStop(0.35, 'rgba(30, 41, 59, 0.12)');
      sGrad.addColorStop(0.7, 'rgba(71, 85, 105, 0.04)');
      sGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      shadowCtx.fillStyle = sGrad;
      shadowCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(3.6, 2.0);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2.15;
    scene.add(shadowMesh);
    shadowMeshRef.current = shadowMesh;

    // 11. Timeline Engine & 60fps Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let currentTimelineTime = timelineSecRef.current;
    let lastUiUpdate = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // Advance 10-second timeline if playing
      if (isPlayingRef.current) {
        currentTimelineTime = (currentTimelineTime + delta) % 10.0;
        timelineSecRef.current = currentTimelineTime;
      }

      const t = currentTimelineTime;

      if (toothGroupRef.current) {
        if (!isDraggingRef.current) {
          // Continuous slow rotation around vertical axis (Right-to-Left)
          toothGroupRef.current.rotation.y -= delta * 0.45;
          // Apply dampening to any user flick velocity
          toothGroupRef.current.rotation.y += manualVelocityRef.current.x;
          toothGroupRef.current.rotation.x += manualVelocityRef.current.y;
          manualVelocityRef.current.x *= 0.94;
          manualVelocityRef.current.y *= 0.94;
        }

        // Weightless floating levitation (calm harmonic motion)
        const floatY = Math.sin(clock.getElapsedTime() * 1.5) * 0.045;
        toothGroupRef.current.position.y = floatY;

        // Shadow reacts softly to floating height
        if (shadowMeshRef.current) {
          const shadowScale = 1.0 - floatY * 1.8;
          shadowMeshRef.current.scale.set(shadowScale, shadowScale, 1);
          shadowMesh.material.opacity = 0.85 - floatY * 1.2;
        }
      }

      // Atmospheric Luminosity Control (5s–10s)
      let auraOpacity = 0;
      if (t >= 5.0 && t < 7.0) {
        // Subtle introduction from 0 to 0.32
        auraOpacity = ((t - 5.0) / 2.0) * 0.32;
      } else if (t >= 7.0) {
        // Fully blooming soft volumetric glow
        auraOpacity = 0.32 + Math.sin(t * 2.0) * 0.06;
      }
      if (auraSpriteRef.current) {
        auraSpriteRef.current.material.opacity = auraOpacity;
        const pulse = 4.2 + Math.sin(t * 1.8) * 0.2;
        auraSpriteRef.current.scale.set(pulse, pulse, 1);
      }

      // Orbital Light Trails Control (7s–10s)
      let orbitalOpacity = 0;
      if (t >= 7.0 && t < 8.5) {
        // Fade in delicate thin trails
        orbitalOpacity = ((t - 7.0) / 1.5) * 0.85;
      } else if (t >= 8.5) {
        orbitalOpacity = 0.85;
      }

      // Update orbital curves & traveling luminous nodes
      arc1.material.opacity = orbitalOpacity;
      arc1.cometMat.opacity = orbitalOpacity * 0.95;
      arc2.material.opacity = orbitalOpacity * 0.75;
      arc2.cometMat.opacity = orbitalOpacity * 0.9;

      if (orbitalGroupRef.current) {
        // Continuous smooth orbital rotation around the tooth
        orbitalGroupRef.current.rotation.y = t * 0.85;

        // Position traveling comet heads along the elliptical paths
        const cometAngle1 = t * 2.2;
        arc1.comet.position.set(
          Math.cos(cometAngle1) * arc1.radiusX,
          Math.sin(cometAngle1 * 2) * 0.12,
          Math.sin(cometAngle1) * arc1.radiusZ
        );

        const cometAngle2 = -t * 1.8;
        arc2.comet.position.set(
          Math.cos(cometAngle2) * arc2.radiusX,
          Math.sin(cometAngle2 * 2) * 0.1,
          Math.sin(cometAngle2) * arc2.radiusZ
        );
      }

      renderer.render(scene, camera);
    };

    animate();

    // 12. Responsive Resize
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

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      geometry.dispose();
      bumpTexture.dispose();
      envTexture.dispose();
      glowTexture.dispose();
      shadowTexture.dispose();
      toothMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  // Interactive 3D drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    pointerPosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !toothGroupRef.current) return;
    const deltaX = e.clientX - pointerPosRef.current.x;
    const deltaY = e.clientY - pointerPosRef.current.y;
    toothGroupRef.current.rotation.y += deltaX * 0.008;
    toothGroupRef.current.rotation.x += deltaY * 0.008;
    manualVelocityRef.current = { x: deltaX * 0.003, y: deltaY * 0.003 };
    pointerPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div
      ref={containerRef}
      id="cinematic-molar-ad-container"
      className={`relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden ${className}`}
    >
      {/* 1. Seamless Studio Minimal Background */}
      <div className="absolute inset-0 bg-radial from-white via-sky-50/40 to-slate-100/80 pointer-events-none -z-20" />

      {/* 2. Ambient Volumetric Atmospheric Depth */}
      <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-sky-400/15 via-sky-200/20 to-amber-200/10 blur-3xl -z-10 pointer-events-none" />

      {/* 3. Three.js Canvas Stage - Pure Floating & Rotating Human Molar */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain cursor-grab active:cursor-grabbing filter drop-shadow-[0_20px_35px_rgba(2,132,199,0.18)]"
        onClick={() => setIsPlaying((prev) => !prev)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
};
