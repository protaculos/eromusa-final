"use client";
import React, { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </AuthProvider>
  );
}
