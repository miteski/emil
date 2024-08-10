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
  const [hasMore, setHasMore] = useState(true);

  console.log('ViewAgents2 component rendered');

  const fetchAgents = useCallback(async () => {
    if (!hasMore || loading) return;
    console.log('Fetching agents...');
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
      console.log('Fetched agents data:', data);
      if (Array.isArray(data.agents)) {
        if (data.agents.length === 0) {
          setHasMore(false);
        } else {
          setAgents(prevAgents => [...prevAgents, ...data.agents]);
          setPage(prevPage => prevPage + 1);
        }
      } else {
        console.error('Unexpected API response:', data);
        setError('Unexpected API response format');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      setError(error.message);
    }
    setLoading(false);
  }, [page, searchQuery, hasMore, loading]);

  useEffect(() => {
    fetchAgents();
  }, []);  // Only run on mount

  const handleSearch = (query) => {
    console.log('Search query:', query);
    setSearchQuery(query);
    setAgents([]);
    setPage(1);
    setHasMore(true);
    fetchAgents();
  };

  const handleScroll = (event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
      fetchAgents();
    }
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
          />
          {error && <div className="alert alert-danger">{error}</div>}
          <AgentTable 
            agents={agents}
            onScroll={handleScroll}
            selectedAgents={selectedAgents}
            setSelectedAgents={setSelectedAgents}
          />
          {loading && <div className="text-center mt-3">Loading...</div>}
          {!hasMore && <div className="text-center mt-3">No more agents to load</div>}
        </div>
      </div>
    </div>
  );
};

export default ViewAgents2;
