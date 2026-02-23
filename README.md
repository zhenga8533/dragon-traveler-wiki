# Dragon Traveler Wiki

A community-driven English wiki for the Chinese mobile game **Dragon Traveler** (龙族旅人). The project is powered by curated JSON data, a React frontend, and automated deployment to GitHub Pages.

**Official site:** https://dtwiki.org

## Features

- Character database with stats, abilities, and subclasses
- Subclass database with class-linked tiers, bonuses, and effects
- Gear database with set-based equipment pages
- Status effects reference
- Wyrmspell database
- Howlkin database
- Tier list and team builder tools
- Redemption codes tracker
- Fuzzy search and keyboard shortcuts
- Dark/light theme toggle

## Release

- **v1.0.1** released on **2026-02-23**
- **v1.0.0** released on **2026-02-22**

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Mantine v8 — [frontend/README.md](frontend/README.md)
- **Backend:** Python 3.12 data tooling, Pydantic models, Dolt sync — [backend/README.md](backend/README.md)
- **Data:** JSON files in `data/` (source of truth)
- **Database:** [Dolt](https://www.dolthub.com/) version-controlled SQL database in `dolt-db/`
- **Hosting:** GitHub Pages with automated deployment and custom domain (`dtwiki.org`)

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

### Backend

```bash
cd backend
pip install -r requirements.txt
```

See [backend/README.md](backend/README.md) for data management and database sync commands.

### Build for Production

```bash
cd frontend
npm run build
```

The production build is output to `frontend/dist/`.

## Project Structure

```
dragon-traveler-wiki/
├── frontend/        # React + Vite + Mantine app
├── backend/         # Python data tooling, models, and Dolt sync
├── data/            # JSON data files (source of truth)
├── dolt-db/         # Dolt version-controlled database
└── .github/         # CI/CD workflows
```

## Data Flow

1. Curated JSON data files are maintained in `data/` (source of truth)
2. `sync_dolt.py` syncs JSON into the Dolt database for querying (including subclass normalization and class-link synchronization)
3. `export_dolt.py --merge` pulls new records from Dolt into `data/` without overwriting local changes; `export_dolt` without `--merge` does a full overwrite
4. `npm run build` automatically merges from Dolt before building (`prebuild`); CI skips this and uses committed `data/` files directly
5. On push to `main`, GitHub Actions builds the frontend, deploys to GitHub Pages, and syncs `data/` to DoltHub `main`
6. On push to `dev`, GitHub Actions syncs `data/` to DoltHub `dev` (no production deploy)
7. Local `main`/`dev` runs auto-select matching Dolt branches (`main` ↔ `main`, `dev` ↔ `dev`)
8. The frontend fetches JSON data at runtime

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
