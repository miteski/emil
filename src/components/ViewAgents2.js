import React, { useState, useEffect, useCallback, useRef } from 'react';
import FixedHeader from './FixedHeader';
import AgentTable from './AgentTable';
import AddAgentModal from './AddAgentModal';
import EditAgentModal from './EditAgentModal';

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
  const [totalPages, setTotalPages] = useState(1);
  
  const fetchingAgents = useRef(false);
  const fetchingTenants = useRef(false);

  const fetchAgents = useCallback(async () => {
    if (!hasMore || loading || fetchingAgents.current) return;
    fetchingAgents.current = true;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/agents?page=${page}&pageSize=10&search=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data = await response.json();
      setAgents(prevAgents => [...prevAgents, ...data.agents]);
      setTotalPages(data.totalPages);
      setHasMore(page < data.totalPages);
      setPage(prevPage => prevPage + 1);
    } catch (error) {
      setError(error.message);
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
      fetchingAgents.current = false;
    }
  }, [page, searchQuery, hasMore, loading]);

  const fetchTenants = useCallback(async () => {
    if (fetchingTenants.current) return;
    fetchingTenants.current = true;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch tenants');
      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setError('Failed to fetch tenants');
    } finally {
      fetchingTenants.current = false;
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    if (tenants.length > 0 && agents.length === 0) {
      fetchAgents();
    }
  }, [fetchAgents, tenants, agents.length]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setAgents([]);
    setPage(1);
    setHasMore(true);
  };

  const handleScroll = useCallback((event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && !loading && hasMore && !fetchingAgents.current) {
      fetchAgents();
    }
  }, [fetchAgents, hasMore, loading]);

  const handleAddAgent = async (newAgent) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAgent)
      });
      if (!response.ok) throw new Error('Failed to add agent');
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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedAgent)
      });
      if (!response.ok) throw new Error('Failed to update agent');
      setAgents(agents.map(agent => 
        agent.AgentID === agentId ? { ...agent, ...updatedAgent } : agent
      ));
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
