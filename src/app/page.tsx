'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
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
  visible?: boolean;
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
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [allScenes, setAllScenes] = useState<SceneData[]>([]);

  // Delete scene state (2-step flow)
  const [deleteSceneTarget, setDeleteSceneTarget] = useState<{ sceneId: string; sceneName: string } | null>(null);
  const [deleteSceneMode, setDeleteSceneMode] = useState<'site' | 'database' | null>(null);
  const [deleteSceneConfirm, setDeleteSceneConfirm] = useState<{ sceneId: string; sceneName: string; mode: 'site' | 'database' } | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Autoplay state — controlled by header toggle via SettingsContext
  const { settings } = useSettings();
  const [visibleCardIds, setVisibleCardIds] = useState<Set<string>>(new Set());
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // True when any modal is open — pauses discovery videos
  const modalOpen = !!(selectedTemplate || loginOpen || paymentOpen || editModalOpen || showAddPopup || deleteSceneTarget || deleteSceneConfirm || confirmClearAll);

  // IntersectionObserver to track which cards are at least 60% visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleCardIds((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            if (entry.isIntersecting) {
              next.add(entry.target.id);
            } else {
              next.delete(entry.target.id);
            }
          }
          return next;
        });
      },
      { threshold: 0.6 }
    );

    const currentRefs = cardRefs.current;
    currentRefs.forEach((el) => observer.observe(el));
    return () => {
      currentRefs.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [scenes]);

  // Fetch visible scenes from Supabase
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

  // ── Reorder scene handlers ──────────────────────────

  const handleReorderScene = async (sceneId: string, direction: 'up' | 'down') => {
    // Update local state immediately for responsiveness
    setScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === sceneId);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });

    // Persist to database
    if (!session?.access_token) return;
    try {
      await fetch('/api/admin/scenes/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scene_id: sceneId, direction }),
      });
    } catch (err) {
      console.error('Failed to persist reorder:', err);
      // Revert on error by refetching
      fetchScenes();
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
        // Mark as not visible in database
        const res = await fetch(`/api/admin/scenes/${sceneId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ visible: false }),
        });
        if (!res.ok) throw new Error('Failed to hide scene');
        fetchScenes();
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

  // No fallback — user adds scenes manually
  const displayTemplates = templates;

  return (
    <div className="min-h-screen bg-[#0A0B14]">
      <div className="pt-16 md:pt-14 pb-6">
        {/* Admin: New Scene button */}
        {isAdmin && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex items-center gap-3">
            <button
              onClick={() => { setEditScene(null); setEditModalOpen(true); }}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Scene
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/admin/scenes');
                  if (res.ok) {
                    const data = await res.json();
                    setAllScenes(Array.isArray(data) ? data : []);
                    setShowAddPopup(true);
                  }
                } catch {}
              }}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Scene
            </button>
            {scenes.length > 0 && (
              <button
                onClick={() => setConfirmClearAll(true)}
                className="flex items-center gap-2 text-red-400/60 hover:text-red-400 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear all
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {displayTemplates.map((template, index) => {
                const cardId = `scene-card-${template.id}`;
                const isVisible = visibleCardIds.has(cardId);
                const autoPlay = settings.autoPlayVideos && !modalOpen && isVisible;
                return (
                  <div
                    key={template.id}
                    id={cardId}
                    ref={(el) => {
                      if (el) cardRefs.current.set(cardId, el);
                      else cardRefs.current.delete(cardId);
                    }}
                    className="w-full max-w-[280px] mx-auto"
                  >
                    <TemplateCard
                      template={template}
                      isAutoPlay={autoPlay}
                      onClick={() => handleTemplateClick(template)}
                      onEdit={isAdmin ? () => handleEditTemplate(template) : undefined}
                      onDelete={isAdmin ? () => handleDeleteScene(template.id) : undefined}
                      onReorderUp={isAdmin ? () => handleReorderScene(template.id, 'up') : undefined}
                      onReorderDown={isAdmin ? () => handleReorderScene(template.id, 'down') : undefined}
                      showReorderUp={index > 0}
                      showReorderDown={index < displayTemplates.length - 1}
                    />
                  </div>
                );
              })}
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

      {/* Clear all confirmation modal */}
      <ConfirmModal
        open={confirmClearAll}
        onClose={() => setConfirmClearAll(false)}
        onConfirm={async () => {
          if (!session?.access_token) return;
          try {
            await fetch('/api/admin/scenes/clear', {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            fetchScenes();
          } catch (err) {
            console.error('Failed to clear scenes:', err);
          }
          setConfirmClearAll(false);
        }}
        title="Clear all scenes"
        message="This will remove all scenes from the display. They will remain in the database so you can add them back later."
        confirmLabel="Clear all"
        confirmColor="bg-red-500 hover:bg-red-600"
      />

      {/* Add Scene popup */}
      {showAddPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAddPopup(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-[#0A0B14] border border-[#1E2130] rounded-2xl w-full max-w-md max-h-[70vh] overflow-y-auto shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Add Scene</h2>
              <button onClick={() => setShowAddPopup(false)} className="text-white/40 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {allScenes.length === 0 ? (
              <p className="text-white/30 text-sm">No scenes in the database.</p>
            ) : (
              <div className="space-y-2">
                {allScenes.map((s) => {
                  const isVisible = scenes.some((v) => v.id === s.id);
                  return (
                    <div key={s.id} className="flex items-center gap-3 bg-[#161827] rounded-xl p-3">
                      <div className="w-10 h-14 rounded-lg overflow-hidden bg-black shrink-0">
                        <video
                          src={s.loop_video_url}
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover"
                          onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 0; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{s.name}</p>
                        <p className="text-white/30 text-xs">{s.style_id}</p>
                      </div>
                      {isVisible ? (
                        <span className="text-emerald-400 text-xs font-medium">Visible</span>
                      ) : (
                        <button
                          onClick={async () => {
                            if (!session?.access_token) return;
                            try {
                              await fetch(`/api/admin/scenes/${s.id}`, {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${session.access_token}`,
                                },
                                body: JSON.stringify({ visible: true }),
                              });
                              fetchScenes();
                              setAllScenes((prev) => prev.map((x) => x.id === s.id ? { ...x, visible: true } : x));
                            } catch {}
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#EE5F96] hover:bg-pink-600 text-white text-xs font-semibold transition-colors"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
