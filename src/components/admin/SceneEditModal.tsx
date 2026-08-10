"use client";
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ConfirmModal from "@/components/ConfirmModal";
import { useModalUrlSync } from '@/hooks/useModalUrlSync';

interface SceneData {
  id: string;
  name: string;
  credits: number;
  style_id: string;
  loop_video_url: string;
  gradient: string;
}

interface SceneEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: SceneData | null;
  onSaved: () => void;
}

export default function SceneEditModal({
  isOpen,
  onClose,
  scene,
  onSaved,
}: SceneEditModalProps) {
  const { session } = useAuth();
  useModalUrlSync(isOpen, onClose);
  const [name, setName] = useState("");
  const [credits, setCredits] = useState(10);
  const [styleId, setStyleId] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Examples state
  const [examples, setExamples] = useState<{ id: string; video_url: string; name: string }[]>([]);
  const [exampleVideoFile, setExampleVideoFile] = useState<File | null>(null);
  const [exampleName, setExampleName] = useState("");
  const [exampleUploading, setExampleUploading] = useState(false);
  const [addingExample, setAddingExample] = useState(false);
  const exampleFileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!scene;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (scene) {
        setName(scene.name);
        setCredits(scene.credits);
        setStyleId(scene.style_id);
        setVideoPreview(scene.loop_video_url);
        // Fetch examples
        fetchExamples(scene.id);
      } else {
        setName("");
        setCredits(10);
        setStyleId("");
        setVideoPreview(null);
        setExamples([]);
      }
      setVideoFile(null);
      setError(null);
      setSaving(false);
      setDeleting(false);
      setAddingExample(false);
      setExampleVideoFile(null);
      setExampleName("");
    }
  }, [isOpen, scene]);

  const fetchExamples = async (sceneId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`/api/admin/scenes/${sceneId}/examples`, { headers });
      if (res.ok) {
        const data = await res.json();
        setExamples(Array.isArray(data) ? data : []);
      }
    } catch {
      setExamples([]);
    }
  };

  const handleAddExample = async () => {
    if (!scene || !session?.access_token) return;
    if (!exampleVideoFile) return;

    setExampleUploading(true);
    setError(null);

    try {
      // Upload video
      const formData = new FormData();
      formData.append("file", exampleVideoFile);
      formData.append("scene_id", scene.id);

      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json();
        throw new Error(uploadErr.error || "Failed to upload video");
      }

      const uploadData = await uploadRes.json();

      // Create example
      const res = await fetch(`/api/admin/scenes/${scene.id}/examples`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          video_url: uploadData.url,
          name: exampleName.trim() || "",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add example");
      }

      setExampleVideoFile(null);
      setExampleName("");
      // Keep the form open so admin can add multiple examples in sequence
      fetchExamples(scene.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add example");
    } finally {
      setExampleUploading(false);
    }
  };

  const handleDeleteExample = async (exampleId: string) => {
    if (!scene || !session?.access_token) return;

    try {
      const res = await fetch(`/api/admin/scenes/${scene.id}/examples?example_id=${exampleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        fetchExamples(scene.id);
      }
    } catch (err) {
      console.error("Failed to delete example:", err);
    }
  };

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (videoPreview && videoFile) URL.revokeObjectURL(videoPreview);
    };
  }, [videoPreview, videoFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Only video files are allowed");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSave = async () => {
    if (!session?.access_token) {
      setError("You must be logged in");
      return;
    }

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!styleId.trim()) {
      setError("Style ID is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = session.access_token;
      let loopVideoUrl = scene?.loop_video_url || "";

      // Upload video if a new file was selected
      if (videoFile) {
        const formData = new FormData();
        formData.append("file", videoFile);
        formData.append("scene_id", scene?.id || "temp");

        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          throw new Error(uploadErr.error || "Failed to upload video");
        }

        const uploadData = await uploadRes.json();
        loopVideoUrl = uploadData.url;
      }

      if (isEditing && scene) {
        // Update existing scene
        const res = await fetch(`/api/admin/scenes/${scene.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            credits,
            style_id: styleId.trim(),
            loop_video_url: loopVideoUrl,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update scene");
        }
      } else {
        // Create new scene
        const res = await fetch("/api/admin/scenes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            credits,
            style_id: styleId.trim(),
            loop_video_url: loopVideoUrl,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create scene");
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!scene || !session?.access_token) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/scenes/${scene.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete scene");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0A0B14] border border-[#1E2130] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#0A0B14] z-10 flex items-center justify-between p-5 border-b border-[#1E2130]">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? "Edit Scene" : "New Scene"}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-white/60 font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#161827] border border-[#1E2130] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#EE5F96] transition-colors"
              placeholder="e.g. POV Cowgirl Riding"
            />
          </div>

          {/* Credits */}
          <div>
            <label className="block text-sm text-white/60 font-medium mb-1">Credits</label>
            <input
              type="number"
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
              min={0}
              className="w-full bg-[#161827] border border-[#1E2130] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#EE5F96] transition-colors"
            />
          </div>

          {/* Style ID */}
          <div>
            <label className="block text-sm text-white/60 font-medium mb-1">Style ID</label>
            <input
              type="text"
              value={styleId}
              onChange={(e) => setStyleId(e.target.value)}
              className="w-full bg-[#161827] border border-[#1E2130] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#EE5F96] transition-colors"
              placeholder="e.g. ulora_226"
            />
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm text-white/60 font-medium mb-1">Loop Video</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-video rounded-xl border-2 border-dashed border-[#1E2130] bg-[#161827] hover:border-[#EE5F96]/50 cursor-pointer transition-colors overflow-hidden"
            >
              {videoPreview ? (
                <video
                  src={videoPreview}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-8 h-8 mx-auto text-white/30 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    <p className="text-white/40 text-xs">Click to upload video</p>
                    <p className="text-white/20 text-[10px] mt-1">.webm or .mp4</p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* Examples section — only when editing */}
          {isEditing && (
            <div className="border-t border-[#1E2130] pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-white/60 font-semibold uppercase tracking-wider">Examples</label>
                <button
                  onClick={() => setAddingExample(!addingExample)}
                  className="text-xs text-[#EE5F96] hover:text-pink-400 font-medium transition-colors"
                >
                  {addingExample ? "Cancel" : "+ Add Example"}
                </button>
              </div>

              {/* Add example form */}
              {addingExample && (
                <div className="bg-[#161827] rounded-xl p-3 space-y-2 mb-3">
                  <input
                    type="text"
                    value={exampleName}
                    onChange={(e) => setExampleName(e.target.value)}
                    placeholder="Example name (optional)"
                    className="w-full bg-[#0A0B14] border border-[#1E2130] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#EE5F96] transition-colors"
                  />
                  <input
                    ref={exampleFileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setExampleVideoFile(file);
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => exampleFileInputRef.current?.click()}
                      className="flex-1 px-3 py-2 rounded-lg border border-dashed border-[#1E2130] text-white/40 hover:text-white/60 text-xs transition-colors"
                    >
                      {exampleVideoFile ? exampleVideoFile.name : "Select video"}
                    </button>
                    <button
                      onClick={handleAddExample}
                      disabled={!exampleVideoFile || exampleUploading}
                      className="px-4 py-2 rounded-lg bg-[#EE5F96] hover:bg-pink-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                    >
                      {exampleUploading ? "Uploading..." : "Add"}
                    </button>
                  </div>
                </div>
              )}

              {/* Examples list */}
              {examples.length === 0 ? (
                <p className="text-white/30 text-xs">No examples yet</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {examples.map((ex) => (
                    <div key={ex.id} className="flex items-center gap-2 bg-[#161827] rounded-xl p-2">
                      <div className="w-12 h-16 rounded-lg overflow-hidden bg-black shrink-0">
                        <video
                          src={ex.video_url}
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover"
                          onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 0; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs truncate">{ex.name || "Untitled"}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteExample(ex.id)}
                        className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/40 transition-colors shrink-0"
                      >
                        <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isEditing && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#161827] text-white/60 hover:text-white text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#EE5F96] hover:bg-pink-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : isEditing ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Scene"
        message={`Are you sure you want to delete "${scene?.name}"? This will permanently remove it from the database and all categories. This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="bg-red-500 hover:bg-red-600"
      />
    </div>
  );
}
