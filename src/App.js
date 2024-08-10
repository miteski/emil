import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ViewAgents2 from './components/ViewAgents2';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/view-agents2" replace />} />
          <Route path="/view-agents2" element={<ViewAgents2 />} />
          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
