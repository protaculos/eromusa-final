"use client";
import React, { useState } from 'react';

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteAccountModal({ open, onClose, onConfirm }: DeleteAccountModalProps) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    if (typed !== 'DELETE') return;
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
      setTyped('');
    }
  };

  const handleClose = () => {
    if (deleting) return;
    setTyped('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0A0B14] border border-[#1E2130] rounded-2xl shadow-2xl p-6">
        {/* Ícone de alerta */}
        <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold text-white text-center mb-2">
          Delete Account
        </h2>
        <p className="text-sm text-white/50 text-center mb-6">
          This action is <span className="text-red-400 font-semibold">irreversible</span>. All your data, videos, and credits will be permanently deleted.
        </p>

        {/* Campo de confirmação */}
        <label className="block text-sm text-white/60 mb-2">
          Type <span className="font-mono font-bold text-white">DELETE</span> to confirm
        </label>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="DELETE"
          disabled={deleting}
          className="w-full px-4 py-3 rounded-xl bg-[#161827] border border-[#1E2130] text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors disabled:opacity-50"
        />

        {/* Botões */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={deleting}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white bg-[#161827] hover:bg-[#1E2130] border border-[#1E2130] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={typed !== 'DELETE' || deleting}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-600/30 disabled:text-white/30 transition-colors"
          >
            {deleting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Deleting...
              </span>
            ) : (
              'Delete Account'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
