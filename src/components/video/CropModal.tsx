"use client";
import dynamic from 'next/dynamic';
import React, { useState, useCallback } from 'react';

const Cropper = dynamic(() => import('react-easy-crop'), { ssr: false });
import { useT } from '@/i18n/useT';
import { useModalUrlSync } from '@/hooks/useModalUrlSync';

interface CropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onConfirm: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function CropModal({ isOpen, imageSrc, onConfirm, onCancel }: CropModalProps) {
  const t = useT();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useModalUrlSync(isOpen, onCancel);

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;

    const canvas = document.createElement('canvas');
    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext('2d');

    ctx!.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        onConfirm(blob);
      }
    }, 'image/jpeg');
  }, [croppedAreaPixels, imageSrc, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0A0B14] border border-[#1E2130] rounded-2xl w-full max-w-lg mx-4 h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1E2130] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{t('videoModal.cropTitle')}</h2>
          <button onClick={onCancel} className="text-white/40 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative flex-1 min-h-[300px] bg-[#161827]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            rotation={0}
            minZoom={1}
            maxZoom={3}
            zoomSpeed={1}
            cropShape="rect"
            showGrid={true}
            restrictPosition={true}
            style={{}}
            classes={{}}
            mediaProps={{}}
            cropperProps={{}}
            keyboardStep={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Footer / Action */}
        <div className="p-4 border-t border-[#1E2130] bg-[#0A0B14]">
          <div className="flex gap-4 mb-4">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#EE5F96]"
            />
          </div>
          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-[#EE5F96] hover:bg-pink-600 text-white transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
