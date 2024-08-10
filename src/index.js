import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

function addDebugInfo(message) {
  if (typeof document !== 'undefined') {
    const debugElement = document.getElementById('debug');
    if (debugElement) {
      debugElement.innerHTML += '<p>' + message + '</p>';
    }
  }
  console.log(message);
}

addDebugInfo('React index.js loaded');

try {
  addDebugInfo('Attempting to render React app');
  const rootElement = document.getElementById('root');
  if (rootElement) {
    addDebugInfo('Root element found');
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    addDebugInfo('React app rendered');
  } else {
    addDebugInfo('Root element not found');
  }
} catch (error) {
  addDebugInfo('Error rendering React app: ' + error.message);
  console.error('Error details:', error);
}

console.log('React index.js execution completed');

// Hide loading spinner after React app is rendered
document.getElementById('loading-spinner').style.display = 'none';

// Handle route changes
function handleRouteChange() {
  const path = window.location.pathname;
  const staticContent = document.getElementById('static-content');

  if (path === '/' || path === '/index.html') {
    staticContent.style.display = 'block';
  } else {
    staticContent.style.display = 'none';
  }
}

// Initial call
handleRouteChange();

// Listen for route changes (if using client-side routing)
window.addEventListener('popstate', handleRouteChange);
