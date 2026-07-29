'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { allTemplates, type Template } from '@/data/templates';
import VideoCreateModal from '@/components/video/VideoCreateModal';
import LoginModal from '@/components/LoginModal';
import PaymentModal from '@/components/PaymentModal';
import TemplateCard from '@/components/video/TemplateCard';
import SceneEditModal from '@/components/admin/SceneEditModal';
import ConfirmModal from '@/components/ConfirmModal';

interface SceneData {
  id: string;
  name: string;
  credits: number;
  style_id: string;
  loop_video_url: string;
  gradient: string;
}

interface SceneExample {
  id: string;
  scene_id: string;
  video_url: string;
  name: string;
  order: number;
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
  const [sceneExamples, setSceneExamples] = useState<SceneExample[]>([]);
  const [loginOpen, setLoginOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Admin state
  const [scenes, setScenes] = useState<SceneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editScene, setEditScene] = useState<SceneData | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Delete scene state (2-step flow)
  const [deleteSceneTarget, setDeleteSceneTarget] = useState<{ sceneId: string; sceneName: string } | null>(null);
  const [deleteSceneMode, setDeleteSceneMode] = useState<'site' | 'database' | null>(null);
  const [deleteSceneConfirm, setDeleteSceneConfirm] = useState<{ sceneId: string; sceneName: string; mode: 'site' | 'database' } | null>(null);

  // Fetch scenes from Supabase
  const fetchScenes = async () => {
    try {
      const res = await fetch('/api/scenes');
      if (res.ok) {
        const data = await res.json();
        setScenes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch scenes:', err);
    }
  };

  useEffect(() => {
    fetchScenes().finally(() => setLoading(false));
  }, []);

  const handleTemplateClick = async (template: Template) => {
    setSelectedTemplate(template);
    // Fetch examples for this scene
    try {
      const res = await fetch(`/api/scenes/${template.id}/examples`);
      if (res.ok) {
        const data = await res.json();
        setSceneExamples(Array.isArray(data) ? data : []);
      } else {
        setSceneExamples([]);
      }
    } catch {
      setSceneExamples([]);
    }
  };

  const handleOpenLogin = () => {
    setSelectedTemplate(null);
    setLoginOpen(true);
  };

  const handleOpenPayment = () => {
    setSelectedTemplate(null);
    setPaymentOpen(true);
  };

  // ── Admin handlers ──────────────────────────────

  const handleEditTemplate = (template: Template) => {
    const scene = scenes.find((s) => s.id === template.id);
    if (scene) {
      setEditScene(scene);
      setEditModalOpen(true);
    }
  };

  // ── Delete scene handlers (2-step flow) ───────────

  const handleDeleteScene = (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (scene) {
      setDeleteSceneTarget({ sceneId, sceneName: scene.name });
      setDeleteSceneMode(null);
    }
  };

  const handleChooseDeleteMode = (mode: 'site' | 'database') => {
    if (!deleteSceneTarget) return;
    setDeleteSceneMode(mode);
    setDeleteSceneConfirm({
      sceneId: deleteSceneTarget.sceneId,
      sceneName: deleteSceneTarget.sceneName,
      mode,
    });
  };

  const handleConfirmDeleteScene = async () => {
    if (!session?.access_token || !deleteSceneConfirm) return;
    const { sceneId, mode } = deleteSceneConfirm;

    try {
      if (mode === 'site') {
        // For now, "delete from site" with no categories = just remove from display
        // (scenes are standalone, so this is equivalent to hiding)
        setScenes((prev) => prev.filter((s) => s.id !== sceneId));
      } else {
        const res = await fetch(`/api/admin/scenes/${sceneId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error('Failed to delete scene');
        fetchScenes();
      }

      setDeleteSceneTarget(null);
      setDeleteSceneMode(null);
      setDeleteSceneConfirm(null);
    } catch (err) {
      console.error('Failed to delete scene:', err);
    }
  };

  const handleCloseDeleteScene = () => {
    setDeleteSceneTarget(null);
    setDeleteSceneMode(null);
    setDeleteSceneConfirm(null);
  };

  const handleCloseStep1 = () => {
    setDeleteSceneTarget(null);
    setDeleteSceneMode(null);
  };

  // Build templates from scenes
  const templates = scenes.map(sceneToTemplate);

  // Fallback to local templates if no scenes in DB
  const displayTemplates = templates.length > 0 ? templates : allTemplates;

  return (
    <div className="min-h-screen bg-[#0A0B14]">
      <div className="pt-16 md:pt-14 pb-6">
        {/* Admin: New Scene button */}
        {isAdmin && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <button
              onClick={() => { setEditScene(null); setEditModalOpen(true); }}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Scene
            </button>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {displayTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isAutoPlay={true}
                  onClick={() => handleTemplateClick(template)}
                  onEdit={isAdmin ? () => handleEditTemplate(template) : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedTemplate && (
        <VideoCreateModal
          isOpen={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onOpenLogin={handleOpenLogin}
          onOpenPayment={handleOpenPayment}
          sceneExamples={sceneExamples}
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
        onSaved={fetchScenes}
      />

      {/* Delete scene modals (2-step flow) */}
      <ConfirmModal
        open={!!deleteSceneTarget && !deleteSceneMode}
        onClose={handleCloseStep1}
        title="Delete Scene"
        message={`What do you want to do with "${deleteSceneTarget?.sceneName}"?`}
        actions={[
          {
            label: "Delete from site",
            color: "bg-amber-500 hover:bg-amber-600",
            onClick: () => handleChooseDeleteMode('site'),
          },
          {
            label: "Delete from database",
            color: "bg-red-500 hover:bg-red-600",
            onClick: () => handleChooseDeleteMode('database'),
          },
        ]}
      />
      <ConfirmModal
        open={!!deleteSceneConfirm}
        onClose={handleCloseDeleteScene}
        title="Are you sure?"
        message={
          deleteSceneConfirm?.mode === 'site'
            ? `"${deleteSceneConfirm?.sceneName ?? ''}" will be removed from the site.`
            : `"${deleteSceneConfirm?.sceneName ?? ''}" will be permanently deleted from the database. This cannot be undone.`
        }
        confirmLabel={
          deleteSceneConfirm?.mode === 'site' ? "Yes, remove from site" : "Yes, delete permanently"
        }
        confirmColor={
          deleteSceneConfirm?.mode === 'site'
            ? "bg-amber-500 hover:bg-amber-600"
            : "bg-red-500 hover:bg-red-600"
        }
        onConfirm={handleConfirmDeleteScene}
      />
    </div>
  );
}
