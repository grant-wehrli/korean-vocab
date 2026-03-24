# 한국어 단어장 — Korean Vocab Trainer

React + Vite web app with SM-2 spaced repetition.

## Setup

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
npm run preview
```

## Importing vocab sets

Drop a JSON file on the Import screen:

```json
{
  "ENGY204 Terms": [
    { "kr": "에너지", "rom": "eneoji", "en": "energy" },
    { "kr": "효율", "rom": "hyoyul", "en": "efficiency" }
  ]
}
```

A flat array `[{...}]` also works and will be imported as "Imported".

## Adding built-in sets

Edit `src/data/vocab.js` — add a new key to `BUILTIN_VOCAB`.

## Data storage

All progress is stored in `localStorage` under `korean_vocab_v1`.
No backend required.
