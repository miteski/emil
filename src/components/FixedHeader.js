import React, { useState } from 'react';

const FixedHeader = ({ onSearch, selectedCount }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-primary">Add Agent</button>
        <button className="btn btn-danger" disabled={selectedCount === 0}>
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
          <button type="button" className="btn btn-outline-secondary" onClick={() => setSearchQuery('')}>Clear</button>
        </div>
      </form>
    </div>
  );
};

export default FixedHeader;
