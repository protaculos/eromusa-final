'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { allTemplates, type Template } from '@/data/templates';
import VideoCreateModal from '@/components/video/VideoCreateModal';
import LoginModal from '@/components/LoginModal';
import PaymentModal from '@/components/PaymentModal';
import CarouselSection from '@/components/CarouselSection';
import SceneEditModal from '@/components/admin/SceneEditModal';
import AddScenePopup from '@/components/admin/AddScenePopup';

interface CategoryData {
  id: string;
  name: string;
  order: number;
  scenes: SceneData[];
}

interface SceneData {
  id: string;
  name: string;
  credits: number;
  style_id: string;
  loop_video_url: string;
  gradient: string;
}

// Convert SceneData to Template for VideoCreateModal
function sceneToTemplate(scene: SceneData): Template {
  return {
    id: scene.id,
    title: scene.name,
    thumbnail: scene.loop_video_url,
    isFree: false,
    isPopular: false,
    tags: [],
    videoUrl: scene.loop_video_url,
    gradient: scene.gradient || 'from-orange-500 via-pink-500 to-purple-600',
    duration: '5s',
    credits: scene.credits,
    instructions: ['Upper body photo', 'Good lighting', 'Facing camera', 'Natural pose'],
    styleId: scene.style_id,
  };
}

export default function DiscoverPage() {
  const { session, isAdmin } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Admin state
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [allScenes, setAllScenes] = useState<SceneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editScene, setEditScene] = useState<SceneData | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addSceneCategory, setAddSceneCategory] = useState<{ id: string; name: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Fetch categories from Supabase
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Fetch all scenes directly (fallback for when categories have no links)
  const fetchAllScenes = async () => {
    try {
      const res = await fetch('/api/scenes');
      if (res.ok) {
        const data = await res.json();
        setAllScenes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch scenes:', err);
    }
  };

  useEffect(() => {
    Promise.all([fetchCategories(), fetchAllScenes()]).finally(() => setLoading(false));
  }, []);

  // Build carousel sections: DB categories first, then fallback
  const carouselSections = useMemo(() => {
    const sections: { title: string; templates: Template[]; categoryId?: string }[] = [];

    // DB categories with scenes
    for (const cat of categories) {
      if (cat.scenes && cat.scenes.length > 0) {
        sections.push({
          title: cat.name,
          templates: cat.scenes.map(sceneToTemplate),
          categoryId: cat.id,
        });
      }
    }

    // If no categories have linked scenes yet, show all scenes as "All Scenes"
    if (sections.length === 0 && allScenes.length > 0) {
      sections.push({
        title: 'All Scenes',
        templates: allScenes.map(sceneToTemplate),
      });
    }

    // Fallback: static sections from templates.ts (only if no DB data at all)
    if (categories.length === 0 && allScenes.length === 0) {
      const popular = allTemplates.filter((t) => t.isPopular);
      if (popular.length > 0) {
        sections.push({ title: '🔥 Popular', templates: popular });
      }

      const free = allTemplates.filter((t) => t.isFree);
      if (free.length > 0) {
        sections.push({ title: '🎯 Free', templates: free });
      }
    }

    return sections;
  }, [categories, allScenes]);

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

  // Admin handlers
  const handleEditTemplate = (template: Template) => {
    const scene = categories
      .flatMap((c) => c.scenes)
      .find((s) => s.id === template.id)
      || allScenes.find((s) => s.id === template.id);
    if (scene) {
      setEditScene(scene);
      setEditModalOpen(true);
    }
  };

  const handleAddScene = (categoryId: string, categoryName: string) => {
    setAddSceneCategory({ id: categoryId, name: categoryName });
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!session?.access_token) return;
    if (!confirm(`Delete category "${categoryName}"? Scenes will be unlinked but not deleted.`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  const handleCreateCategory = async () => {
    if (!session?.access_token || !newCategoryName.trim()) return;

    setCategoryError(null);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (res.ok) {
        setNewCategoryName('');
        setShowNewCategory(false);
        fetchCategories();
      } else {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setCategoryError(err.error || `Failed to create category (${res.status})`);
      }
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B14]">
      {/* Content */}
      <div className="pt-16 md:pt-14 pb-6">
        {/* Admin: New Category button */}
        {isAdmin && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            {showNewCategory ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name..."
                    className="flex-1 bg-[#161827] border border-[#1E2130] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#EE5F96] transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    autoFocus
                  />
                  <button
                    onClick={handleCreateCategory}
                    className="bg-[#EE5F96] hover:bg-pink-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setShowNewCategory(false); setNewCategoryName(''); setCategoryError(null); }}
                    className="text-white/40 hover:text-white text-sm px-3 py-2.5"
                  >
                    Cancel
                  </button>
                </div>
                {categoryError && (
                  <p className="text-red-400 text-xs">{categoryError}</p>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowNewCategory(true)}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Category
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="w-8 h-8 animate-spin text-white/40" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          carouselSections.map((section) => (
            <CarouselSection
              key={section.title}
              title={section.title}
              templates={section.templates}
              isAutoPlay={true}
              onTemplateClick={handleTemplateClick}
              onEditTemplate={isAdmin ? handleEditTemplate : undefined}
              onAddScene={isAdmin && section.categoryId ? () => handleAddScene(section.categoryId!, section.title) : undefined}
              onDeleteCategory={isAdmin && section.categoryId ? () => handleDeleteCategory(section.categoryId!, section.title) : undefined}
              categoryId={section.categoryId}
            />
          ))
        )}
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

      {/* Admin modals */}
      <SceneEditModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditScene(null); }}
        scene={editScene}
        onSaved={fetchCategories}
      />
      {addSceneCategory && (
        <AddScenePopup
          isOpen={!!addSceneCategory}
          onClose={() => setAddSceneCategory(null)}
          categoryId={addSceneCategory.id}
          categoryName={addSceneCategory.name}
          onAdded={fetchCategories}
        />
      )}
    </div>
  );
}
