import React, { useState, useEffect, useCallback } from 'react';
import FixedHeader from './FixedHeader';
import AgentTable from './AgentTable';

const ViewAgents2 = () => {
  const [agents, setAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

const fetchAgents = useCallback(async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token'); // Assuming you store the token in localStorage
    const response = await fetch(`/api/agents?page=${page}&pageSize=10&search=${searchQuery}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }
    const data = await response.json();
    setAgents(prevAgents => [...prevAgents, ...(data.agents || [])]);
    setPage(prevPage => prevPage + 1);
  } catch (error) {
    console.error('Error fetching agents:', error);
  }
  setLoading(false);
}, [page, searchQuery]);

  
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
    <div className="view-agents-container">
      <FixedHeader 
        onSearch={handleSearch} 
        selectedCount={selectedAgents.length}
      />
      <AgentTable 
        agents={agents}
        onScroll={handleScroll}
        selectedAgents={selectedAgents}
        setSelectedAgents={setSelectedAgents}
      />
    </div>
  );
};

export default ViewAgents2;
