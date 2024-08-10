import React, { useState, useEffect } from 'react';

const AddAgentModal = ({ show, onClose, onAddAgent, tenants }) => {
  const [Fullname, setFullname] = useState('');
  const [Email, setEmail] = useState('');
  const [TenantID, setTenantID] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddAgent({ Fullname, Email, TenantID });
    setFullname('');
    setEmail('');
    setTenantID('');
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
                <label htmlFor="Fullname">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="Fullname"
                  value={Fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="Email">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="Email"
                  value={Email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="TenantID">Tenant</label>
                <select
                  className="form-control"
                  id="TenantID"
                  value={TenantID}
                  onChange={(e) => setTenantID(e.target.value)}
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
              <button type="submit" className="btn btn-primary">Add Agent</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAgentModal;
