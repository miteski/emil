import React from 'react';

const AgentTable = ({ agents, onScroll, selectedAgents, setSelectedAgents, onEditAgent, tenants }) => {
  console.log('Rendering AgentTable component'); // Debug log
  console.log('Agents:', agents); // Debug log
  console.log('Tenants:', tenants); // Debug log

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

  const getTenantName = (tenantId) => {
    console.log('Getting tenant name for ID:', tenantId); // Debug log
    const tenant = tenants.find(t => t.TenantID === tenantId);
    return tenant ? tenant.Name : 'N/A';
  };

  return (
    <div className="table-responsive" onScroll={onScroll} style={{maxHeight: '600px', overflowY: 'auto'}}>
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
          {agents.map(agent => (
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
              <td>{truncate(getTenantName(agent.TenantID), 20)}</td>
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
                  <button className="btn btn-sm btn-outline-info" onClick={() => {/* Edit banking info */}}>Banking</button>
                  <button className="btn btn-sm btn-outline-warning" onClick={() => {/* Edit commission rules */}}>Commission</button>
                  <button className="btn btn-sm btn-outline-success" onClick={() => {/* Send commission report */}}>Report</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => {/* Delete agent */}}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgentTable;
