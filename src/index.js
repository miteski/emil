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

// Add this for additional debugging
console.log('React index.js execution completed');
