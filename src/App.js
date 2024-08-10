import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ViewAgents2 from './components/ViewAgents2';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/view-agents2" element={<ViewAgents2 />} />
          <Route path="/" element={<Navigate to="/view-agents2" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
