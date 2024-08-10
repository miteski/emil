import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import ViewAgents2 from './components/ViewAgents2';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Switch>
          <Route exact path="/" render={() => <Redirect to="/view-agents2" />} />
          <Route path="/view-agents2" component={ViewAgents2} />
          {/* Add other routes here as needed */}
          <Route path="*" render={() => <div>Page not found</div>} />
        </Switch>
      </Layout>
    </Router>
  );
}

export default App;
