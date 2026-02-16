
# System Architecture: Project MANUS

## 1. Design Philosophy
MANUS is built as a **Single-Page Application (SPA)** that functions as a secure forensic enclave. It prioritizes **Data Sovereignty** (local persistence) and **Explainability** (linking AI insights to raw evidence).

## 2. Core Data Flow

```mermaid
graph TD
    A[Raw Evidence] -->|Upload| B(EvidenceInput)
    B -->|SHA-256 Hash| C[Chain of Custody Ledger]
    B -->|Gemini API| D{AI Extraction Core}
    D -->|JSON| E[Timeline Store (IndexedDB)]
    D -->|OCR| F[Document Store (IndexedDB)]
    
    E --> G[Analysis Engine]
    G --> H[Pattern Recognition]
    G --> I[Actor Heat Index]
    G --> J[Conflict Detector]
    
    H & I & J --> K[Drafting Lab]
    K -->|Generate| L[Legal Filing (PDF/Markdown)]
```

## 3. Component Specifications

### A. Persistence Layer (`db.ts`)
*   **Type:** IndexedDB
*   **Stores:**
    *   `cases`: Workspace metadata.
    *   `events`: The atomic units of the case. Indexed by `date` and `caseId`.
    *   `documents`: Large binary/text blobs. Indexed by `hash`.
*   **Sync:** The app loads fully into memory (`App.tsx` state) on boot for performance, writing back to DB on every mutation.

### B. Ingestion Engine (`EvidenceInput.tsx`)
*   **Parsing Strategy:**
    *   **Media:** Sent to Gemini 1.5 Pro for multimodal analysis (Audio -> Transcript + Speaker ID).
    *   **Documents:** PDF/Image -> OCR -> Structural Extraction.
*   **Error Correction:** 
    *   `safeParseJSON`: Custom parser to recover truncated JSON responses from the AI.
    *   **"Ask & Fix" UI:** Interactive chat interface to resolve ambiguity in extracted data.

### C. Analysis Modules
*   **`PatternAnalysis.tsx`:** Uses a sliding window algorithm (via AI prompt) to detect causality loops across the event stream.
*   **`ConflictAnalysis.tsx`:** Deterministic logic + Semantic checks to find logical errors in the court record (e.g., Order dated before Motion).
*   **`TacticalSimulator.tsx`:** Context-aware inference engine. Injects the last 20 events + Actor Profiles to predict future system states.

### D. Output Generation
*   **`DraftingLab.tsx`:**
    *   **Template System:** Pre-prompted structures for specific filing types (DOJ Referral, Motion to Dismiss).
    *   **Context Injection:** Dynamically assembles the relevant `TimelineEvents` and `Document` references into the prompt context to ground the generation in fact.

## 4. AI Prompt Strategy
All AI interactions are governed by `ai-config.ts` (`MASTER_SYSTEM_PROMPT`).
*   **Role:** "Forensic Litigation Engine" (not "Legal Assistant").
*   **Constraints:**
    *   Must cite sources.
    *   Must distinguish Fact from Inference.
    *   Must use "Investigator-Safe" language (e.g., "Procedural Irregularity" instead of "Fraud").

## 5. Security & Privacy
*   **API Key:** Injected at build time or runtime via environment variable.
*   **Data Isolation:** Browser sandboxing prevents external access to the IndexedDB.
*   **Export:** Users can serialize their entire case state to a JSON file for backup or transfer.
