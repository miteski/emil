import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('React script is running');

function addDebugInfo(message) {
  if (typeof document !== 'undefined') {
    const debugElement = document.getElementById('debug');
    if (debugElement) {
      debugElement.innerHTML += '<p>' + message + '</p>';
    }
  }
  console.log(message);
}

addDebugInfo('React script started');

try {
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
  console.error('Error rendering React app:', error);
  addDebugInfo('Error rendering React app: ' + error.message);
}
