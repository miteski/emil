import React, { useState } from 'react';

const FixedHeader = ({ onSearch, selectedCount, onAddAgent, onBulkDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    onSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-primary" onClick={onAddAgent}>Add Agent</button>
        <button 
          className="btn btn-danger" 
          disabled={selectedCount === 0}
          onClick={onBulkDelete}
        >
          Bulk Delete ({selectedCount})
        </button>
      </div>
      <form onSubmit={handleSearchSubmit}>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents..."
          />
          <button type="submit" className="btn btn-outline-secondary">Search</button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleClear}>Clear</button>
        </div>
      </form>
    </div>
  );
};

export default FixedHeader;
