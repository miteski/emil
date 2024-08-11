import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const EditAgentModal = ({ show, onClose, onEditAgent, agent, tenants }) => {
  const [editedAgent, setEditedAgent] = useState({
    Fullname: '',
    Email: '',
    TenantID: ''
  });

  useEffect(() => {
    if (agent) {
      console.log('Agent data received in modal:', agent);
      setEditedAgent({
        Fullname: agent.Fullname || '',
        Email: agent.Email || '',
        TenantID: agent.TenantID || ''  // Note: This might need to be adjusted based on your API response
      });
    }
  }, [agent]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditedAgent(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Submitting edited agent:', editedAgent);
    onEditAgent(agent.AgentID, editedAgent);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Agent</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              name="Fullname"
              value={editedAgent.Fullname}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="Email"
              value={editedAgent.Email}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Tenant</Form.Label>
            <Form.Select
              name="TenantID"
              value={editedAgent.TenantID}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a tenant</option>
              {tenants.map(tenant => (
                <option key={tenant.TenantID} value={tenant.TenantID}>
                  {tenant.Name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Button variant="primary" type="submit">
            Save Changes
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditAgentModal;
