// Backend API Base URL
// In development (npm run dev), we use empty string so Vite proxy works.
// In production (Vercel), we point directly to the Render backend.
const API_BASE = import.meta.env.DEV
  ? ''
  : 'https://apex-code-backend.onrender.com';

export default API_BASE;
