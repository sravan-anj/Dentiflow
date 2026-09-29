import { BackgroundConfig, BackgroundPreset } from '../types/background';

// Background presets: 3D Studio Loop Video + local clinical pictures (Denti 1 to Denti 7)
export const DENTI_PRESETS: BackgroundPreset[] = [
  {
    id: 'denti-video-loop',
    name: 'Cinematic Dental Video Loop 8K',
    description: 'Ultra-realistic 8K looping dental background video with natural tooth translucency and cinematic depth',
    tag: 'Cinematic 8K Video',
    source: '/Denti video3.2.mp4',
    isVideo: true
  },
  {
    id: 'denti-video-loop-2',
    name: '3D Studio Tooth Turntable Loop',
    description: 'Rotating 3D molar studio turntable with precise optical lighting and clean negative space',
    tag: '3D Studio Video',
    source: '/Denti video3.mp4',
    isVideo: true
  },
  {
    id: 'denti-1',
    name: 'Denti 1: Operatory Examination',
    description: 'Female dentist in medical gloves examining patient with optical mirror & probe',
    tag: 'Clinical Exam',
    source: '/Check-up.png',
  },
  {
    id: 'denti-2',
    name: 'Denti 2: Clinical Consultation',
    description: 'Dentist discussing treatment options and digital smile preview with patient',
    tag: 'Consultation',
    source: '/Consulting.png',
  },
  {
    id: 'denti-3',
    name: 'Denti 3: Interactive Smile Planning',
    description: 'Patient and clinician interacting over 3D treatment workflow options',
    tag: 'Smile Planning',
    source: '/Interaction.png',
  },
  {
    id: 'denti-4',
    name: 'Denti 4: Radiographic Diagnostic Analysis',
    description: 'Clinician evaluating high-resolution volumetric CBCT scans and root structures',
    tag: 'Diagnostics',
    source: '/Analyzing the problem.png',
  },
  {
    id: 'denti-5',
    name: 'Denti 5: Pre-Operative Assessment',
    description: 'Sterile pre-op patient evaluation under focused surgical lighting',
    tag: 'Pre-Operative',
    source: '/Pre-check up.png',
  },
  {
    id: 'denti-6',
    name: 'Denti 6: Appointment Booking Suite',
    description: 'Panoramic view of modern digital reception and reservation desk',
    tag: 'Practice Suite',
    source: '/Appointment booking background.png',
  },
  {
    id: 'denti-7',
    name: 'Denti 7: Macro Human Tooth Anatomy',
    description: 'Authentic clinical macro photography of human tooth enamel and natural cervical contour',
    tag: 'Clinical Macro',
    source: '/realistic_human_molar.png',
  }
];

const STORAGE_KEY = 'dentiflow_background_config_cinematic_v2';

export const DEFAULT_BACKGROUND_CONFIG: BackgroundConfig = {
  activeId: 'denti-video-loop',
  activeUrl: '/Denti video3.2.mp4',
  fitMode: 'cover',
  dimming: 15, // Soft ambient dimming allowing high video visibility
  blur: 'none', // Sharp crystal-clear video and photography
  tint: 'none', // Natural colors
  customUploads: []
};

export const BackgroundStorage = {
  getConfig: (): BackgroundConfig => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_BACKGROUND_CONFIG;
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_BACKGROUND_CONFIG,
        ...parsed,
        customUploads: parsed.customUploads || []
      };
    } catch {
      return DEFAULT_BACKGROUND_CONFIG;
    }
  },

  saveConfig: (config: BackgroundConfig): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save background config', e);
    }
  },

  addCustomUpload: (name: string, dataUrl: string): BackgroundConfig => {
    const current = BackgroundStorage.getConfig();
    const newUpload = {
      id: `custom-bg-${Date.now()}`,
      name: name || `Uploaded Picture ${current.customUploads.length + 1}`,
      dataUrl,
      dateAdded: new Date().toLocaleDateString()
    };
    const updated: BackgroundConfig = {
      ...current,
      activeId: newUpload.id,
      activeUrl: dataUrl,
      customUploads: [newUpload, ...current.customUploads]
    };
    BackgroundStorage.saveConfig(updated);
    return updated;
  },

  removeCustomUpload: (id: string): BackgroundConfig => {
    const current = BackgroundStorage.getConfig();
    const filtered = current.customUploads.filter(u => u.id !== id);
    const updated: BackgroundConfig = {
      ...current,
      customUploads: filtered,
      activeId: current.activeId === id ? DENTI_PRESETS[0].id : current.activeId,
      activeUrl: current.activeId === id ? DENTI_PRESETS[0].source : current.activeUrl
    };
    BackgroundStorage.saveConfig(updated);
    return updated;
  }
};
