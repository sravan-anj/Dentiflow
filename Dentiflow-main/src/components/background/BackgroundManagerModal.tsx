import React, { useState, useRef } from 'react';
import { BackgroundConfig, BackgroundFitMode, BackgroundBlur, BackgroundTint } from '../../types/background';
import { DENTI_PRESETS, BackgroundStorage } from '../../utils/backgroundStorage';
import { Upload, Check, Trash2, Sliders, Image as ImageIcon, Sparkles, X, Eye } from 'lucide-react';

interface BackgroundManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackgroundConfig;
  onUpdateConfig: (config: BackgroundConfig) => void;
}

export const BackgroundManagerModal: React.FC<BackgroundManagerModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'uploads' | 'adjust'>('presets');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string, source: string) => {
    const updated: BackgroundConfig = {
      ...config,
      activeId: presetId,
      activeUrl: source
    };
    onUpdateConfig(updated);
    BackgroundStorage.saveConfig(updated);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const updated = BackgroundStorage.addCustomUpload(file.name, dataUrl);
        onUpdateConfig(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveUpload = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = BackgroundStorage.removeCustomUpload(id);
    onUpdateConfig(updated);
  };

  const handleUpdateSetting = <K extends keyof BackgroundConfig>(key: K, value: BackgroundConfig[K]) => {
    const updated = {
      ...config,
      [key]: value
    };
    onUpdateConfig(updated);
    BackgroundStorage.saveConfig(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 to-sky-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-300 rounded-xl border border-sky-400/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Clinic Background &amp; Visual Themes
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-sky-400/20 text-sky-200 px-2 py-0.5 rounded-full border border-sky-400/30">
                  Interactive
                </span>
              </h2>
              <p className="text-xs text-sky-200/80">
                Upload your dental pictures (Denti 1 - 7) or choose clinical themes with custom fit &amp; dimming
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-white text-sky-700 border-sky-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clinic Presets ({DENTI_PRESETS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'uploads'
                ? 'bg-white text-sky-700 border-sky-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Picture ({config.customUploads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('adjust')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'adjust'
                ? 'bg-white text-sky-700 border-sky-600 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Fit &amp; Legibility Controls</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: 7 PRESETS MATCHING DENTI 1 - 7 */}
          {activeTab === 'presets' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Visual Theme (Denti 1 to 7)
                </span>
                <span className="text-xs text-slate-500">
                  Click any card to apply instantly
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DENTI_PRESETS.map(preset => {
                  const isActive = config.activeId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id, preset.source)}
                      className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 flex flex-col ${
                        isActive
                          ? 'border-sky-600 ring-2 ring-sky-500 shadow-md bg-sky-50/40'
                          : 'border-slate-200 hover:border-slate-400 bg-white hover:shadow-xs'
                      }`}
                    >
                      {/* Image Preview Container */}
                      <div className="relative h-28 w-full bg-slate-900 overflow-hidden">
                        <img
                          src={preset.source}
                          alt={preset.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/60 text-sky-200 px-2 py-0.5 rounded-full backdrop-blur-xs border border-white/10">
                          {preset.tag}
                        </span>
                        {isActive && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="p-3 flex flex-col justify-between flex-1">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 mb-0.5 leading-tight">
                            {preset.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {preset.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD CUSTOM PICTURES */}
          {activeTab === 'uploads' && (
            <div className="space-y-4">
              {/* Drag & drop upload area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-sky-600 bg-sky-50'
                    : 'border-slate-300 hover:border-sky-500 bg-slate-50/60 hover:bg-sky-50/20'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Upload your pictures (Denti 1.png - Denti 7.png)
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-3">
                  Drag and drop your dental clinic image files here, or click to browse. PNG, JPEG, or WebP up to 10MB.
                </p>
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
                  Select Image from Device
                </span>
              </div>

              {/* Uploaded Gallery */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Your Uploaded Clinic Pictures ({config.customUploads.length})
                </h4>

                {config.customUploads.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs border border-slate-100 rounded-xl bg-slate-50">
                    No custom pictures uploaded yet. Drag &amp; drop any of your 7 pictures above to set as clinic background.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {config.customUploads.map(upload => {
                      const isActive = config.activeId === upload.id;
                      return (
                        <div
                          key={upload.id}
                          onClick={() => handleSelectPreset(upload.id, upload.dataUrl)}
                          className={`relative group rounded-xl border overflow-hidden cursor-pointer transition ${
                            isActive
                              ? 'border-sky-600 ring-2 ring-sky-500 bg-sky-50/40'
                              : 'border-slate-200 hover:border-slate-400 bg-white'
                          }`}
                        >
                          <div className="h-28 bg-slate-900 overflow-hidden relative">
                            <img
                              src={upload.dataUrl}
                              alt={upload.name}
                              className="w-full h-full object-cover"
                            />
                            {isActive && (
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                                <Check className="w-3 h-3 stroke-[3]" />
                                Active Background
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleRemoveUpload(upload.id, e)}
                              title="Delete picture"
                              className="absolute top-2 right-2 p-1 rounded-md bg-black/60 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="p-2.5">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {upload.name}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              Added {upload.dateAdded}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FIT & LEGIBILITY CONTROLS */}
          {activeTab === 'adjust' && (
            <div className="space-y-6">
              {/* Fit Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Image Fit Mode (Make it fit perfectly)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleUpdateSetting('fitMode', 'cover')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      config.fitMode === 'cover'
                        ? 'border-sky-600 bg-sky-50/80 text-sky-900 ring-1 ring-sky-500'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs mb-0.5">Cover Viewport (Cinematic)</div>
                    <div className="text-[11px] text-slate-500">
                      Fills entire screen smoothly, ideal for panoramic dental operatory workspace.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateSetting('fitMode', 'contain')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      config.fitMode === 'contain'
                        ? 'border-sky-600 bg-sky-50/80 text-sky-900 ring-1 ring-sky-500'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs mb-0.5">Fit Perfectly (Preserve Aspect Ratio)</div>
                    <div className="text-[11px] text-slate-500">
                      Keeps 100% of the picture visible without any cropping or distortion.
                    </div>
                  </button>
                </div>
              </div>

              {/* Dimming & Contrast Slider */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Background Dimming &amp; Text Legibility
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Higher dimming ensures dental numbers, buttons, and patient records are 100% crisp and readable.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded-md text-sky-700">
                    {config.dimming}% Overlay
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  step="5"
                  value={config.dimming}
                  onChange={(e) => handleUpdateSetting('dimming', parseInt(e.target.value, 10))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Transparent (20%)</span>
                  <span>Balanced Dental Contrast (75%)</span>
                  <span>Deep Focus (90%)</span>
                </div>
              </div>

              {/* Frosted Glass Blur */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Frosted Glass Blur
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'sm', 'md', 'lg'] as BackgroundBlur[]).map((blur) => (
                    <button
                      key={blur}
                      type="button"
                      onClick={() => handleUpdateSetting('blur', blur)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize cursor-pointer transition ${
                        config.blur === blur
                          ? 'border-sky-600 bg-sky-600 text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {blur === 'none' ? 'No Blur' : blur === 'sm' ? 'Subtle 2px' : blur === 'md' ? 'Frosted 6px' : 'Deep 14px'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ambient Tint */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Ambient Lighting Tint
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['navy', 'cyan', 'dark', 'light'] as BackgroundTint[]).map((tint) => (
                    <button
                      key={tint}
                      type="button"
                      onClick={() => handleUpdateSetting('tint', tint)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize cursor-pointer transition ${
                        config.tint === tint
                          ? 'border-sky-600 bg-sky-600 text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {tint === 'navy' ? 'Clinical Navy' : tint === 'cyan' ? 'Surgical Cyan' : tint === 'dark' ? 'Midnight Slate' : 'Pure Light'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Eye className="w-3.5 h-3.5 text-sky-600" />
                  <span>Interactive Button &amp; Text Legibility Preview:</span>
                </div>
                <div className="p-4 rounded-lg relative overflow-hidden bg-slate-900 text-white">
                  <img
                    src={config.activeUrl}
                    alt="Preview"
                    className={`absolute inset-0 w-full h-full opacity-60 ${
                      config.fitMode === 'contain' ? 'object-contain' : 'object-cover'
                    }`}
                  />
                  <div className="relative z-10 space-y-2">
                    <h5 className="font-bold text-sm tracking-tight text-white drop-shadow-xs">
                      Dr. Ananya Sharma • Operatory Chair 1
                    </h5>
                    <p className="text-xs text-sky-100 drop-shadow-xs">
                      Patient: Aravind Kumar (#DF-2026-001) - Tooth #46 Root Canal Active
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm">
                        Confirm Clinical Note
                      </button>
                      <button className="px-3 py-1.5 bg-white/80 backdrop-blur-md text-slate-900 font-semibold text-xs rounded-lg border border-white/40">
                        View Dental Chart
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Active: <span className="font-semibold text-slate-800">{config.activeId}</span> ({config.fitMode})
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply &amp; Done</span>
          </button>
        </div>

      </div>
    </div>
  );
};
