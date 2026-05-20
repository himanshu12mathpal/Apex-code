import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Intercept global fetch to prepend backend URL in production
const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://apex-code-backend.onrender.com');
if (apiBaseUrl) {
  const originalFetch = window.fetch;
  window.fetch = async function (resource, options) {
    let url = resource;
    if (typeof resource === 'string' && resource.startsWith('/api')) {
      const base = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
      const path = resource.startsWith('/') ? resource : `/${resource}`;
      url = `${base}${path}`;
    } else if (resource instanceof URL && resource.pathname.startsWith('/api')) {
      const base = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
      url = new URL(`${base}${resource.pathname}${resource.search}`);
    }
    return originalFetch(url, options);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
