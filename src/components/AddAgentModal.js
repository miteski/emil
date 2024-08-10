import React, { useState } from 'react';

const AddAgentModal = ({ show, onClose, onAddAgent }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [tenantId, setTenantId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddAgent({ fullName, email, tenantId });
    setFullName('');
    setEmail('');
    setTenantId('');
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
            <h5 className="modal-title">Add New Agent</h5>
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
              <button type="submit" className="btn btn-primary">Add Agent</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAgentModal;
