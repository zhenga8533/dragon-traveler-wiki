# Dragon Traveler Wiki

A community-driven English wiki for the Chinese mobile game **Dragon Traveler** (龙族旅人). The site automatically scrapes Chinese game databases, translates content via AI, and publishes to GitHub Pages.

## Features

- Character database with stats and abilities
- Tier list rankings
- Items database
- Latest news and game updates
- Dark/light theme toggle

## Tech Stack

- **Frontend:** React + TypeScript + Vite, Mantine v7
- **Backend:** Python 3.12 scrapers with BeautifulSoup
- **Data:** JSON files updated via automated scraping
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
python main.py
```

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
├── backend/         # Python scraping and translation
├── data/            # JSON data (source of truth)
└── .github/         # CI/CD workflows
```

## Data Flow

1. Python scrapers fetch data from Chinese game databases
2. AI translators convert content to English
3. JSON data files are committed to the repo
4. GitHub Actions builds the frontend and deploys to GitHub Pages
5. The frontend fetches JSON data at runtime

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
