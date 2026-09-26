# AnimStreamX

AnimStreamX is a Vite + React anime streaming catalog with client-side pages for the home experience, catalog, title details, and embedded watching.

## Run locally on Replit

```bash
npm run dev
```

The Vite server listens on `0.0.0.0:5000`, which is the port used by the Replit web preview.

## Build

```bash
npm run build
```

Player embeds are configured in `src/App.tsx` under the title data. The app uses the provided AbyssPlayer URLs in iframe watch views.