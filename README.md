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

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Mantine v8 — [frontend/README.md](frontend/README.md)
- **Backend:** Python 3.12 data tooling and suggestion automation — [backend/README.md](backend/README.md)
- **Data:** JSON files in `data/` (source of truth)
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

See [backend/README.md](backend/README.md) for data management tooling details.

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
├── backend/         # Python data tooling, models, and suggestion automation
├── data/            # JSON data files (source of truth)
└── .github/         # CI/CD workflows
```

## Data Flow

1. Curated JSON data files are maintained in `data/` (source of truth)
2. Suggestion automation updates JSON files directly through pull requests/issues workflows
3. `npm run build` compiles the frontend from committed JSON data
4. On push to `main`, GitHub Actions builds and deploys to GitHub Pages
5. The frontend fetches JSON data at runtime

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
