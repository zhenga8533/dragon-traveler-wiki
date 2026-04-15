# Dragon Traveler Wiki

A community-driven English wiki for the Chinese mobile game **Dragon Traveler** (龙族旅人).

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

- **Framework**: React 19, TypeScript, Vite 7, Mantine v8
- **Routing**: React Router DOM 7
- **Hosting**: GitHub Pages with automated deployment and custom domain (`dtwiki.org`)

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

By default the dev server looks for a `data/` folder at the repo root. To use the private data repo, clone it alongside this repo and set `DATA_DIR` in a local `.env.local` file:

```bash
cp .env.local.example .env.local
# then edit DATA_DIR to point at your local clone of dragon-traveler-data
```

### Build for Production

```bash
npm run build
```

Output is written to `dist/`. In CI, data is fetched from the private [dragon-traveler-data](https://github.com/zhenga8533/dragon-traveler-data) repo and copied into `dist/data/` before deployment.

## Project Structure

```
dragon-traveler-wiki/
├── src/             # React source (components, pages, hooks, constants, etc.)
├── public/          # Static assets copied as-is to dist
├── scripts/         # Build-time scripts
└── .github/         # CI/CD workflows
```

## Routing

| Route | Page |
| --- | --- |
| `/` | Home |
| `/characters` | Character list |
| `/characters/:name` | Character detail |
| `/artifacts` / `/artifacts/:name` | Artifact database |
| `/gear` / `/gear-sets/:setName` | Gear & gear sets |
| `/noble-phantasms` / `/noble-phantasms/:name` | Noble Phantasms |
| `/status-effects` | Status effects |
| `/wyrmspells` | Wyrmspells |
| `/howlkins` | Howlkins |
| `/subclasses` | Subclasses |
| `/resources` | Resources |
| `/tier-list` | Tier list viewer/builder |
| `/teams` / `/teams/:teamName` | Teams |
| `/codes` | Redemption codes |
| `/useful-links` | Community links |
| `/changelog` | Changelog |
| `/guides/...` | Guides |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
