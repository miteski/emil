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

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="view-agents-container">
      <FixedHeader 
        onSearch={handleSearch} 
        selectedCount={selectedAgents.length}
      />
      {agents.length > 0 ? (
        <AgentTable 
          agents={agents}
          onScroll={handleScroll}
          selectedAgents={selectedAgents}
          setSelectedAgents={setSelectedAgents}
        />
      ) : (
        <div>No agents found</div>
      )}
      {loading && <div>Loading...</div>}
    </div>
  );
};

export default ViewAgents2;
