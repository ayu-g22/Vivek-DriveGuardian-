// src/utils/api.js

export const getApiBaseUrl = () => {
  // Check if running in the Android emulator
  if (
    navigator.userAgent.includes("Android") &&
    window.location.hostname === "localhost"
  ) {
    return "http://10.0.2.2:3000"; // Emulator URL
  }
  // For real device or web environment, use your local IP address or localhost
  return "http://localhost:3000"; // Local development environment
};
