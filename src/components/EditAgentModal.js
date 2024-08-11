import React, { useState, useEffect } from 'react';

const EditAgentModal = ({ show, onClose, onEditAgent, agent, tenants }) => {
  const [editedAgent, setEditedAgent] = useState({
    Fullname: '',
    Email: '',
    TenantID: ''
  });

  useEffect(() => {
    if (agent && tenants.length > 0) {
      console.log('Agent data received in modal:', agent);
      console.log('Current tenants:', tenants);
      const tenantID = tenants.find(t => t.Name === agent.TenantName)?.TenantID?.toString() || '';
      console.log('Found TenantID:', tenantID);
      setEditedAgent({
        Fullname: agent.Fullname || '',
        Email: agent.Email || '',
        TenantID: tenantID
      });
    }
  }, [agent, tenants]);

  useEffect(() => {
    console.log('Current editedAgent state:', editedAgent);
  }, [editedAgent]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    console.log(`Changing ${name} to:`, value);
    setEditedAgent(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Submitting edited agent:', editedAgent);
    onEditAgent(agent.AgentID, editedAgent);
    onClose();
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Agent</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="Fullname"
                  value={editedAgent.Fullname}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="Email"
                  value={editedAgent.Email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tenant</label>
                <select
                  className="form-control"
                  name="TenantID"
                  value={editedAgent.TenantID}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.TenantID} value={tenant.TenantID.toString()}>
                      {tenant.Name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAgentModal;
