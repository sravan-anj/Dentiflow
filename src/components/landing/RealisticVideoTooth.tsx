import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface RealisticVideoToothProps {
  className?: string;
}

export const RealisticVideoTooth: React.FC<RealisticVideoToothProps> = ({ className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [progress, setProgress] = useState(0);

  // Sync play state
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const cycleSpeed = () => {
    const rates = [1, 1.5, 0.5];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration) {
      setProgress((currentTime / duration) * 100);
    }
  };

  // Ensure autoplay starts reliably
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = playbackRate;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay with muted is usually allowed, fallback
            setIsPlaying(false);
          });
      }
    }
  }, []);

  return (
    <div
      id="realistic-video-tooth-stage"
      className={`relative w-full h-full flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Outer Glow & Ambient Depth */}
      <div className="absolute inset-2 rounded-3xl bg-gradient-to-tr from-white/10 via-white/5 to-white/10 blur-2xl -z-10 pointer-events-none" />

      {/* Main Video Showcase Container */}
      <div className="relative w-full h-full max-w-[420px] max-h-[420px] rounded-3xl overflow-hidden border border-white/20 bg-slate-950/30 shadow-[0_20px_50px_rgba(255,255,255,0.15)] backdrop-blur-md flex items-center justify-center group">
        {/* The Exact 8K Realistic Tooth Video Loop */}
        <video
          ref={videoRef}
          src="/Denti video3.mp4"
          poster="/realistic_human_molar.png"
          autoPlay
          loop
          muted
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onClick={togglePlay}
          className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-[1.02]"
        >
          {/* Denti Video 3 */}
          <source src="/Denti video3.mp4" type="video/mp4" />
          <source src="/realistic_8k_tooth_loop.mp4" type="video/mp4" />
          <source src="/landing_tooth_loop.mp4" type="video/mp4" />
        </video>

        {/* Soft Vignette Overlay for Seamless Edge Blending */}
        <div className="absolute inset-0 pointer-events-none rounded-3xl shadow-[inset_0_0_35px_rgba(255,255,255,0.2),inset_0_0_15px_rgba(255,255,255,0.1)]" />

        {/* Top Control Pill */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div className="px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 shadow-xs flex items-center gap-1.5 pointer-events-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span className="text-[11px] font-bold text-white tracking-tight flex items-center gap-1">
              <span>8K Cinematic 3D Loop</span>
            </span>
          </div>

          <div className="flex items-center gap-1 pointer-events-auto">
            <button
              type="button"
              onClick={cycleSpeed}
              className="px-2 py-1 rounded-xl bg-slate-950/70 hover:bg-slate-950/90 border border-white/20 shadow-xs text-[11px] font-bold text-slate-200 hover:text-white transition-colors"
              title="Change playback speed"
            >
              {playbackRate}x
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-950/90 border border-white/20 shadow-xs text-slate-200 hover:text-white transition-colors"
              title="Replay from start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Play / Pause Overlay & Scrubber */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1.5 pointer-events-none z-10">
          {/* Subtle Progress Bar */}
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-xs">
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={togglePlay}
              className="px-3 py-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-950/90 border border-white/20 shadow-sm text-white transition-all text-xs font-semibold flex items-center gap-1.5 pointer-events-auto"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-white" />
                  <span>Pause Loop</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                  <span>Play Loop</span>
                </>
              )}
            </button>

            <span className="text-[10px] font-medium text-slate-300 bg-slate-950/70 px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/20 pointer-events-auto">
              Right → Left Turntable
            </span>
          </div>
        </div>

        {/* Big Center Play Button when Paused */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-slate-950/80 backdrop-blur-md shadow-xl border border-white/30 flex items-center justify-center text-white hover:scale-110 transition-all z-20"
            title="Play video"
          >
            <Play className="w-6 h-6 fill-white translate-x-0.5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
};
