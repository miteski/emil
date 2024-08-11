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
const loadingSpinner = document.getElementById('loading-spinner');
if (loadingSpinner) {
  loadingSpinner.style.display = 'none';
} else {
  console.warn('Loading spinner element not found');
}

// Log when the document is fully loaded
window.addEventListener('load', () => {
  addDebugInfo('Document fully loaded');
});
