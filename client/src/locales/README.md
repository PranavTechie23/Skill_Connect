# Live translation – no hardcoded languages

## How it works

1. **Single source**: Only **English** (`public/locales/en.json`) is maintained. All UI keys and text live there.
2. **Live translation**: When the user selects **any other language** (Hindi, Marathi, Tamil, etc.), the app:
   - Loads the English JSON,
   - Sends it to a **translation API** (Google or LibreTranslate),
   - Gets back the same structure in the chosen language and **caches it in memory** for that session.

So there are **no** hardcoded translation files for Hindi, Marathi, or any other language. You only maintain `en.json`; all other languages are translated **in real time** via the API.

## Adding a new language

1. **Add to the dropdown**  
   Edit `supported.ts` and add to `DEFAULT_SUPPORTED`:
   ```ts
   { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
   ```
2. **No new file needed.** Once the translation API is configured (see below), that language will work: on first select we translate from English and cache.

## Configuring the translation API

Create a `.env` in the client root (see `.env.example`):

**Option A – Google Cloud Translation API**

```env
VITE_TRANSLATION_API=google
VITE_GOOGLE_TRANSLATE_API_KEY=your_key_here
```

Get a key: [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → enable “Cloud Translation API”.

**Option B – LibreTranslate**

- **Public (may require key)**: `https://libretranslate.com`
- **Self-hosted (free, no key)**: Run [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) and set:

```env
VITE_TRANSLATION_API=libre
VITE_LIBRE_TRANSLATE_URL=https://your-libretranslate-server.com
```

If your host needs an API key:

```env
VITE_LIBRE_TRANSLATE_API_KEY=your_key
```

If **no** API is set, only English works. Selecting any other language will show an error asking you to set `VITE_TRANSLATION_API` and the API key.

## What the industry does

- **Big products**: Usually a **Translation Management System** (e.g. Phrase, Lokalise, Crowdin). Copy is stored in the TMS; the app or backend fetches translations by locale via API. Translators (human or MT) edit there. No JSON files in repo for every language.
- **Machine translation (MT)**: Used for “instant” support for many languages (e.g. Google Translate, DeepL, Azure Translator). Same idea as here: one source language, translate on demand or cache. Often used as first draft, then human review.
- **Hybrid**: Curated translations for a few main languages (e.g. en, hi, mr in this project) + MT or TMS for the rest.

This repo uses **live translation via API** only: one English source, no hardcoded files for other languages.
