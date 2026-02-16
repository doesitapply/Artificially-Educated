# Project MANUS: Forensic Litigation Engine (v2.1)

**Project MANUS** is an automated forensic engine designed to reconstruct complex judicial case histories from fragmented evidence. It transforms unstructured legal data (filings, transcripts, audio recordings) into a structured, searchable, and weaponized timeline.

---

## 1. Functional Completeness Scorecard

| Module | Status | Completeness | Functionality |
| :--- | :--- | :--- | :--- |
| **Multimodal Ingestion** | Production | 95% | OCR for PDFs/Images; Transcription for Audio/Video via Gemini 1.5 Pro. |
| **Neural Timeline Extraction** | Production | 90% | Automated conversion of raw text into structured JSON events with verbatim citations. |
| **Evidence Vault** | Production | 100% | Local-first persistence (IndexedDB) with JIT loading for large media/PDF payloads. |
| **Conflict Engine** | Operational | 85% | Detection of temporal paradoxes and procedural gaps in court records. |
| **Pattern Recognition** | Operational | 80% | Algorithmic detection of "Retaliation Loops" (Protected Activity -> Adverse Action). |
| **Drafting Lab** | Advanced | 85% | Context-aware generation of federal motions using selected timeline "targets." |
| **Actor Heat Index** | Operational | 90% | Behavioral profiling of Judges/Prosecutors based on procedural frequency. |
| **Tactical Simulator** | Beta | 60% | Predictive modeling of court reactions to proposed litigant actions. |
| **Chat Assistant** | Operational | 85% | RAG-based assistant with internal app navigation capabilities (Tool Calling). |
| **Chain of Custody** | Production | 100% | SHA-256 integrity verification for every ingested evidence item. |

---

## 2. Core Operational Modules

### A. Neural Ingestion & Deconstruction
MANUS doesn't just store files; it "understands" them.
- **OCR/Transcription:** Uses Gemini's multimodal capabilities to extract text from handwritten notes, court filings, and hearing recordings.
- **Clarification Subsystem:** An interactive human-in-the-loop interface to resolve date ambiguities or factual contradictions during ingestion.

### B. The "Event-Atomic" Timeline
Unlike standard case management systems, MANUS treats every data point as an "Atomic Event."
- **Actor Identification:** Every event is tied to the specific institutional actor responsible for the action.
- **Direct Citation:** Every event is linked to a verbatim quote or timestamp in the source evidence.
- **Targeting System:** Users can "lock on" to specific events to pass them as a focused payload to the Drafting Lab.

### C. Forensic Analysis Suites
- **Conflict Analysis:** Scans the record for "impossible" sequences that undermine the presumption of regularity.
- **Pattern Recognition:** Detects 1st Amendment retaliation signatures where asserting a right leads to an immediate punitive judicial reaction.
- **Actor Network:** Calculates "Heat Scores" for court actors, identifying nodes where constitutional rights are statistically at risk.

### D. Weaponized Drafting
The Drafting Lab uses Gemini 3 Pro to fuse selected timeline facts with legal templates (DOJ Referrals, § 1983 Complaints, Motions for Sanctions). It ensures every allegation in a draft is grounded in a verified, hashed exhibit, preventing spoliation and selective disclosure issues.

---

## 3. Technical Architecture
- **Local-First Security:** Data is persisted in browser `IndexedDB`. No cloud storage. No central database.
- **Cryptographic Integrity:** Automatic SHA-256 hashing maintains a verifiable Chain of Custody.
- **AI Core:** Leveraging `gemini-3-pro-preview` for high-reasoning legal analysis and `gemini-1.5-pro` for heavy multimodal ingestion.

---

## 4. Security & Technical Sovereignty
MANUS is built for **Technical Sovereignty**. The user's case dossier is portable (JSON Export/Import) and resides entirely on the client side, making it resilient against server-side takedowns or unauthorized surveillance.