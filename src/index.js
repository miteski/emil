import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('React script is running');

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error rendering React app:', error);
  document.getElementById('root').innerHTML += '<p>Error rendering React app: ' + error.message + '</p>';
}
