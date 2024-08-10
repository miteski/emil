import React, { useState, useEffect } from 'react';

const FixedHeader = ({ onSearch, selectedCount }) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        document.getElementById('search-input').focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="fixed-header">
      <div className="button-group">
        <button className="btn btn-primary">Add Agent</button>
        <button className="btn btn-danger" disabled={selectedCount === 0}>
          Bulk Delete ({selectedCount})
        </button>
      </div>
      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          id="search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search agents..."
        />
        <button type="submit">Search</button>
        <button type="button" onClick={() => setSearchQuery('')}>Clear</button>
      </form>
    </div>
  );
};

export default FixedHeader;
