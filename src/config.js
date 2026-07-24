// Local IP or localhost address
const LOCAL_BACKEND = 'http://localhost:5000';

// Render / Live Backend URL
const ONLINE_BACKEND = 'https://pos-backend-kuog.onrender.com';

// App Type: 'local' OR 'online'
export const APP_TYPE = 'online'//import.meta.env.VITE_APP_TYPE || 'online'; 

// Current Dynamic Backend URL
export const BACKEND_URL = APP_TYPE === 'online' ? ONLINE_BACKEND : LOCAL_BACKEND;