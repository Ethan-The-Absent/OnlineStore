import React, { useState } from 'react';
import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import GameTile from './GameTile';

const Search = (props) => {
    const [query, setQuery] = useState("");
    const location = useLocation();
    // On mount, check for ?q= in URL and initiate search if present
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('q');
        if (q && q !== query) {
            setQuery(q);
        }
    }, [location.search]);

    useEffect(() => {
        if (query) {
            (async () => {
                setLoading(true);
                setError(null);
                try {
                    const res = await fetch(`/api/games/search?q=${encodeURIComponent(query)}`);
                    if (!res.ok) throw new Error("Search failed");
                    const data = await res.json();
                    setResults(data);
                } catch (err) {
                    setError(err.message || "An error occurred");
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [query]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [page, setPage] = useState(0);

    const handleChange = (e) => {
        setQuery(e.target.value);
        setError(null);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setQuery(query)
    };

    return (
        <div className="search-component">
            <form onSubmit={handleSearch} className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search games..."
                    value={query}
                    onChange={handleChange}
                />
            </form>
            {error && <div className="alert alert-danger">{error}</div>}
            <ul className="list-group">
                {(!loading? (
                    results.games?.length > 0 ?
                        results.games.map(game => (
                            <GameTile data={game} key={game._id} user={props.user}></GameTile>
                        )) :
                        <div>No results found</div>
                        ) :
                    <div>"Loading..."</div>)}
            </ul>
        </div>
    );
};

export default Search;
