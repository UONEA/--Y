import React from 'react';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export interface ProcessedResult {
  originalUrl: string;
  processedUrl: string | null;
  type: MediaType;
  status: 'idle' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export interface TabProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

// Add window augmentation for Veo API Key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}