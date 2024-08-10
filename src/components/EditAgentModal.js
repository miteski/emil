import React, { useState, useEffect } from 'react';

const EditAgentModal = ({ show, onClose, onEditAgent, agent, tenants }) => {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [tenantId, setTenantId] = useState('');

  useEffect(() => {
    if (agent) {
      setFullname(agent.Fullname || '');
      setEmail(agent.Email || '');
      setTenantId(agent.TenantID || '');
    }
  }, [agent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting updated agent:', { Fullname: fullname, Email: email, TenantID: tenantId });
    onEditAgent(agent.AgentID, { Fullname: fullname, Email: email, TenantID: tenantId });
    onClose();
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Agent</h5>
            <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={onClose}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullname">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="fullname"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="tenantId">Tenant</label>
                <select
                  className="form-control"
                  id="tenantId"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  required
                >
                  <option value="">Select a tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.TenantID} value={tenant.TenantID}>
                      {tenant.Name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAgentModal;
