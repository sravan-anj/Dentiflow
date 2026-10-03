import React, { useState, useEffect } from 'react';
import { QueueItem } from '../../types';
import { ToothIcon } from '../common/ToothIcon';
import { Clock, Volume2, X, Users, Sparkles, CheckCircle2 } from 'lucide-react';

interface PublicQueuePortalProps {
  queue: QueueItem[];
  onClose: () => void;
}

export const PublicQueuePortal: React.FC<PublicQueuePortalProps> = ({ queue, onClose }) => {
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentlyServing = queue.filter(q => q.status === 'in_chair');
  const upcomingQueue = queue.filter(q => q.status === 'waiting');

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.2); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.4); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col justify-between overflow-y-auto">
      {/* Top Banner Header */}
      <header className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <ToothIcon size={24} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Oralix Dental Clinic
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              Live Waiting Room Display &bull; Operatory Queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={playChime}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
            title="Test announcement chime"
          >
            <Volume2 className="w-4 h-4 text-blue-400" />
            <span>Chime</span>
          </button>

          <div className="text-right">
            <div className="text-xl sm:text-2xl font-mono font-bold text-blue-400">
              {currentTime}
            </div>
            <div className="text-[11px] text-slate-400">Bangalore, India</div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer ml-2"
            title="Exit Fullscreen Portal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 7 Cols: NOW SERVING BIG HERO DISPLAY */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-widest mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              NOW IN OPERATORY CHAIRS
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Currently Under Care
            </h2>
          </div>

          <div className="space-y-4">
            {currentlyServing.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-800/60 border border-slate-700 text-center text-slate-400">
                Chairs preparing for next patients. Please take a seat.
              </div>
            ) : (
              currentlyServing.map(item => (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/60 via-slate-800/80 to-slate-800 border-2 border-blue-500/60 shadow-xl flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                      {item.chair}
                    </span>
                    <div className="text-2xl font-black text-white">
                      {item.patientName}
                    </div>
                    <div className="text-sm text-slate-300 font-medium">
                      With {item.doctorName}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-black text-blue-400 tracking-wider font-mono">
                      {item.tokenNumber}
                    </div>
                    <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-600/30 text-blue-300 border border-blue-500/30">
                      In Operatory
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Clinic Health Tip ticker */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-slate-300">
              <span className="font-bold text-white">Clinic Tip: </span>
              Flossing daily and scheduling cleanings every 6 months prevents 95% of periodontitis and tooth decay.
            </p>
          </div>
        </div>

        {/* Right 5 Cols: UPCOMING WAITING QUEUE */}
        <div className="lg:col-span-5 bg-slate-800/40 border border-slate-700/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Upcoming In Queue</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {upcomingQueue.length} patient(s) waiting
            </span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {upcomingQueue.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                No patients in waiting line.
              </p>
            ) : (
              upcomingQueue.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between hover:border-slate-600 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white">{item.patientName}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.doctorName} &bull; {item.chair}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-amber-400 font-mono">
                      {item.tokenNumber}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ~{item.estimatedWaitMinutes} mins est.
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* Footer Ticker */}
      <footer className="p-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-400">
        <span>If your token is called, please proceed to the indicated operatory dental chair. Free Wi-Fi: Oralix-Guest &bull; Water &amp; Refreshments at Lounge.</span>
      </footer>
    </div>
  );
};
