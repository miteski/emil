import React, { useState, useEffect, useCallback } from 'react';
import FixedHeader from './FixedHeader';
import AgentTable from './AgentTable';

const ViewAgents2 = () => {
  const [agents, setAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAgents = useCallback(async () => {
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
        setAgents(prevAgents => [...prevAgents, ...data.agents]);
        setPage(prevPage => prevPage + 1);
      } else {
        console.error('Unexpected API response:', data);
        setError('Unexpected API response format');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      setError(error.message);
    }
    setLoading(false);
  }, [page, searchQuery]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setAgents([]);
    setPage(1);
  };

  const handleScroll = (event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (scrollHeight - scrollTop === clientHeight && !loading) {
      fetchAgents();
    }
  };

  return (
    <div className="container-fluid">
      <nav className="navbar navbar-light bg-light fixed-top">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">EMIL Insurance Suite</a>
        </div>
      </nav>
      <div className="row">
        <div className="col-12">
          <h1 className="mt-4 mb-4">Agent Management</h1>
          <FixedHeader 
            onSearch={handleSearch} 
            selectedCount={selectedAgents.length}
          />
          {error && <div className="alert alert-danger">{error}</div>}
          {agents.length > 0 ? (
            <AgentTable 
              agents={agents}
              onScroll={handleScroll}
              selectedAgents={selectedAgents}
              setSelectedAgents={setSelectedAgents}
            />
          ) : (
            <div className="alert alert-info">No agents found</div>
          )}
          {loading && <div className="text-center mt-3">Loading...</div>}
        </div>
      </div>
    </div>
  );
};

export default ViewAgents2;
