'use client';

import { useState, useMemo } from 'react';
import { allTemplates, type Template } from '@/data/templates';
import VideoCreateModal from '@/components/video/VideoCreateModal';
import LoginModal from '@/components/LoginModal';
import PaymentModal from '@/components/PaymentModal';
import CarouselSection from '@/components/CarouselSection';

const FILTER_CATEGORIES: { label: string; tags: string[] }[] = [
  { label: 'Blowjob', tags: ['blowjob', 'bj', 'deepthroat', 'fellatio'] },
  { label: 'Anal', tags: ['anal', 'anal_sex', 'butt', 'ass'] },
  { label: 'Positions', tags: ['missionary', 'doggy', 'cowgirl', 'reverse_cowgirl', '69', 'spooning'] },
  { label: 'Sex', tags: ['sex', 'fucking', 'intercourse', 'hardcore'] },
  { label: 'Cum', tags: ['cum', 'cumshot', 'facial', 'creampie', 'sperm'] },
  { label: 'Foot', tags: ['foot', 'feet', 'footjob'] },
  { label: 'Handjob', tags: ['handjob', 'hj', 'hand'] },
  { label: 'POV', tags: ['pov', 'point_of_view'] },
  { label: 'Pussy', tags: ['pussy', 'vagina', 'cunnilingus', 'licking'] },
  { label: 'Tits', tags: ['tits', 'boobs', 'breasts', 'nipple'] },
  { label: 'Pregnant', tags: ['pregnant', 'preggo'] },
  { label: 'BBC', tags: ['bbc', 'big_black_cock'] },
  { label: '69', tags: ['69'] },
  { label: 'Kissing', tags: ['kissing', 'kiss', 'make_out'] },
  { label: 'Squirt', tags: ['squirt', 'squirting'] },
  { label: 'Toys', tags: ['toys', 'dildo', 'vibrator', 'sex_toy'] },
  { label: 'Solo', tags: ['solo', 'masturbation', 'stroking'] },
  { label: 'Other', tags: ['other', 'v2', 'undress'] },
];

export default function DiscoverPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Carousel sections
  const carouselSections = useMemo(() => {
    const sections: { title: string; templates: Template[] }[] = [];

    // Popular section
    const popular = allTemplates.filter((t) => t.isPopular);
    if (popular.length > 0) {
      sections.push({ title: '🔥 Popular', templates: popular });
    }

    // Free section
    const free = allTemplates.filter((t) => t.isFree);
    if (free.length > 0) {
      sections.push({ title: '🎯 Free', templates: free });
    }

    // Category sections
    for (const cat of FILTER_CATEGORIES) {
      const catTemplates = allTemplates.filter((t) =>
        t.tags.some((tag) => cat.tags.includes(tag))
      );
      if (catTemplates.length > 0) {
        sections.push({ title: cat.label, templates: catTemplates });
      }
    }

    return sections;
  }, []);

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleOpenLogin = () => {
    setSelectedTemplate(null);
    setLoginOpen(true);
  };

  const handleOpenPayment = () => {
    setSelectedTemplate(null);
    setPaymentOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0B14]">
      {/* Content */}
      <div className="pt-16 md:pt-14 pb-6">
        {carouselSections.map((section) => (
          <CarouselSection
            key={section.title}
            title={section.title}
            templates={section.templates}
            onTemplateClick={handleTemplateClick}
          />
        ))}
      </div>

      {/* Modals */}
      {selectedTemplate && (
        <VideoCreateModal
          isOpen={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onOpenLogin={handleOpenLogin}
          onOpenPayment={handleOpenPayment}
          template={{
            id: selectedTemplate.id,
            name: selectedTemplate.title,
            duration: selectedTemplate.duration,
            credits: selectedTemplate.credits,
            videoUrl: selectedTemplate.videoUrl,
            thumbnailUrl: selectedTemplate.thumbnail,
            instructions: selectedTemplate.instructions,
            tags: selectedTemplate.tags,
            gradient: selectedTemplate.gradient,
            styleId: selectedTemplate.styleId,
          }}
        />
      )}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <PaymentModal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} />
    </div>
  );
}
