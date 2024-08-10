import React, { useState, useEffect } from 'react';

const EditAgentModal = ({ show, onClose, onEditAgent, agent }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [tenantId, setTenantId] = useState('');

  useEffect(() => {
    if (agent) {
      setFullName(agent.Fullname || '');
      setEmail(agent.Email || '');
      setTenantId(agent.TenantID || '');
    }
  }, [agent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onEditAgent(agent.AgentID, { fullName, email, tenantId });
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
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                <label htmlFor="tenantId">Tenant ID</label>
                <input
                  type="text"
                  className="form-control"
                  id="tenantId"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  required
                />
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
