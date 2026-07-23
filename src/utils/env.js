import Constants from 'expo-constants';

// IMPORTANT: Replace the IP below with your machine's local IP where the backend runs.
// Using 'localhost' won't work on a real mobile device. On Windows use `ipconfig` to find it.

const defaultApiBase = 'http://192.168.0.180:3000/api'; // <-- update this to your backend IP:PORT (dev IP is 192.168.0.180)
const extraApiBase = Constants.expoConfig?.extra?.apiBaseUrl || Constants.manifest?.extra?.apiBaseUrl || Constants.manifest?.extra?.API_BASE_URL;

// On web, prefer configured value over same-host fallback so the app does not accidentally call the local dev server origin.
export const API_BASE_URL = extraApiBase || defaultApiBase;

// For convenience, also provide default export with same property for legacy imports
export default {
  API_BASE_URL,
};
