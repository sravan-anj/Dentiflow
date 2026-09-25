import React, { useRef, useEffect } from 'react';
import { BackgroundConfig } from '../../types/background';

interface AppBackgroundProps {
  config: BackgroundConfig;
}

export const AppBackground: React.FC<AppBackgroundProps> = ({ config }) => {
  const { activeUrl, fitMode, dimming, blur, tint } = config;
  const isVideo = activeUrl.toLowerCase().includes('.mp4') || activeUrl.toLowerCase().includes('.webm');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [activeUrl, isVideo]);

  // Tint classes
  const getTintClass = () => {
    switch (tint) {
      case 'navy':
        return 'bg-[#0a192f]';
      case 'cyan':
        return 'bg-[#082f49]';
      case 'dark':
        return 'bg-[#090d16]';
      case 'light':
        return 'bg-[#f8fafc]';
      case 'none':
        return 'bg-transparent';
      default:
        return 'bg-transparent';
    }
  };

  // Blur classes
  const getBlurClass = () => {
    switch (blur) {
      case 'sm':
        return 'backdrop-blur-[2px]';
      case 'md':
        return 'backdrop-blur-[6px]';
      case 'lg':
        return 'backdrop-blur-[14px]';
      case 'none':
      default:
        return '';
    }
  };

  return (
    <aside aria-label="Application Background" className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-slate-950 w-full h-full min-w-full min-h-full max-w-none max-h-none">
      {/* Background Media Layer (Video or Image) */}
      {isVideo ? (
        <video
          ref={videoRef}
          key={activeUrl}
          autoPlay
          loop
          muted
          playsInline
          poster="/realistic_human_molar.png"
          className={`absolute inset-0 z-0 w-full h-full min-w-full min-h-full max-w-none max-h-none ${
            fitMode === 'contain'
              ? 'object-contain bg-slate-950'
              : 'object-cover object-center origin-center scale-[1.14] block'
          } filter brightness-[1.14] contrast-[1.08] saturate-[1.12]`}
        >
          <source src={activeUrl} type="video/mp4" />
          <source src="/Denti video3.2.mp4" type="video/mp4" />
          <source src="/Denti video3.mp4" type="video/mp4" />
        </video>
      ) : (
        <img
          src={activeUrl}
          alt="Oralix Clinic Background"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src !== window.location.origin + '/Check-up.png') {
              target.src = '/Check-up.png';
            }
          }}
          className={`w-full h-full min-w-full min-h-full transition-all duration-700 ease-in-out ${
            fitMode === 'contain'
              ? 'object-contain bg-slate-950'
              : fitMode === 'repeat'
              ? 'object-none'
              : 'object-cover object-center'
          }`}
        />
      )}

      {/* Ambient Luminous Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/50 pointer-events-none" />

      {/* Dimming & Tint Overlay Layer */}
      {dimming > 0 && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${getTintClass()} ${getBlurClass()}`}
          style={{ opacity: dimming / 100 }}
        />
      )}
    </aside>
  );
};
