import React from 'react';

export type CaseReference = 'CR23-0657' | 'CR23-0914' | '3:24-cv-00579' | 'Other';

export interface AIConfig {
    geminiKey: string;
    openaiKey?: string; // Optional
    preferredProvider: 'gemini' | 'openai';
}

export interface CaseMetadata {
  id: string;
  name: string;
  description: string;
  created: string;
  lastModified: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  timestamp?: string; // For media events (e.g., "14:30")
  title: string;
  actor?: string; // The institutional decision-maker (e.g., "Judge Breslow")
  cause: string;
  effect: string;
  claim: string;
  relief: string;
  sourceId?: string; // Link to a document
  sourceCitation?: string; // Specific text snippet or timestamp
  snippetAnchor?: string; // ID for scrolling to specific text
  needsClarification?: boolean;
  clarificationQuestion?: string;
  confidence?: 'high' | 'medium' | 'low';
  // Lethal fields
  legalSignificance?: string; 
  citations?: string[]; // Case law or statutes
  caseReference?: string; 
  caseId?: string; // Foreign key for multi-case support
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
  content?: string; // Made optional for Metadata-Only loading
  mediaType?: 'audio' | 'video' | 'image' | 'pdf' | 'text';
  mediaData?: string; // Made optional for Metadata-Only loading
  batesNumber?: string;
  date?: string;
  // Chain of Custody
  hash?: string; // SHA-256
  addedAt?: string; // ISO timestamp
  // Phase 3.2 Reliability
  reliabilityScore?: number; // 0-100
  flaggedIssues?: string[]; // e.g., "Metadata mismatch", "Contradicts Timeline"
  caseId?: string; // Foreign key for multi-case support
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
    type: 'retaliation' | 'systemic' | 'anomaly';
}

export interface Conflict {
    id: string;
    type: 'contradiction' | 'missing_filing' | 'timeline_collision' | 'procedural_anomaly';
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    involvedEventIds?: string[];
    detectedAt: string;
}

export interface LegalStandard {
    id: string;
    category: string; // e.g. "6th Amendment", "Discovery"
    title: string; // e.g. "Brady v. Maryland"
    citation: string; // "373 U.S. 83 (1963)"
    relevance: string; // How it applies to this specific timeline
    type: 'case_law' | 'statute' | 'rule';
}

export interface ActorProfile {
    name: string;
    role: 'Judge' | 'Prosecutor' | 'Defense Counsel' | 'Clerk' | 'Law Enforcement';
    heatScore: number; // 0-100, calculated based on adverse events
    eventCount: number;
    associatedViolations: string[];
    lastActive?: string;
}

export interface SimulationScenario {
    id: string;
    userAction: string;
    predictedReaction: string;
    probability: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    likelyActors: string[];
    reasoning: string;
}