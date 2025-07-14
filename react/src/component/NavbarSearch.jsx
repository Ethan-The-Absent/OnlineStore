import React from 'react';
import { useNavigate } from 'react-router-dom';

function NavbarSearch() {
  const [query, setQuery] = React.useState("");
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };
  return (
    <form className="d-flex ms-3" onSubmit={handleSubmit} role="search">
      <input
        className="form-control me-2"
        type="search"
        placeholder="Search games..."
        aria-label="Search"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <button className="btn btn-outline-primary" type="submit">Search</button>
    </form>
  );
} export default NavbarSearch;