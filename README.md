# FamilyBridge Photos

FamilyBridge Photos is a **self-hosted family photo-sharing platform** designed for households that want private, simple photo access for everyone—especially older family members.

> [!NOTE]
> This repository currently contains **project documentation and planning only**.
> The application code (`frontend/`, `backend/`) is not yet present on this branch.

## Why this project exists

Most mainstream photo apps optimize for power users, not accessibility or simplicity. FamilyBridge Photos is being designed to solve that by focusing on:

- **Large, readable UI controls** and clear navigation
- **High-contrast visuals** aligned with WCAG-friendly design practices
- **Private, self-hosted storage** so family photos stay under your control
- **Straightforward backup workflows** to reduce risk of data loss

## Planned feature set

### Photo experience
- Photo upload with progress feedback
- Grid and list browsing modes
- Calendar-based browsing by date
- Clear per-day photo counts and status feedback

### Elder-first accessibility
- Oversized interactive targets
- High-contrast, easy-to-read typography and color system
- Keyboard-focus visibility and semantic UI patterns
- Minimal, uncluttered navigation

### Security and privacy
- Authenticated API access
- Signed or authenticated image delivery (no public raw image URLs)
- Secure session handling patterns

### Backup and reliability
- Full backups using `rsync`
- Incremental snapshots with hard-link strategy
- Optional checksum verification after synchronization
- Automation-friendly CLI usage for cron/systemd

## Planned architecture

```text
Frontend (React + TypeScript + Tailwind)
        |
        | HTTPS (authenticated requests)
        v
Backend (FastAPI)
        |
        +--> Local file storage
        +--> Backup target(s) via rsync
```

## Repository status

Current branch contents:

- `README.md` (project overview and design direction)

Planned structure as implementation begins:

```text
FamilyBridge-Photos/
├── frontend/
├── backend/
├── scripts/
└── README.md
```

## Development roadmap (high level)

1. Bootstrap frontend shell and design system primitives
2. Implement authenticated backend API and media storage layer
3. Add upload/gallery/calendar workflows
4. Add backup CLI + API orchestration
5. Add deployment docs and operational runbooks

## Design principles

1. **Elder-first usability** over feature complexity
2. **Privacy by default** with self-hosted ownership
3. **Reliability** through repeatable, verifiable backups
4. **Simplicity** in both UX and deployment

## Contributing

Contributions are welcome—particularly around:

- Accessibility and inclusive design
- Secure media serving patterns
- Backup, disaster recovery, and operational hardening
- Documentation clarity and onboarding

When code is added, contribution and development setup instructions will be expanded here.

## License

Provided as-is for personal and family use unless otherwise specified in future licensing updates.
