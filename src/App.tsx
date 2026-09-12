import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { IntuitiveChatModal } from './components/IntuitiveChatModal';
import { MissionIntro } from './components/MissionIntro';
import { WhyMande } from './components/WhyMande';
import { CapabilitiesSection } from './components/CapabilitiesSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { AgentArchitectureSection } from './components/AgentArchitectureSection';
import { BamanankanVisionSection } from './components/BamanankanVisionSection';
import { LiveDemoCta } from './components/LiveDemoCta';
import { FAQ } from './components/FAQ';
import { FinalCta } from './components/FinalCta';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';

export default function App() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const handleOpenChat = () => {
    setIsChatModalOpen(true);
  };

  const handleCloseChatModal = () => {
    setIsChatModalOpen(false);
  };

  const handleExploreArchitecture = () => {
    const elem = document.getElementById('architecture-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNotice = (msg: string) => {
    setToastMessage(msg);
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E6EDF3] selection:bg-emerald-500/20 selection:text-emerald-400 font-sans overflow-x-hidden">
      {/* 3. Navigation */}
      <Navbar
        onOpenChat={handleOpenChat}
        onOpenStudio={handleOpenChat}
      />

      {/* Main Content Area */}
      <main>
        {/* 4. Hero */}
        <Hero
          onOpenStudio={handleOpenChat}
          onExploreArchitecture={handleExploreArchitecture}
          onOpenChat={handleOpenChat}
        />

        {/* 5. Introduction (Notre Mission) */}
        <MissionIntro />

        {/* 7. Why Mande-IA (Pourquoi Mande-IA, Exa & OpenRouter) */}
        <WhyMande />

        {/* 8. Capabilities (Fonctionnalités) */}
        <CapabilitiesSection />

        {/* 9. How It Works (Comment ça marche) */}
        <HowItWorksSection />

        {/* 10. Agent Section & 11. Technology */}
        <AgentArchitectureSection />

        {/* 12. Bamanankan & 13. Vision & 14. Future */}
        <BamanankanVisionSection />

        {/* 15. Live Demo CTA */}
        <LiveDemoCta
          onOpenChat={handleOpenChat}
        />

        {/* 16. FAQ */}
        <FAQ />

        {/* 17. Final CTA */}
        <FinalCta
          onOpenChat={handleOpenChat}
        />
      </main>

      {/* 18. Footer */}
      <Footer
        onOpenChat={handleOpenChat}
      />

      {/* Interactive Mande-IA Modal (Intuitive, Clean & Modern) */}
      <IntuitiveChatModal
        isOpen={isChatModalOpen}
        onClose={handleCloseChatModal}
        onCopyNotice={handleNotice}
      />

      {/* Floating Notification Toast */}
      <Toast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
      />
    </div>
  );
}
