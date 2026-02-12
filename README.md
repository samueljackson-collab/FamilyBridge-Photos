# FamilyBridge Photos

FamilyBridge Photos is an elder-friendly, privacy-first photo management and sharing app inspired by the simplicity of modern cloud galleries, but designed to run entirely in the browser. It focuses on large controls, accessible navigation, and clear workflows so families can upload, organize, relive, and share memories with less friction.

> [!NOTE]
> The current codebase is a front-end prototype: files are handled in-browser with the `File` API and app state is kept in memory. There is no backend persistence in this repository yet.

## Table of Contents

- [Overview](#overview)
- [Why FamilyBridge Photos](#why-familybridge-photos)
- [Feature Highlights](#feature-highlights)
- [Detailed Workflow Guide](#detailed-workflow-guide)
  - [1) Add files](#1-add-files)
  - [2) Browse and filter](#2-browse-and-filter)
  - [3) Explore details, metadata, and map locations](#3-explore-details-metadata-and-map-locations)
  - [4) Organize into albums](#4-organize-into-albums)
  - [5) Share with family](#5-share-with-family)
  - [6) Revisit memories and slideshow](#6-revisit-memories-and-slideshow)
- [Accessibility & UX Design](#accessibility--ux-design)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Operational Best Practices](#operational-best-practices)
- [Security & Privacy Blueprint (Production Planning)](#security--privacy-blueprint-production-planning)
- [Data Lifecycle & Integrity Model](#data-lifecycle--integrity-model)
- [Performance Guidance](#performance-guidance)
- [Deployment Patterns (Future Backend)](#deployment-patterns-future-backend)
- [User Personas & Accessibility Scenarios](#user-personas--accessibility-scenarios)
- [Feature-to-Component Mapping](#feature-to-component-mapping)
- [Implementation Notes by Workflow](#implementation-notes-by-workflow)
- [Future API Surface (Proposed)](#future-api-surface-proposed)
- [FAQ](#faq)
- [Workflow Preservation Appendix](#workflow-preservation-appendix)
- [Expanded Troubleshooting Matrix](#expanded-troubleshooting-matrix)
- [Documentation Change Policy](#documentation-change-policy)
- [Comprehensive Legacy-to-Current Merge Appendix](#comprehensive-legacy-to-current-merge-appendix)
- [Detailed Accessibility Specification Matrix](#detailed-accessibility-specification-matrix)
- [Extended API Reference (Planned + Legacy-Compatible)](#extended-api-reference-planned--legacy-compatible)
- [Backup & Retention Operations Guide](#backup--retention-operations-guide)
- [Security Operations Playbook](#security-operations-playbook)
- [Roadmap Ideas](#roadmap-ideas)
- [Contributing](#contributing)
- [License](#license)

## Overview

FamilyBridge Photos is built around one core goal: make digital photo management less intimidating for elderly family members while still providing power features for caregivers and tech-savvy relatives.

The app provides:

- **Simple acquisition**: Add files from the device or camera, with drag-and-drop support.
- **Flexible browsing**: Navigate photos via grid or map views with fast filtering/search.
- **In-context metadata**: Read EXIF details, GPS data, camera info, and manually add tags/locations.
- **Lightweight organization**: Build albums from selected files without leaving the gallery flow.
- **Sharing workflow**: Simulate sending selected photos and maintain a local sharing history.
- **Memory moments**: Discover “On this day” style memories and play slideshows.

## Why FamilyBridge Photos

Mainstream photo tools are often overloaded with settings, dense controls, and tiny interaction targets. FamilyBridge Photos intentionally prioritizes:

- **Large touch targets and clear labels** for reduced input precision demands.
- **Strong contrast with dark UI surfaces** for readability and comfort.
- **Guided flow transitions** (upload, share, success) instead of overwhelming one-screen complexity.
- **Keyboard-friendly interactions** for accessibility and alternate input modes.

## Feature Highlights

### Core Gallery Experience

- Grid view with selection, bulk actions, and keyboard-aware navigation.
- Map view for geotagged media using Leaflet + marker clustering.
- Rich filtering and sorting by:
  - File type
  - Search query
  - Date ranges
  - Location presence
  - Name, date, and size sorting options
- Inline state indicators for upload activity and offline status.

### Metadata and Detail Tools

- EXIF parsing using `exifreader` to surface:
  - Date taken
  - Camera make/model
  - Lens information
  - GPS timestamps/coordinates (when present)
- Detail screen interactions to:
  - Inspect file metadata
  - Manually set custom locations
  - Add or update custom tags

### Organization and Sharing

- Album management with creation and add-to-album workflows.
- Dedicated sharing flow:
  - Select files
  - Enter recipient details
  - Confirm “sent” state on a success screen
- Sharing history view for previously shared sets.

### Memory and Playback

- “Find memories” logic that surfaces photos from the same month/day in prior years.
- Full-screen slideshow playback from selected files or current collection context.

## Detailed Workflow Guide

### 1) Add files

Use one of three entry paths:

1. **Add Files** button (file picker)
2. **Use Camera** button (`capture`-enabled input path on supported devices)
3. **Drag and drop** anywhere on the window

After selecting files, the app routes through an upload/progress experience before inserting files into the main collection.

### 2) Browse and filter

In the **Photos** view, users can:

- Toggle between **Grid** and **Map** presentation.
- Search by filename/metadata terms.
- Filter by type or date range.
- Sort by date taken, modified date, name, or size.

Bulk selection enables toolbar actions such as delete, download, add to album, and share.

### 3) Explore details, metadata, and map locations

From a selected file, open detailed view to inspect metadata and enrich organization data:

- View extracted EXIF information.
- Open location picker modal to pin/update a custom location.
- Maintain user tags for easier discovery later.

When GPS data exists (EXIF or custom), media appears in map mode.

### 4) Organize into albums

Use the album workflow to:

- Create named albums
- Add selected files to existing albums
- Open album-scoped views while preserving access to core photo interactions

Albums are currently in-memory for the running session.

### 5) Share with family

Select one or more files and start sharing:

1. Enter recipient/share details.
2. Submit the share action.
3. Review confirmation in the success screen.
4. Revisit items in sharing history.

This repository currently models a UX-first sharing flow; it does not transmit data to an external service.

### 6) Revisit memories and slideshow

The memories action finds files matching today’s month/day from earlier years, then opens a focused memory viewer. Users can launch slideshow playback to relive selected moments in sequence.

## Accessibility & UX Design

The app’s interaction model is intentionally elder-first:

- Large typography and button surfaces.
- Icon + label pairing across major actions.
- Strong visual states for active navigation and selected items.
- Dialog-based confirmations for destructive actions.
- Focus-aware modal behavior and keyboard-friendly controls across major screens.

For deeper implementation notes, see:

- `accessibility_audit.md`
- `features.md`

## Architecture

FamilyBridge Photos currently uses a **single-page React architecture** with centralized state in `App.tsx`.

### High-level flow

1. `App.tsx` stores the source-of-truth state for files, albums, metadata overrides, sharing, and active view.
2. Main navigation switches between Photos, Albums, and Sharing views.
3. Gallery-level components derive filtered/sorted data from in-memory files.
4. Utility functions in `utils/fileUtils.ts` provide metadata extraction and file classification.

### State model (current)

- `files: File[]`
- `albums: Map<string, Set<File>>`
- `customLocations: Map<string, { latitude; longitude }>`
- `customTags: Map<string, string[]>`
- Sharing flow and upload flow state booleans/data

Because state is in-memory, refreshing the page clears session data.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| React 18 | SPA UI framework |
| TypeScript | Strong typing and safer refactors |
| Vite | Development server and production bundling |
| Leaflet + React Leaflet | Interactive mapping and geotag visualization |
| react-leaflet-cluster | Cluster rendering for dense map points |
| exifreader | EXIF extraction in the browser |

## System Requirements

- **Node.js**: 18+ recommended
- **npm**: 9+ recommended
- **Browser**: Current Chrome, Edge, Firefox, or Safari

## Installation

1. **Clone** the repository:

   ```bash
   git clone https://github.com/<your-org>/FamilyBridge-Photos.git
   cd FamilyBridge-Photos
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start development server**:

   ```bash
   npm run dev
   ```

4. Open the URL shown by Vite (typically `http://localhost:5173`).

### Production build

```bash
npm run build
```

### Preview production bundle

```bash
npm run preview
```

## Configuration

This prototype currently requires minimal configuration.

- No environment variables are required for base functionality.
- No backend service credentials are needed.
- Data persistence is session-only (memory-based).

If you plan to productionize the app, likely additions include:

- Storage backend credentials
- Authentication/session secrets
- API base URLs
- Optional feature flags for map providers and media processing pipelines

## Project Structure

```text
FamilyBridge-Photos/
├── App.tsx
├── index.tsx
├── components/
│   ├── GalleryScreen.tsx
│   ├── FileUploadScreen.tsx
│   ├── ShareScreen.tsx
│   ├── SharingHistoryScreen.tsx
│   ├── AlbumListScreen.tsx
│   ├── MapView.tsx
│   ├── PhotoDetailScreen.tsx
│   ├── Slideshow.tsx
│   └── ...
├── utils/
│   └── fileUtils.ts
├── types.ts
├── features.md
├── accessibility_audit.md
└── README.md
```

## Known Limitations

- **No persistent storage**: page refresh clears files, albums, tags, and share history.
- **No backend/API integration**: sharing, upload, and delete are local UI/data operations.
- **Session-only metadata overrides**: custom tags/locations are not saved beyond runtime.
- **Scalability constraints**: very large local file sets may impact browser memory/performance.

## Troubleshooting

### App does not start

- Confirm Node version:
  ```bash
  node -v
  ```
- Reinstall dependencies:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Map view is empty

- Ensure selected files include GPS-enabled media or custom location pins.
- Confirm geolocation filter settings are not excluding files.

### Metadata fields are missing

- Some files do not carry EXIF data (or metadata may be stripped by other apps).
- Browser-side metadata extraction depends on file format and embedded tags.

### Camera input is unavailable

- Desktop environments may not expose a camera capture flow from file input.
- Mobile browser support can vary by platform and permission settings.

## Operational Best Practices

If you are piloting this app with family members (especially elderly users), these practices improve reliability and ease of support:

### 1) Establish a caregiver setup checklist

- Validate the browser is updated and zoom is set to a comfortable level.
- Test each upload entry path (file picker, drag/drop, camera) at least once.
- Confirm map view behavior with at least one known geotagged image.
- Do a full workflow drill: upload -> tag -> album -> share.

### 2) Use a predictable organization strategy

- Keep album names event-oriented and date anchored (e.g., `2025-08 Family Reunion`).
- Use consistent tag conventions (`people`, `place`, `occasion`) to simplify search.
- Encourage immediate metadata correction (custom location/tags) while memory context is fresh.

### 3) Plan for session resets

Because this branch is memory-based, all data clears on page refresh. During demos:

- Keep a reusable sample media folder to quickly reload realistic test data.
- Avoid relying on long sessions without occasional state checkpoints.
- Document user expectations clearly so temporary state is not mistaken for data loss.

### 4) Accessibility support playbook

- Prefer larger OS/browser text settings for low-vision users.
- Train keyboard-only fallback paths for users with limited pointer dexterity.
- Favor fewer, larger albums over deep nested structures (when backend arrives) to reduce cognitive load.

## Security & Privacy Blueprint (Production Planning)

The current repository is frontend-only, but these controls are recommended when introducing backend services.

| Domain | Baseline Control | Why It Matters |
|--------|------------------|----------------|
| Authentication | Short-lived access tokens + refresh rotation | Reduces blast radius of compromised sessions |
| Authorization | Per-user and per-album access policies | Prevents accidental cross-family visibility |
| Transport | HTTPS-only + HSTS | Protects media and metadata in transit |
| Storage | Encryption at rest + key rotation | Limits risk if disks/backups are exposed |
| Auditing | Immutable share/delete/upload logs | Supports incident review and accountability |
| Rate limiting | Endpoint and identity-based throttling | Reduces abuse and brute-force pressure |
| Link sharing | Expiring signed URLs with revoke support | Enables controlled external viewing |

### Recommended secure media-delivery patterns

1. **Signed URL mode**
   - Backend generates short-lived, scope-limited URLs.
   - Frontend receives only temporary links.
2. **Authenticated proxy mode**
   - Frontend requests media through an authenticated API endpoint.
   - Backend validates session and streams content directly.

Both patterns should include anti-hotlinking and aggressive expiration policies for sensitive family content.

## Data Lifecycle & Integrity Model

To keep expectations clear, this is the practical lifecycle model for the current prototype and a suggested target model for production.

### Current prototype lifecycle (in-memory)

```text
Local file selection -> Browser File objects -> In-memory React state -> UI actions
                                          \-> Lost on refresh/tab close
```

### Target production lifecycle (recommended)

```text
Ingest API -> Validation -> Persistent object storage -> Metadata index -> Search/filter views
                     \-> Integrity checksums -> Backup snapshots -> Restore testing
```

### Integrity checklist for a future backend

- Compute and store content checksums at ingest time.
- Separate canonical originals from derived thumbnails/transcodes.
- Track operation history (upload/edit/tag/delete/share) with actor/time metadata.
- Add scheduled backup verification and periodic restore drills.

## Performance Guidance

As collections grow, browser memory and rendering strategy become important.

### Practical optimization directions

- **Thumbnail strategy**: render reduced previews in grid contexts instead of full-size images.
- **Lazy loading**: defer offscreen media with intersection observers.
- **Virtualization**: window long lists/grids to reduce DOM pressure.
- **Chunked metadata extraction**: process EXIF in batches to avoid main-thread spikes.
- **Map clustering tuning**: adjust cluster radius/max zoom for dense photo sets.

### Performance sanity checks during development

- Test with mixed media sizes (small phone images + large DSLR files).
- Observe memory growth while repeatedly opening/closing detail and map views.
- Validate responsiveness of multi-select and bulk actions at higher file counts.

## Deployment Patterns (Future Backend)

When this app evolves from prototype to self-hosted family service, these deployment patterns are pragmatic:

### Pattern A: Single-host home server

- Reverse proxy + frontend + API + object storage on one trusted machine.
- Suitable for small family usage with low operational complexity.
- Requires disciplined backup and patching routines.

### Pattern B: Split app + storage

- Frontend/API on a VPS; encrypted object storage on managed service.
- Better uptime and remote accessibility.
- Requires stronger secret management and network policy hardening.

### Pattern C: Hybrid private cloud + local backup

- Primary cloud deployment with scheduled encrypted sync to local NAS.
- Balances resilience and household data sovereignty.
- Adds operational complexity but strongest disaster-recovery posture.

## Roadmap Ideas

- Persistent local database (IndexedDB) and optional cloud sync backend.
- Multi-user accounts with role-based permissions.
- Secure share links with expiration and access controls.
- Background thumbnail generation and media transcoding.
- AI-assisted organization (face grouping, event clustering, semantic search).

## User Personas & Accessibility Scenarios

FamilyBridge Photos is intentionally designed for mixed-skill households. These personas help frame current UX decisions and guide future backend priorities.

| Persona | Primary Need | Current Support in App | Recommended Future Enhancement |
|--------|---------------|------------------------|--------------------------------|
| Grandparent (low vision) | Large controls and predictable navigation | Large labels/buttons, simplified views, clear tab structure | Per-user persistent text scaling, optional high-contrast themes |
| Caregiver (organizer) | Fast cleanup and categorization | Filtering/sorting, album assignment, metadata editing | Bulk metadata editing + rule-based auto-tagging |
| Family contributor (mobile-first) | Quick uploads from phone camera | Camera/file input + drag/drop support | Resumable upload queue + background sync |
| Family viewer (casual) | Easy memory browsing | Memories and slideshow flows | Shared story timelines and curated highlights |

### Accessibility usage scenarios

- **Keyboard-only operation:** navigating tab targets, selecting photos, opening dialogs, and confirming actions without mouse reliance.
- **Reduced precision input:** large target buttons for upload/share operations and clear separation between destructive and non-destructive actions.
- **Cognitive load reduction:** linear flow transitions (upload -> browse -> organize -> share) rather than dense all-in-one control surfaces.

## Feature-to-Component Mapping

This section maps user-visible features to implementation files to accelerate onboarding and contribution.

| Product Feature | Primary Components | Supporting Files |
|-----------------|--------------------|------------------|
| Global flow/state | `App.tsx` | `types.ts` |
| Primary navigation | `components/MainNavigation.tsx` | `components/Header.tsx` |
| Upload flow | `components/FileUploadScreen.tsx`, `components/DragDropOverlay.tsx` | `components/UploadIndicator.tsx` |
| Gallery and filtering | `components/GalleryScreen.tsx`, `components/FileList.tsx` | `utils/fileUtils.ts` |
| Map exploration | `components/MapView.tsx` | `components/LocationPickerModal.tsx` |
| File detail and metadata | `components/PhotoDetailScreen.tsx` | `utils/fileUtils.ts` |
| Albums | `components/AlbumListScreen.tsx`, `components/AddToAlbumModal.tsx` | `App.tsx` album state handlers |
| Sharing flow | `components/ShareScreen.tsx`, `components/SuccessScreen.tsx`, `components/SharingHistoryScreen.tsx` | `types.ts` shared details model |
| Playback & memories | `components/Slideshow.tsx`, `components/MemoryViewerModal.tsx` | `components/GalleryScreen.tsx` memory search logic |

## Implementation Notes by Workflow

### Upload and ingest behavior

- Incoming files are deduplicated by `(name, size)` prior to upload flow simulation.
- Completed uploads are merged and date-sorted by `lastModified` (newest first).
- Drag/drop listeners are attached at window level with a drag counter to prevent overlay flicker on nested enter/leave events.

### Selection and bulk actions

- Gallery selection is maintained as a `Set<File>` for fast inclusion/removal.
- Delete operations remove selected files from both global file state and album membership sets.
- Download operations rely on object URLs and can require user confirmation for larger batches.

### Metadata and map integration

- Metadata extraction and type classification are delegated to utility helpers in `utils/fileUtils.ts`.
- Geospatial points can originate from EXIF GPS data or user-defined custom coordinates.
- Map mode and location filters are derived from merged metadata/custom location state.

### Sharing and success state

- Sharing is modeled as a deliberate multi-step UI state transition.
- Successful share submissions are added to an in-memory history list, newest first.
- Share flow can be canceled safely without mutating gallery data.

## Future API Surface (Proposed)

The following API design is proposed for productionization. It intentionally mirrors current UI workflows so frontend state transitions can be progressively wired to real services.

### Suggested endpoints

| Method | Endpoint | Purpose |
|-------|----------|---------|
| `POST` | `/api/uploads/init` | Create upload session and return target(s) |
| `POST` | `/api/uploads/{sessionId}/parts` | Upload chunks/parts for resumable transfers |
| `POST` | `/api/uploads/{sessionId}/complete` | Finalize upload, trigger metadata extraction |
| `GET` | `/api/media` | Paginated media query with filters/sort |
| `GET` | `/api/media/{id}` | Retrieve full metadata and derivative links |
| `PATCH` | `/api/media/{id}` | Update tags, title, location, and attributes |
| `DELETE` | `/api/media/{id}` | Soft-delete media object |
| `POST` | `/api/albums` | Create album |
| `POST` | `/api/albums/{id}/items` | Add or reorder album items |
| `POST` | `/api/shares` | Create a share event/link |
| `GET` | `/api/shares/history` | Return user share history |

### Data contract guidance

- Use opaque media IDs (not storage paths) in all client-facing payloads.
- Separate canonical media metadata from user-editable annotations.
- Include `updatedAt`, `createdBy`, and `revision` fields for optimistic concurrency and auditability.

## FAQ

### Is FamilyBridge Photos production-ready today?

Not yet. This repository is currently a frontend prototype with in-memory state and no persistent backend in the current branch.

### Why do my photos disappear after refresh?

Because files, tags, albums, and sharing history are session-scoped state values in React memory for this prototype.

### Does the app upload images to third-party cloud services?

No. In the current implementation, files stay local to the browser session.

### Can I use this as a design baseline for a real self-hosted family gallery?

Yes. The UX patterns and state flows are suitable as a strong foundation for a backend-powered implementation.

## Workflow Preservation Appendix

This appendix exists to make one guarantee explicit for future documentation edits:

- Existing workflows must stay documented end-to-end.
- Existing visual aids (tables/charts/diagrams) must not be removed when expanding the README.
- New material should be additive and cross-linked rather than replacing historical context.

### Canonical workflow checklist

Use this checklist when reviewing README updates:

| Workflow | Must remain documented | Verification cue |
|---------|------------------------|------------------|
| Upload flow | Add Files / Camera / Drag-Drop | Steps are present in "Detailed Workflow Guide" |
| Browse flow | Grid + Map + filter/sort controls | Feature and workflow sections include both views |
| Metadata flow | EXIF + custom tags/locations | Metadata section and implementation notes both reference it |
| Album flow | Create + add + view album scope | Album workflow remains intact |
| Sharing flow | Select -> compose -> success -> history | Sharing section and FAQ still reflect state model |
| Memory flow | On-this-day discovery + slideshow | Memory section remains present |

### Documentation review rubric

Before merging README changes, verify:

1. **No workflow loss:** all major flows still have explicit steps.
2. **No structural regression:** table of contents still links to all prior sections.
3. **No chart/table regression:** existing tables remain and continue to render.
4. **No capability ambiguity:** prototype limitations and future targets are both clear.

## Expanded Troubleshooting Matrix

| Symptom | Likely Cause | Quick Check | Recommended Action |
|--------|---------------|-------------|--------------------|
| Files not visible after refresh | In-memory prototype state reset | Reload after upload and observe state | Re-import media; for production planning, add persistence layer |
| Drag-drop overlay flickers | Nested dragenter/dragleave events | Reproduce by dragging over child elements | Keep drag-counter guard logic and avoid removing global listeners |
| Map has fewer points than expected | Missing EXIF GPS or location filter active | Compare file metadata vs map filters | Add custom location pins or adjust location filters |
| Share history appears empty after restart | Session-only sharing history | Restart browser tab and re-open Sharing tab | Document session constraints; future backend should persist events |
| Slow gallery interactions at higher file counts | Browser memory/DOM pressure | Load a larger mixed dataset | Apply virtualization/lazy-loading and thumbnail optimizations |
| Inconsistent camera upload behavior | Browser/device capture support differences | Test same flow on mobile and desktop | Provide file-picker fallback and clarify expected behavior |

## Documentation Change Policy

To prevent future regressions in documentation depth:

- **Additive-first edits:** prefer appending and cross-linking over replacing sections.
- **Historical continuity:** if sections are superseded, mark them as legacy and keep context.
- **Diff hygiene:** documentation PRs should explicitly list preserved workflows and preserved tables.
- **Validation step:** run a local markdown sanity pass (anchors/tables/code fences) plus project build.

### Suggested PR checklist for README updates

- [ ] I only added or improved content; I did not remove existing workflow depth.
- [ ] I preserved all existing tables/diagrams/charts and kept them readable.
- [ ] I updated the table of contents for any new headings.
- [ ] I verified markdown formatting and ran the project build command.

## Comprehensive Legacy-to-Current Merge Appendix

This appendix intentionally merges historical README depth (self-hosted/backend-oriented guidance) with the current frontend-prototype reality, so no previously useful context is lost.

### Repository reality vs. architecture intent

| Dimension | Current Branch Reality | Historical / Target Architecture |
|----------|-------------------------|----------------------------------|
| Runtime model | Frontend prototype running in browser memory | Full-stack deployment with API + storage + backup services |
| Persistence | Session-only (`File` objects in React state) | Durable object storage + metadata store |
| Authentication | Not enforced in this branch | JWT/session-backed API auth with scoped authorization |
| Media serving | Local object URLs in browser | Signed URL and/or authenticated proxy delivery |
| Backup | Conceptual/documented planning | Automated `rsync` full + incremental snapshots |

### Merged architecture view (conceptual)

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         FamilyBridge Frontend                        │
│                    React + TypeScript + Vite UI                      │
│  Upload / Browse / Metadata / Albums / Sharing / Memories / Map      │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                │ (future authenticated API calls)
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                             API Layer                                │
│         AuthN/AuthZ • Media Query • Album Ops • Share Events         │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                ┌───────────────┴────────────────┐
                ▼                                ▼
┌────────────────────────────┐     ┌──────────────────────────────────┐
│ Object / File Storage      │     │ Metadata & Search Index          │
│ Original media + previews  │     │ EXIF, tags, locations, history   │
└───────────────┬────────────┘     └────────────────┬─────────────────┘
                │                                   │
                └───────────────┬───────────────────┘
                                ▼
                     ┌──────────────────────┐
                     │ Backup / DR Pipeline │
                     │ full + incremental   │
                     │ verify + restore     │
                     └──────────────────────┘
```

## Detailed Accessibility Specification Matrix

This expands prior accessibility notes with implementation-level acceptance targets.

| Category | Target Standard | Practical Requirement | Verification Method |
|---------|------------------|-----------------------|---------------------|
| Text contrast | WCAG 2.1 AA/AAA where feasible | Primary action text and labels remain high contrast in all states | Color-contrast checks + manual visual review |
| Touch targets | 44px minimum (48px preferred) | Primary controls remain reliably tappable for low dexterity users | Responsive inspection on tablet/mobile breakpoints |
| Keyboard access | Full workflow keyboard operability | Upload, selection, dialogs, share flow, and confirmations usable by keyboard | Keyboard-only walkthrough per release |
| Focus visibility | Always-visible focus indicators | Distinct focus ring and non-color-only focus cues | Tab traversal recording |
| Motion sensitivity | Reduced motion support | Avoid mandatory rapid transitions for core actions | OS reduced-motion test pass |
| Cognitive load | Simple progressive disclosure | Keep high-risk actions behind confirmations and concise copy | UX review with caregiver persona checklist |

### Accessibility acceptance criteria for future PRs

- No new control should be introduced without an explicit accessible name.
- Modal dialogs should preserve focus trap behavior and return focus to opener.
- Destructive actions should keep clear labels and confirmation copy.
- Any new chart/table added to README should remain screen-reader parseable in markdown.

## Extended API Reference (Planned + Legacy-Compatible)

The following extends prior API notes so both historical endpoint concepts and future production-ready patterns are captured.

### Media delivery endpoints

| Endpoint | Method | Purpose | Notes |
|---------|--------|---------|-------|
| `/api/images/{path}/signed-url` | `GET` | Obtain short-lived signed media URL | Legacy-compatible pattern for direct rendering |
| `/api/images/{path}` | `GET` | Authenticated media proxy stream | Keeps auth checks server-side |
| `/api/media` | `GET` | Paginated filtered search | Preferred future endpoint replacing raw path dependence |
| `/api/media/{id}` | `GET` | Full media detail | Includes user annotations + derivatives |

### Upload endpoints

| Endpoint | Method | Purpose |
|---------|--------|---------|
| `/api/uploads/init` | `POST` | Create upload session and validate constraints |
| `/api/uploads/{sessionId}/parts` | `POST` | Receive chunked uploads |
| `/api/uploads/{sessionId}/complete` | `POST` | Finalize media ingest and trigger metadata jobs |

### Album and sharing endpoints

| Endpoint | Method | Purpose |
|---------|--------|---------|
| `/api/albums` | `POST` | Create album |
| `/api/albums/{id}/items` | `POST` | Insert/reorder album media |
| `/api/shares` | `POST` | Create share event or secure link |
| `/api/shares/history` | `GET` | Retrieve share activity history |

### Authentication header model (legacy-compatible)

```http
Authorization: Bearer <token>
```

For browser-based deployments, prefer HttpOnly cookie session models where possible, and keep short-lived access tokens out of persistent web storage.

## Backup & Retention Operations Guide

This section preserves and expands backup guidance for eventual self-hosted deployment.

### Backup modes

1. **Full backup** (`rsync -a --delete`)  
   Creates a mirror snapshot of the canonical media set.
2. **Incremental backup** (`--link-dest`)  
   Creates space-efficient snapshots by hard-linking unchanged files.
3. **Verification pass** (`--checksum --dry-run`)  
   Validates integrity without mutating destination data.

### Example operational commands

```bash
# Full backup
python scripts/backup_sync.py /photos /backup --mode full --verify

# Incremental backup
python scripts/backup_sync.py /photos /backup/hourly --mode incremental --previous-backup /backup/latest --verify
```

### Suggested retention strategy

| Window | Frequency | Retention Count | Purpose |
|--------|-----------|-----------------|---------|
| Recent | Hourly | 24-72 snapshots | Fast recovery from recent user mistakes |
| Mid-term | Daily | 30 snapshots | Month-scale incident rollback |
| Long-term | Monthly | 12+ snapshots | Disaster recovery and archival confidence |

### Restore-readiness checklist

- Perform scheduled test restores into an isolated validation directory.
- Verify sampled images open correctly across common formats.
- Compare restored metadata snapshots against expected tags/locations.
- Log mean restore time and document operational runbooks.

## Security Operations Playbook

This playbook complements architecture/security sections with actionable controls.

### Authentication and session hardening

- Enforce short token lifetimes and rotation.
- Prefer server-managed sessions in HttpOnly, `Secure`, `SameSite` cookies.
- Add anomaly detection for unusual login/share activity.

### Authorization boundaries

- Scope access at user and album levels.
- Enforce policy checks server-side for every media fetch and mutation.
- Record policy decisions in audit logs for incident investigations.

### Secure media and link handling

- Signed URLs should be time-bounded and revocable.
- Proxy mode should enforce content-type and range request policies.
- Prevent directory traversal/path injection by strict path normalization and ID-based access.

### Monitoring and incident response

| Event Type | Detection Signal | Immediate Action |
|-----------|------------------|------------------|
| Suspicious auth attempts | burst failures or unusual geolocation patterns | throttle, challenge, alert admin |
| Unusual download volume | high media egress spikes | temporarily suspend link, require re-auth |
| Unauthorized mutation attempts | repeated 403/401 on privileged endpoints | lock affected token/session and review audit trail |
| Backup drift/failures | missing expected snapshots or verify mismatch | raise incident and execute restore drill |

## Contributing

Contributions are welcome, especially in:

- Accessibility refinements
- Album and memory UX improvements
- Performance optimization for large libraries
- Backend integration architecture

Please keep documentation updated whenever user workflows, data models, or component boundaries change.

## License

This project is provided as-is for personal/family photo management and prototyping purposes.
