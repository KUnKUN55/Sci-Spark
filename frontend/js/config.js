/**
 * API Configuration
 * Attached to window to be safely accessible from all scripts
 */
window.CONFIG = {
  // TODO: Replace with your GAS deployment URL after deploying Code-API.gs
  API_URL: 'https://script.google.com/macros/s/AKfycbxWXh9NVnfFPI6AcbWmAEgk_O8x9sa9MY41dz8bQl8-4E-kiy0wJg7cf4OQb1ZPe9LL/exec',
  
  // File upload limits (to prevent timeout)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  
  // Request timeout
  TIMEOUT: 30000 // 30 seconds
};
