import React, { memo } from 'react';

const AgentTable = memo(({ agents, selectedAgents, setSelectedAgents, onEditAgent, onDeleteAgent, tenants }) => {
  const handleSelectAgent = (agentId) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const truncate = (str, n) => {
    return (str && str.length > n) ? str.substr(0, n-1) + '...' : str;
  };

  console.log('Rendering AgentTable with agents:', agents.length, 'tenants:', tenants.length);

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead className="sticky-top bg-light">
          <tr>
            <th>
              <input 
                type="checkbox" 
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAgents(agents.map(agent => agent.AgentID));
                  } else {
                    setSelectedAgents([]);
                  }
                }}
                checked={selectedAgents.length === agents.length && agents.length > 0}
              />
            </th>
            <th>Name</th>
            <th>Email</th>
            <th>Tenant</th>
            <th>Banking Info</th>
            <th>Commission Rules</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(agent => {
            console.log('Rendering agent:', agent);
            return (
              <tr key={agent.AgentID}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedAgents.includes(agent.AgentID)}
                    onChange={() => handleSelectAgent(agent.AgentID)}
                  />
                </td>
                <td>{truncate(agent.Fullname, 30)}</td>
                <td>{truncate(agent.Email, 30)}</td>
                <td>{truncate(agent.TenantName, 20)}</td>
                <td className="text-center">
                  {agent.hasBankingInfo ? 
                    <span className="badge bg-success">✓</span> : 
                    <span className="badge bg-danger">✗</span>}
                </td>
                <td className="text-center">
                  {agent.hasCommissionRules ? 
                    <span className="badge bg-success">✓</span> : 
                    <span className="badge bg-danger">✗</span>}
                </td>
                <td>
                  <div className="btn-group" role="group">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => onEditAgent(agent)}>Edit</button>
                    <button className="btn btn-sm btn-outline-info">Banking</button>
                    <button className="btn btn-sm btn-outline-warning">Commission</button>
                    <button className="btn btn-sm btn-outline-success">Report</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => onDeleteAgent(agent.AgentID)}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

export default AgentTable;
