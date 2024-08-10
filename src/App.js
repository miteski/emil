import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ViewAgents2 from './components/ViewAgents2';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/view-agents2" component={ViewAgents2} />
        {/* Other routes */}
      </Switch>
    </Router>
  );
}

export default App;
