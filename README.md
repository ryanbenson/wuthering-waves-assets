# wuthering-waves-assets

Assets for Wuthering Waves — character portraits, weapons, echoes, and enemies used by the companion app.

## CLI Setup

1. Install dependencies:

```bash
make install
```

2. Copy the example env file and add your TinyPNG API key (used to compress PNG output):

```bash
cp .env.example .env
# Edit .env and set TINYPNG_API_KEY
```

## Downloading Images

The CLI fetches asset lists from the [Encore API](https://api-v2.encore.moe), downloads missing images, converts them to the correct format, and skips anything already on disk.

| Command | Output directory | Format |
|---------|------------------|--------|
| `characters` | `images/` | PNG (TinyPNG compressed) |
| `weapons` | `images/weapons/` | PNG (TinyPNG compressed) |
| `echoes` | `images/echoes/` | WebP |
| `enemies` | `images/enemies/` | WebP |
| `all` | all of the above | — |

### Using Make

```bash
make characters   # download missing character portraits
make weapons      # download missing weapon icons
make echoes       # download missing echo icons
make enemies      # download missing enemy icons
make all          # download everything
```

### Using npm / node directly

```bash
npm run characters
npm run all

# or
node bin/wwaves-assets.js echoes
```

### Options

Both options work on every command (`characters`, `weapons`, `echoes`, `enemies`, `all`):

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview what would be downloaded without fetching or writing files |
| `--force` | Re-download and overwrite files that already exist |

```bash
node bin/wwaves-assets.js characters --dry-run
node bin/wwaves-assets.js weapons --force
make echoes ARGS="--dry-run"
```

While running, a progress bar shows the current item and status (`SKIP`, `FETCH`, `CONVERT`, `COMPRESS`, `SAVE`, `DRY-RUN`, `FORCE`, `FAIL`).

## Naming conventions

- **Characters, weapons, echoes** — PascalCase derived from the API name, alphanumeric only (e.g. `Xiangli Yao` → `XiangliYao.png`, `Firstlight's Herald` → `FirstlightsHerald.png`). Duplicate character names (Rover variants) get a `Male`/`Female` suffix. Other duplicates get the entry ID appended.
- **Enemies** — numeric ID from the API (e.g. `310000010.webp`).

## Requirements

- Node.js 18+
- TinyPNG API key (optional but recommended for PNG compression)
