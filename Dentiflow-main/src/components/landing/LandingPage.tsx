import React from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { ServicesSection } from './ServicesSection';
import { TechnologySection } from './TechnologySection';
import { BeforeAfterSection } from './BeforeAfterSection';
import { DoctorsSection } from './DoctorsSection';
import { ReviewsSection } from './ReviewsSection';
import { CtaFooterSection } from './CtaFooterSection';

interface LandingPageProps {
  onOpenBooking: () => void;
  onOpenPortal: () => void;
  onNavigateAuth: (mode: 'signin' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenBooking,
  onOpenPortal,
  onNavigateAuth
}) => {
  return (
    <div className="landing-page-root relative w-full min-w-full min-h-screen bg-slate-950 text-white selection:bg-white/20 antialiased overflow-x-hidden">
      {/* SINGLE FIXED FULL-SCREEN LOOPING DENTAL VIDEO BACKGROUND — ZERO VISIBLE SIDE GAPS */}
      <div className="fixed inset-0 z-0 w-full h-full min-w-full min-h-full max-w-none max-h-none pointer-events-none overflow-hidden select-none bg-slate-950">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 z-0 w-full h-full min-w-full min-h-full max-w-none max-h-none object-cover object-center origin-center scale-[1.14] block filter brightness-[1.14] contrast-[1.08] saturate-[1.12]"
          poster="/realistic_human_molar.png"
        >
          <source src="/Denti video3.2.mp4" type="video/mp4" />
          <source src="/Denti video3.mp4" type="video/mp4" />
        </video>
        {/* Ultra-Subtle Ambient Luminous Vignette Overlay */}
        <div className="absolute inset-0 z-[1] w-full h-full min-w-full min-h-full pointer-events-none bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/50" />
      </div>

      <div className="relative z-10 w-full min-w-full">
        {/* Sticky High-Precision Navigation */}
        <LandingNavbar
          onOpenBooking={onOpenBooking}
          onOpenPortal={onOpenPortal}
          onNavigateAuth={onNavigateAuth}
        />

        {/* Flagship Showpiece Hero Section */}
        <HeroSection
          onOpenBooking={onOpenBooking}
          onOpenPortal={onOpenPortal}
        />

        {/* Interactive 01-06 Clinical Services Experience */}
        <ServicesSection
          onOpenBooking={onOpenBooking}
        />

        {/* Precision Meets Modern Technology Showcase */}
        <TechnologySection />

        {/* Real Drag-To-Compare Before & After Results */}
        <BeforeAfterSection />

        {/* Editorial Clinical Doctors Roster */}
        <DoctorsSection
          onOpenBooking={onOpenBooking}
        />

        {/* Immersive Patient Testimonials & Trust */}
        <ReviewsSection />

        {/* Conversion CTA Banner & Comprehensive Practice Footer */}
        <CtaFooterSection
          onOpenBooking={onOpenBooking}
          onOpenPortal={onOpenPortal}
          onNavigateAuth={onNavigateAuth}
        />
      </div>
    </div>
  );
};
