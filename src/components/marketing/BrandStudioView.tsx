import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  Check,
  ImagePlus,
  Instagram,
  Palette,
  RotateCcw,
  Sparkles,
  Type,
  Upload
} from 'lucide-react';

type CreativeFormat =
  | 'instagram-post'
  | 'instagram-story'
  | 'facebook-feed'
  | 'facebook-story'
  | 'linkedin-post'
  | 'linkedin-landscape'
  | 'x-post'
  | 'tiktok-cover'
  | 'pinterest-pin'
  | 'youtube-thumbnail';
type CreativeType = 'occasion' | 'offer' | 'announcement' | 'promotion';

interface CreativeFormatOption {
  id: CreativeFormat;
  platform: string;
  label: string;
  width: number;
  height: number;
}

const formatChoices: CreativeFormatOption[] = [
  { id: 'instagram-post', platform: 'Instagram', label: 'Feed post', width: 1080, height: 1080 },
  { id: 'instagram-story', platform: 'Instagram', label: 'Story / Reel cover', width: 1080, height: 1920 },
  { id: 'facebook-feed', platform: 'Facebook', label: 'Feed post', width: 1200, height: 1500 },
  { id: 'facebook-story', platform: 'Facebook', label: 'Story', width: 1080, height: 1920 },
  { id: 'linkedin-post', platform: 'LinkedIn', label: 'Feed post', width: 1200, height: 1200 },
  { id: 'linkedin-landscape', platform: 'LinkedIn', label: 'Landscape post', width: 1200, height: 627 },
  { id: 'x-post', platform: 'X', label: 'Post image', width: 1600, height: 900 },
  { id: 'tiktok-cover', platform: 'TikTok', label: 'Video cover', width: 1080, height: 1920 },
  { id: 'pinterest-pin', platform: 'Pinterest', label: 'Standard pin', width: 1000, height: 1500 },
  { id: 'youtube-thumbnail', platform: 'YouTube', label: 'Video thumbnail', width: 1280, height: 720 }
];

interface BrandIdentity {
  name: string;
  industry: string;
  tone: string;
  font: string;
  primary: string;
  accent: string;
  logo: string;
}

const STORAGE_KEY = 'dentiflow-brand-studio-v1';
const initialBrand: BrandIdentity = {
  name: 'Oralix Dental',
  industry: 'Dental care',
  tone: 'Warm & reassuring',
  font: 'Plus Jakarta Sans',
  primary: '#225B50',
  accent: '#E5B95C',
  logo: ''
};

const creativePresets: Record<CreativeType, { title: string; message: string; cta: string; tag: string }> = {
  occasion: {
    title: 'A little joy,\na brighter smile',
    message: 'Wishing you a wonderful celebration filled with reasons to smile.',
    cta: 'Celebrate with us',
    tag: 'OCCASION EDITION'
  },
  offer: {
    title: 'Your smile\ncalled. It wants 20% off.',
    message: 'A little something to make your next visit even brighter.',
    cta: 'Claim your offer',
    tag: 'A LITTLE EXTRA FOR YOU'
  },
  announcement: {
    title: 'Good things\nare happening here',
    message: 'A fresh update from our team, made with you in mind.',
    cta: 'See what’s new',
    tag: 'A NOTE FROM OUR TEAM'
  },
  promotion: {
    title: 'Make room for\nyour best smile',
    message: 'Thoughtful care, a little more accessible. Book your visit today.',
    cta: 'Book an appointment',
    tag: 'NOW BOOKING'
  }
};

const xmlSafe = (value: string) => value.replace(/[<>&"']/g, character => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
}[character] || character));

const wrapText = (value: string, maxLength: number) => value.split('\n').flatMap(paragraph => {
  const words = paragraph.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  words.forEach(word => {
    if (line && `${line} ${word}`.length > maxLength) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [''];
});

export const BrandStudioView: React.FC = () => {
  const [brand, setBrand] = useState<BrandIdentity>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialBrand, ...JSON.parse(saved) } : initialBrand;
    } catch {
      return initialBrand;
    }
  });
  const [brandSaveStatus, setBrandSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [creativeType, setCreativeType] = useState<CreativeType>('occasion');
  const [format, setFormat] = useState<CreativeFormat>('instagram-post');
  const [platformFilter, setPlatformFilter] = useState('Instagram');
  const [occasion, setOccasion] = useState('World Smile Day');
  const [headline, setHeadline] = useState(creativePresets.occasion.title);
  const [message, setMessage] = useState(creativePresets.occasion.message);
  const [cta, setCta] = useState(creativePresets.occasion.cta);
  const [generated, setGenerated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBrandSaveStatus('saving');
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(brand));
        setBrandSaveStatus('saved');
      } catch {
        setBrandSaveStatus('error');
      }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [brand]);

  const updateBrand = (key: keyof BrandIdentity, value: string) => {
    setBrand(current => ({ ...current, [key]: value }));
  };

  const handleLogoUpload = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => updateBrand('logo', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const saveBrand = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(brand));
      setBrandSaveStatus('saved');
    } catch {
      setBrandSaveStatus('error');
    }
  };

  const generateCreative = () => {
    const preset = creativePresets[creativeType];
    setHeadline(preset.title);
    setMessage(creativeType === 'occasion' && occasion.trim()
      ? `Wishing you a wonderful ${occasion.trim()} filled with reasons to smile.`
      : preset.message);
    setCta(preset.cta);
    setGenerated(true);
  };

  const downloadCreative = async () => {
    setExporting(true);
    const selectedFormat = formatChoices.find(choice => choice.id === format) || formatChoices[0];
    const { width, height } = selectedFormat;
    const scale = Math.min(width / 1080, height / 1080);
    const offsetX = (width - 1080 * scale) / 2;
    const layoutHeight = height / scale;
    const safeName = xmlSafe(brand.name || 'Your brand');
    const safeCta = xmlSafe(cta);
    const safeFont = xmlSafe(brand.font || 'sans-serif');
    const safeTag = xmlSafe(creativePresets[creativeType].tag);
    const top = layoutHeight > 1600 ? 300 : 125;
    const headlineLines = wrapText(headline, 20).map(xmlSafe);
    const bodyLines = wrapText(message, 48).map(xmlSafe);
    const lineHeight = 102;
    const headlineSvg = headlineLines.map((line, index) =>
      `<text x="92" y="${top + 125 + index * lineHeight}" class="headline">${line}</text>`
    ).join('');
    const logoSvg = brand.logo
      ? `<image href="${brand.logo}" x="92" y="${top}" width="74" height="74" preserveAspectRatio="xMidYMid meet"/>`
      : `<circle cx="128" cy="${top + 37}" r="37" fill="${brand.accent}"/><text x="128" y="${top + 48}" text-anchor="middle" class="initials">${xmlSafe((brand.name || 'B').slice(0, 1).toUpperCase())}</text>`;
    const bodyY = top + 160 + headlineLines.length * lineHeight;
    const bodySvg = `<text x="92" y="${bodyY}" class="body">${bodyLines.map((line, index) => `<tspan x="92" dy="${index === 0 ? 0 : 37}">${line}</tspan>`).join('')}</text>`;
    const ctaTop = bodyY + bodyLines.length * 37 + 30;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs><linearGradient id="wash" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${brand.primary}"/><stop offset="1" stop-color="#153d36"/></linearGradient><radialGradient id="orb"><stop stop-color="${brand.accent}" stop-opacity=".95"/><stop offset="1" stop-color="${brand.accent}" stop-opacity="0"/></radialGradient></defs>
      <rect width="${width}" height="${height}" fill="#f6f2e9"/><circle cx="${width * .86}" cy="${height * .48}" r="${Math.min(width, height) * .36}" fill="url(#orb)" opacity=".75"/><path d="M${width * .64} ${height} C${width * .7} ${height * .66} ${width * .92} ${height * .7} ${width} ${height * .38} V${height}Z" fill="${brand.primary}" opacity=".1"/>
      <rect x="48" y="48" width="${width - 96}" height="${height - 96}" rx="28" fill="none" stroke="${brand.primary}" stroke-opacity=".13" stroke-width="2"/>
      <g transform="translate(${offsetX} 0) scale(${scale})">
      ${logoSvg}<text x="190" y="${top + 31}" class="brand">${safeName}</text><text x="190" y="${top + 60}" class="industry">${xmlSafe(brand.industry)}</text>
      <text x="92" y="${top + 115}" class="tag">${safeTag}${creativeType === 'occasion' && occasion ? ` · ${xmlSafe(occasion.toUpperCase())}` : ''}</text>
      ${headlineSvg}${bodySvg}
      <rect x="92" y="${ctaTop}" width="360" height="78" rx="39" fill="${brand.primary}"/><text x="272" y="${ctaTop + 50}" text-anchor="middle" class="button">${safeCta}</text>
      <text x="92" y="${layoutHeight - 92}" class="footer">${safeName.toUpperCase()}  ·  ${xmlSafe(brand.tone.toUpperCase())}</text><circle cx="950" cy="${layoutHeight - 130}" r="42" fill="${brand.accent}" opacity=".9"/>
      </g>
      <style>.brand{font:700 26px '${safeFont}',sans-serif;fill:${brand.primary}}.industry{font:400 18px '${safeFont}',sans-serif;fill:#74776f}.tag{font:700 17px '${safeFont}',sans-serif;letter-spacing:2px;fill:${brand.primary};opacity:.8}.headline{font:700 76px '${safeFont}',sans-serif;fill:${brand.primary}}.body{font:400 27px '${safeFont}',sans-serif;fill:#50574f}.button{font:700 22px '${safeFont}',sans-serif;fill:#fff}.footer{font:700 15px '${safeFont}',sans-serif;letter-spacing:2px;fill:${brand.primary};opacity:.7}.initials{font:700 34px '${safeFont}',sans-serif;fill:${brand.primary}}</style>
    </svg>`;
    const image = new Image();
    const objectUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context?.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(blob => {
        if (blob) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${(brand.name || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${format}.png`;
          link.click();
          URL.revokeObjectURL(link.href);
        }
        setExporting(false);
      }, 'image/png');
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setExporting(false);
    };
    image.src = objectUrl;
  };

  const selectedFormat = formatChoices.find(choice => choice.id === format) || formatChoices[0];
  const visibleFormats = formatChoices.filter(choice => platformFilter === 'All' || choice.platform === platformFilter);
  const platforms = ['All', ...Array.from(new Set(formatChoices.map(choice => choice.platform)))];

  const choosePlatform = (platform: string) => {
    setPlatformFilter(platform);
    const available = formatChoices.filter(choice => platform === 'All' || choice.platform === platform);
    if (!available.some(choice => choice.id === format)) setFormat(available[0].id);
  };

  return (
    <div className="space-y-6 pb-8 text-[#252525]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#52776d]">
            <Sparkles className="h-3.5 w-3.5" /> Brand creative workspace
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Brand Studio</h1>
          <p className="mt-1 text-sm text-[#6F6D69]">Build polished social graphics that look and sound like you.</p>
        </div>
        <button onClick={saveBrand} disabled={brandSaveStatus === 'saving'} className="btn-secondary self-start sm:self-auto disabled:cursor-default disabled:opacity-80">
          {brandSaveStatus === 'error' ? <RotateCcw className="h-4 w-4 text-[#B97870]" /> : <Check className="h-4 w-4 text-[#52776d]" />}
          {brandSaveStatus === 'saving' ? 'Saving…' : brandSaveStatus === 'error' ? 'Retry save' : 'Brand saved'}
        </button>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <section className="space-y-5">
          <div className="rounded-2xl border border-[#e4e0d7] bg-white/90 p-5 shadow-[0_12px_36px_rgba(56,60,49,0.06)] sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7efeb] text-[#315f54]"><Palette className="h-4 w-4" /></span>
              <div><h2 className="text-sm font-extrabold">Your brand identity</h2><p className="text-xs text-[#85837d]">Set it once, use it across every creative.</p></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#55564f]">Brand name
                <input value={brand.name} onChange={event => updateBrand('name', event.target.value)} placeholder="Your brand name" className="mt-1.5 w-full rounded-lg border border-[#e4e0d7] bg-[#fbfaf7] px-3 py-2.5 text-sm font-medium text-[#252525] outline-none focus:border-[#52776d]" />
              </label>
              <label className="text-xs font-bold text-[#55564f]">Industry
                <input value={brand.industry} onChange={event => updateBrand('industry', event.target.value)} placeholder="e.g. Dental care" className="mt-1.5 w-full rounded-lg border border-[#e4e0d7] bg-[#fbfaf7] px-3 py-2.5 text-sm font-medium text-[#252525] outline-none focus:border-[#52776d]" />
              </label>
              <label className="text-xs font-bold text-[#55564f]">Brand tone
                <select value={brand.tone} onChange={event => updateBrand('tone', event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e4e0d7] bg-[#fbfaf7] px-3 py-2.5 text-sm font-medium text-[#252525] outline-none focus:border-[#52776d]">
                  {['Warm & reassuring', 'Bright & playful', 'Calm & premium', 'Bold & confident', 'Friendly & simple'].map(option => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-[#55564f]">Typography
                <select value={brand.font} onChange={event => updateBrand('font', event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e4e0d7] bg-[#fbfaf7] px-3 py-2.5 text-sm font-medium text-[#252525] outline-none focus:border-[#52776d]">
                  {['Plus Jakarta Sans', 'Outfit', 'Georgia', 'Arial', 'Trebuchet MS'].map(option => <option key={option}>{option}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-xs font-bold text-[#55564f]">Logo
                <input ref={logoInput} type="file" accept="image/*" onChange={event => handleLogoUpload(event.target.files?.[0])} className="sr-only" />
                <button type="button" onClick={() => logoInput.current?.click()} className="mt-1.5 flex w-full items-center gap-2 rounded-lg border border-dashed border-[#c9c8bf] bg-[#fbfaf7] px-3 py-2.5 text-left text-sm font-semibold text-[#6F6D69] hover:border-[#52776d]">
                  {brand.logo ? <img src={brand.logo} alt="Brand logo" className="h-7 w-7 rounded object-contain" /> : <ImagePlus className="h-4 w-4" />}
                  <span className="truncate">{brand.logo ? 'Replace uploaded logo' : 'Upload a logo'}</span><Upload className="ml-auto h-3.5 w-3.5" />
                </button>
              </label>
              <div className="flex gap-3">
                {(['primary', 'accent'] as const).map((key, index) => (
                  <label key={key} className="text-xs font-bold text-[#55564f]">{index === 0 ? 'Primary' : 'Accent'}
                    <span className="mt-1.5 flex h-[42px] items-center gap-2 rounded-lg border border-[#e4e0d7] bg-[#fbfaf7] px-2">
                      <input type="color" value={brand[key]} onChange={event => updateBrand(key, event.target.value)} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" />
                      <span className="font-mono text-[10px] uppercase text-[#74736d]">{brand[key]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4e0d7] bg-white/90 p-5 shadow-[0_12px_36px_rgba(56,60,49,0.06)] sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3ecda] text-[#9b7831]"><Instagram className="h-4 w-4" /></span>
              <div><h2 className="text-sm font-extrabold">Create a graphic</h2><p className="text-xs text-[#85837d]">Choose a format and give your post a moment.</p></div>
            </div>
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter formats by platform">
              {platforms.map(platform => (
                <button key={platform} onClick={() => choosePlatform(platform)} aria-pressed={platformFilter === platform} className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-bold transition ${platformFilter === platform ? 'bg-[#315f54] text-white shadow-sm' : 'bg-[#f4f2ed] text-[#77766f] hover:bg-[#e9e6de] hover:text-[#252525]'}`}>
                  {platform}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label={`${platformFilter} graphic formats`}>
              {visibleFormats.map(choice => (
                <button key={choice.id} onClick={() => setFormat(choice.id)} aria-pressed={format === choice.id} className={`rounded-lg border px-3 py-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f54] ${format === choice.id ? 'border-[#52776d] bg-white text-[#252525] shadow-sm' : 'border-transparent text-[#77766f] hover:border-[#d8d5cc] hover:text-[#252525]'}`}>
                  <span className="block text-xs font-extrabold">{choice.label}</span><span className="mt-1 block text-[10px] text-[#8d8b84]">{choice.width} × {choice.height} px</span>
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#55564f]">Creative type
                <select value={creativeType} onChange={event => setCreativeType(event.target.value as CreativeType)} className="mt-1.5 w-full rounded-lg border border-[#e4e0d7] bg-[#fbfaf7] px-3 py-2.5 text-sm font-medium text-[#252525] outline-none focus:border-[#52776d]">
                  <option value="occasion">Festival / occasion</option><option value="offer">Offer</option><option value="announcement">Announcement</option><option value="promotion">Promotional / ad</option>
                </select>
              </label>
              <label className="text-xs font-bold text-[#55564f]">Occasion or campaign
                <input value={occasion} onChange={event => setOccasion(event.target.value)} placeholder="e.g. Diwali, new clinic hours" className="mt-1.5 w-full rounded-lg border border-[#e4e0d7] bg-[#fbfaf7] px-3 py-2.5 text-sm font-medium text-[#252525] outline-none focus:border-[#52776d]" />
              </label>
            </div>
            <div className="mt-4 grid gap-4">
              <label className="text-xs font-bold text-[#55564f]">Headline
                <textarea value={headline} onChange={event => setHeadline(event.target.value)} rows={2} className="mt-1.5 w-full resize-y rounded-lg border border-[#e4e0d7] bg-[#fbfaf7] px-3 py-2.5 text-sm font-medium leading-relaxed text-[#252525] outline-none focus:border-[#52776d]" />
              </label>
              <label className="text-xs font-bold text-[#55564f]">Supporting message
                <textarea value={message} onChange={event => setMessage(event.target.value)} rows={2} className="mt-1.5 w-full resize-y rounded-lg border border-[#e4e0d7] bg-[#fbfaf7] px-3 py-2.5 text-sm font-medium leading-relaxed text-[#252525] outline-none focus:border-[#52776d]" />
              </label>
              <label className="text-xs font-bold text-[#55564f]">Call to action
                <input value={cta} onChange={event => setCta(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e4e0d7] bg-[#fbfaf7] px-3 py-2.5 text-sm font-medium text-[#252525] outline-none focus:border-[#52776d]" />
              </label>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button onClick={generateCreative} className="btn-primary flex-1"><Sparkles className="h-4 w-4" />Generate graphic</button>
              <button onClick={() => { const preset = creativePresets[creativeType]; setHeadline(preset.title); setMessage(preset.message); setCta(preset.cta); }} title="Reset copy" className="btn-secondary"><RotateCcw className="h-4 w-4" /><span className="sm:hidden">Reset copy</span></button>
            </div>
          </div>
        </section>

        <aside className="xl:sticky xl:top-6">
          <div className="mb-3 flex items-center justify-between">
            <div><h2 className="text-sm font-extrabold">Live preview</h2><p className="text-xs text-[#85837d]">{selectedFormat.platform} · {selectedFormat.width} × {selectedFormat.height} px</p></div>
            {generated && <span className="flex items-center gap-1 rounded-full bg-[#e7efeb] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#315f54]"><Sparkles className="h-3 w-3" />Ready</span>}
          </div>
          <div className="rounded-[26px] border border-[#dedbd2] bg-[#e9e6de] p-5 shadow-inner sm:p-8">
            <div className="mx-auto max-w-[380px] [perspective:1100px]">
              <div className="relative overflow-hidden rounded-[18px] bg-[#f6f2e9] shadow-[0_28px_50px_rgba(29,46,39,0.23)] transition-transform duration-500 hover:[transform:rotateY(0deg)_rotateX(0deg)_translateY(-3px)]" style={{ aspectRatio: `${selectedFormat.width} / ${selectedFormat.height}`, transform: 'rotateY(-5deg) rotateX(2deg)', boxShadow: `0 28px 50px ${brand.primary}30, 10px 12px 0 ${brand.primary}15` }}>
                <div className="absolute -right-[20%] top-[28%] aspect-square w-[90%] rounded-full blur-[1px]" style={{ background: `radial-gradient(circle at 34% 33%, ${brand.accent} 0%, ${brand.accent}aa 23%, transparent 69%)` }} />
                <div className="absolute -bottom-[16%] -right-[6%] h-[42%] w-[82%] rounded-[50%] opacity-20" style={{ background: `linear-gradient(140deg, ${brand.primary}, transparent 74%)`, transform: 'rotate(-18deg)' }} />
                <div className="absolute inset-0 flex flex-col p-[8%]">
                  <div className="flex items-center gap-3">
                    {brand.logo ? <img src={brand.logo} alt="" className="h-10 w-10 rounded-lg object-contain" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold" style={{ backgroundColor: brand.accent, color: brand.primary }}>{(brand.name || 'B').slice(0, 1).toUpperCase()}</span>}
                    <div className="min-w-0"><div className="truncate text-[13px] font-extrabold" style={{ color: brand.primary }}>{brand.name || 'Your brand'}</div><div className="text-[10px] text-[#77766f]">{brand.industry || 'Your industry'}</div></div>
                  </div>
                  <div className="mt-[13%] text-[9px] font-extrabold uppercase tracking-[0.18em]" style={{ color: brand.primary }}>{creativePresets[creativeType].tag}{creativeType === 'occasion' && occasion ? ` · ${occasion}` : ''}</div>
                  <h3 className="relative z-10 mt-3 whitespace-pre-line text-[30px] font-extrabold leading-[1.03] sm:text-[34px]" style={{ color: brand.primary, fontFamily: brand.font }}>{headline || 'Your headline goes here'}</h3>
                  <p className="relative z-10 mt-4 max-w-[88%] text-[12px] leading-relaxed text-[#555b53]">{message || 'A thoughtful message for your community.'}</p>
                  <button className="relative z-10 mt-5 w-fit rounded-full px-5 py-2.5 text-[10px] font-extrabold text-white shadow-lg" style={{ backgroundColor: brand.primary }}>{cta || 'Learn more'}</button>
                  <div className="mt-auto flex items-end justify-between pt-6">
                    <span className="max-w-[75%] text-[8px] font-bold uppercase tracking-[0.16em] text-[#696c64]">{brand.name || 'Your brand'} · {brand.tone}</span>
                    <span className="h-8 w-8 rounded-full shadow-[inset_-4px_-5px_8px_rgba(0,0,0,.15),inset_3px_3px_6px_rgba(255,255,255,.6)]" style={{ backgroundColor: brand.accent }} />
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-[18px] border border-white/70" />
              </div>
            </div>
          </div>
          <button onClick={downloadCreative} disabled={exporting} className="btn-primary mt-4 w-full disabled:cursor-wait disabled:opacity-60">
            <ArrowDownToLine className="h-4 w-4" />{exporting ? 'Preparing PNG…' : 'Download PNG'}
          </button>
          <p className="mt-2 text-center text-[10px] text-[#85837d]"><Type className="mr-1 inline h-3 w-3" />Brand colors, logo and type are applied to your export.</p>
        </aside>
      </div>
    </div>
  );
};