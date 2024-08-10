import React from 'react';

const AgentTable = ({ agents, onScroll, selectedAgents, setSelectedAgents }) => {
  const handleSelectAgent = (agentId) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const truncate = (str, n) => {
    return (str.length > n) ? str.substr(0, n-1) + '...' : str;
  };

  return (
    <div className="agent-table-container" onScroll={onScroll}>
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Email</th>
            <th>Tenant</th>
            <th>Banking Info</th>
            <th>Commission Rules</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(agent => (
            <tr key={agent.AgentID} className="agent-row">
              <td>
                <input 
                  type="checkbox" 
                  checked={selectedAgents.includes(agent.AgentID)}
                  onChange={() => handleSelectAgent(agent.AgentID)}
                />
              </td>
              <td className="text-left">{truncate(agent.Fullname, 50)}</td>
              <td className="text-left">{truncate(agent.Email, 50)}</td>
              <td className="text-left">{truncate(agent.TenantName, 50)}</td>
              <td className="text-center">
                {agent.hasBankingInfo ? '✓' : '✗'}
              </td>
              <td className="text-center">
                {agent.hasCommissionRules ? '✓' : '✗'}
              </td>
              <td>
                <button onClick={() => {/* Edit basic info */}}>Edit</button>
                <button onClick={() => {/* Edit banking info */}}>Banking</button>
                <button onClick={() => {/* Edit commission rules */}}>Commission</button>
                <button onClick={() => {/* Send commission report */}}>Report</button>
                <button onClick={() => {/* Delete agent */}}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgentTable;
