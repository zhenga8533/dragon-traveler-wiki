# Dragon Traveler Wiki

A community-driven English wiki for the Chinese mobile game **Dragon Traveler** (龙族旅人). The site automatically scrapes Chinese game databases, translates content via AI, and publishes to GitHub Pages.

## Features

- Character database with stats, abilities, and subclasses
- Status effects reference
- Wyrmspell database
- Tier list and team builder tools
- Redemption codes tracker
- Fuzzy search and keyboard shortcuts
- Dark/light theme toggle

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Mantine v8 — [frontend/README.md](frontend/README.md)
- **Backend:** Python 3.12 scrapers, Pydantic models, Dolt sync — [backend/README.md](backend/README.md)
- **Data:** JSON files in `data/` (source of truth)
- **Database:** [Dolt](https://www.dolthub.com/) version-controlled SQL database in `dolt-db/`
- **Hosting:** GitHub Pages with automated deployment

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

See [backend/README.md](backend/README.md) for scraping and database sync commands.

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
├── backend/         # Python scraping, models, and Dolt sync
├── data/            # JSON data files (source of truth)
├── dolt-db/         # Dolt version-controlled database
└── .github/         # CI/CD workflows
```

## Data Flow

1. Python scrapers fetch data from Chinese game databases
2. AI translators convert content to English
3. JSON data files are committed to `data/`
4. `sync_dolt.py` syncs JSON into the Dolt database for querying
5. GitHub Actions builds the frontend and deploys to GitHub Pages
6. The frontend fetches JSON data at runtime

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
