import React from 'react';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  cause: string;
  effect: string;
  claim: string;
  relief: string;
  sourceId?: string; // Link to a document
  sourceCitation?: string; // Specific text or page reference
  needsClarification?: boolean;
  clarificationQuestion?: string;
  confidence?: 'high' | 'medium' | 'low';
  // New "Lethal" fields
  legalSignificance?: string; // Why this matters legally
  citations?: string[]; // Case law or statutes
}

export interface TimelineMonth {
  month: string;
  events: TimelineEvent[];
}

export interface ReportSection {
  id: string;
  title: string;
  content: string | React.ReactNode;
  isAiGenerated?: boolean;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  batesNumber?: string; // e.g. DEF-001
  date?: string;
  type?: 'pdf' | 'text' | 'image';
  // Chain of Custody
  hash?: string; // SHA-256 fingerprint
  addedAt?: string; // ISO timestamp
}

export interface GeneratedDocument {
  id: string;
  title: string;
  type: 'motion' | 'complaint' | 'referral' | 'memo';
  content: string;
  createdAt: string;
}

export interface PatternLoop {
    id: string;
    title: string;
    description: string;
    triggerEventId?: string;
    reactionEventId?: string;
    daysLag: number;
    severity: 'high' | 'critical';
}