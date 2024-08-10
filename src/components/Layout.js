import React from 'react';
import { Link } from 'react-router-dom';

function Layout({ children }) {
  return (
    <div>
      <header>
        <nav>
          <ul>
            <li><Link to="/view-agents2">View Agents</Link></li>
            {/* Add more navigation items as needed */}
          </ul>
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        {/* Add footer content */}
      </footer>
    </div>
  );
}

export default Layout;
