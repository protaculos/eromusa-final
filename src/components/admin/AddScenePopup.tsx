"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import SceneEditModal from "./SceneEditModal";

interface Scene {
  id: string;
  name: string;
  credits: number;
  style_id: string;
  loop_video_url: string;
  gradient: string;
}

interface AddScenePopupProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  existingSceneIds: string[];
  onAdded: () => void;
}

export default function AddScenePopup({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  existingSceneIds,
  onAdded,
}: AddScenePopupProps) {
  const { session } = useAuth();
  const [allScenes, setAllScenes] = useState<Scene[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [showNewSceneModal, setShowNewSceneModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all scenes
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/scenes")
      .then((r) => r.json())
      .then((data) => {
        setAllScenes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load scenes");
        setLoading(false);
      });
  }, [isOpen]);

  // Focus search input
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredScenes = allScenes.filter(
    (s) =>
      !existingSceneIds.includes(s.id) &&
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLinkScene = async (sceneId: string) => {
    if (!session?.access_token) return;
    setLinkingId(sceneId);
    setError(null);

    try {
      const res = await fetch("/api/admin/category-scenes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          category_id: categoryId,
          scene_id: sceneId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 409) {
          setError("Scene already in this category");
        } else {
          throw new Error(err.error || "Failed to link scene");
        }
        return;
      }

      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link scene");
    } finally {
      setLinkingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[#0A0B14] border border-[#1E2130] rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-[#0A0B14] z-10 flex items-center justify-between p-5 border-b border-[#1E2130]">
            <div>
              <h2 className="text-lg font-bold text-white">Add Scene</h2>
              <p className="text-sm text-white/40 mt-0.5">to {categoryName}</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search + Create New */}
          <div className="p-5 border-b border-[#1E2130] space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scenes..."
              className="w-full bg-[#161827] border border-[#1E2130] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#EE5F96] transition-colors"
            />
            <button
              onClick={() => setShowNewSceneModal(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#1E2130] text-white/60 hover:text-white hover:border-[#EE5F96]/50 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Scene
            </button>
          </div>

          {/* Scene List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="w-6 h-6 animate-spin text-white/40" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : filteredScenes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/40 text-sm">
                  {search ? "No scenes match your search" : "No scenes yet"}
                </p>
                <p className="text-white/20 text-xs mt-1">
                  {search ? "Try a different search term" : "Create one above"}
                </p>
              </div>
            ) : (
              filteredScenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => handleLinkScene(scene.id)}
                  disabled={linkingId === scene.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#161827] hover:bg-[#1E2130] transition-colors border border-transparent hover:border-[#EE5F96]/30 group"
                >
                  {/* Video preview */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-black shrink-0">
                    {scene.loop_video_url ? (
                      <video
                        src={scene.loop_video_url}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                        onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                        onMouseLeave={(e) => {
                          const vid = e.target as HTMLVideoElement;
                          vid.pause();
                          vid.currentTime = 0;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-white text-sm font-medium truncate">{scene.name}</p>
                    <p className="text-white/40 text-xs mt-0.5">
                      ✦ {scene.credits} credits
                    </p>
                  </div>

                  {/* Add button */}
                  <div className="shrink-0">
                    {linkingId === scene.id ? (
                      <svg className="w-5 h-5 animate-spin text-[#EE5F96]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white/30 group-hover:text-[#EE5F96] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-5 pb-5">
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Scene Modal */}
      <SceneEditModal
        isOpen={showNewSceneModal}
        onClose={() => setShowNewSceneModal(false)}
        scene={null}
        onSaved={() => {
          // Refresh the list
          fetch("/api/scenes")
            .then((r) => r.json())
            .then((data) => setAllScenes(Array.isArray(data) ? data : []));
        }}
      />
    </>
  );
}
