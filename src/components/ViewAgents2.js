import React, { useState, useEffect, useCallback } from 'react';
import FixedHeader from './FixedHeader';
import AgentTable from './AgentTable';
import AddAgentModal from './AddAgentModal';
import EditAgentModal from './EditAgentModal';
// import { handleApiError } from '../utils/apiHandler';

const ViewAgents2 = () => {
  const [agents, setAgents] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);

  const fetchAgents = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/agents?page=${page}&pageSize=10&search=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      const data = await response.json();
      if (Array.isArray(data.agents)) {
        if (data.agents.length === 0) {
          setHasMore(false);
        } else {
          setAgents(prevAgents => [...prevAgents, ...data.agents]);
          setPage(prevPage => prevPage + 1);
        }
      } else {
        throw new Error('Unexpected API response format');
      }
    } catch (error) {
      // await handleApiError(error);
      setError(error.message);
      console.error('Error fetching agents:', error);
    }
    setLoading(false);
  }, [page, searchQuery, hasMore, loading]);

 const fetchTenants = useCallback(async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/tenants', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch tenants');
    }
    const data = await response.json();
    console.log('Fetched tenants:', data); // Debug log
    setTenants(data);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    setError('Failed to fetch tenants');
  }
}, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setAgents([]);
    setPage(1);
    setHasMore(true);
    fetchAgents();
  };

  const handleScroll = (event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10 && !loading && hasMore) {
      fetchAgents();
    }
  };

const handleAddAgent = async (newAgent) => {
  try {
    console.log('Sending new agent data:', newAgent); // Debug log
    const token = localStorage.getItem('token');
    const response = await fetch('/api/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        Fullname: newAgent.Fullname,
        Email: newAgent.Email,
        TenantID: newAgent.TenantID
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add agent');
    }

    // Refresh the agent list
    setAgents([]);
    setPage(1);
    setHasMore(true);
    fetchAgents();
  } catch (error) {
    setError(error.message);
    console.error('Error adding agent:', error);
  }
};

 const handleEditAgent = async (agentId, updatedAgent) => {
  try {
    console.log('Sending updated agent data:', updatedAgent); // Debug log
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/agents/${agentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        Fullname: updatedAgent.Fullname,
        Email: updatedAgent.Email,
        TenantID: updatedAgent.TenantID
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update agent');
    }

    // Refresh the agent list
    setAgents(agents.map(agent => 
      agent.AgentID === agentId ? { ...agent, ...updatedAgent } : agent
    ));
    fetchAgents(); // Fetch the updated list from the server
  } catch (error) {
    setError(error.message);
    console.error('Error updating agent:', error);
  }
};

  const openEditModal = (agent) => {
    setEditingAgent(agent);
    setShowEditModal(true);
  };

  return (
    <div className="container-fluid" style={{minHeight: '100vh', paddingTop: '60px'}}>
      <nav className="navbar navbar-light bg-light fixed-top">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">EMIL Insurance Suite</span>
        </div>
      </nav>
      <div className="row">
        <div className="col-12">
          <h1 className="mt-4 mb-4">Agent Management</h1>
          <FixedHeader 
            onSearch={handleSearch} 
            selectedCount={selectedAgents.length}
            onAddAgent={() => setShowAddModal(true)}
          />
          {error && <div className="alert alert-danger">{error}</div>}
          <AgentTable 
            agents={agents}
            onScroll={handleScroll}
            selectedAgents={selectedAgents}
            setSelectedAgents={setSelectedAgents}
            onEditAgent={openEditModal}
            tenants={tenants}
          />
          {loading && <div className="text-center mt-3">Loading...</div>}
          {!hasMore && agents.length > 0 && <div className="text-center mt-3">No more agents to load</div>}
          {!hasMore && agents.length === 0 && <div className="text-center mt-3">No agents found</div>}
        </div>
      </div>
      <AddAgentModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddAgent={handleAddAgent}
        tenants={tenants}
      />
      <EditAgentModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onEditAgent={handleEditAgent}
        agent={editingAgent}
        tenants={tenants}
      />
    </div>
  );
};

export default ViewAgents2;
