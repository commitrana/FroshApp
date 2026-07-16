// Single source of truth for the backend base URL.
//
// Reads from EXPO_PUBLIC_API_URL (set in .env — see .env.example), falling
// back to the current production backend if it's not set, so nothing
// breaks if someone runs the app without an .env file.
//
// EXPO_PUBLIC_ prefixed vars are inlined at build time by Expo (SDK 49+),
// no extra config needed — just make sure .env exists before running
// `expo start` / building, and that changing it requires a restart
// (env vars are read at bundle time, not at runtime).
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://frosh-app-backend.onrender.com/api";

// Same host, without the /api suffix — for building URLs to static assets
// served from the backend (e.g. uploaded event images).
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");