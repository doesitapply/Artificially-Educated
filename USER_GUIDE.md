
# Operational Manual: Project MANUS

## 1. Getting Started

### Creating a Workspace
1.  Launch the application.
2.  In the Sidebar, use the dropdown to select **":: INITIALIZE NEW CASE ::"**.
3.  Name your workspace (e.g., *"Smith v. State"*). This creates a fresh, isolated database partition.

## 2. Ingestion Workflow (The "Feed")

### Uploading Evidence
1.  Navigate to **Evidence Input**.
2.  Drag & Drop files (PDF, MP3, MP4, JPG).
3.  **Wait for Processing:** The HUD will show "Analyzing..." as the AI extracts data.
    *   *Note:* Large audio files may take 30-60 seconds to transcribe.

### resolving Ambiguities (The "Ask & Fix" Loop)
If the AI cannot determine a date or title:
1.  The event will appear in the **Review Queue** with a red border.
2.  A chat box will appear asking for clarification (e.g., *"Is this an Order or a Motion?"*).
3.  **Type the answer** directly (e.g., *"It's an Order dated Jan 5th"*).
4.  Click **AUTO-FIX**. The AI will re-parse the event using your input.

### Committing Data
*   Once reviewed, click **COMMIT EVENTS**. This cryptographically signs the data (hashes it) and saves it to the permanent timeline.

## 3. Analysis Tools (The "War Room")

### Pattern Recognition
*   Open **Pattern Analysis**.
*   Click **Force Rescan**.
*   Review detected **Retaliation Loops**. Use these findings to argue "Pattern and Practice" in your filings.

### Tactical Simulator
*   Open **Wargames Sim**.
*   Type your proposed move: *"File a motion to recuse Judge for bias."*
*   Click **Simulate**.
*   Review the **Predicted Reaction** (e.g., *"80% Risk: Court will strike motion and order competency exam"*). Use this to plan countermeasures.

### Global Search
*   Use **Global Search** to find any keyword across all Documents and Timeline Events instantly.

## 4. Drafting Filings

### Generating a DOJ Referral
1.  Navigate to **Drafting Lab**.
2.  Select **DOJ Pattern-or-Practice Referral**.
3.  Click **Generate**.
4.  The system will:
    *   Aggregate all "Systemic" patterns.
    *   Attach the "Chain of Custody" log.
    *   Write the complaint using federal investigative language.
5.  Copy the output to your word processor.

## 5. Export & Backup

### Saving State
*   Click the **Save Icon** (Header) to download a `.json` file of your entire case.
*   **Keep this file safe.** It contains your entire investigation.

### Printing Reports
*   Click **EXPORT DOSSIER**.
*   The system generates a clean, printable PDF version of the Timeline, Violation Charts, and Executive Summary.
