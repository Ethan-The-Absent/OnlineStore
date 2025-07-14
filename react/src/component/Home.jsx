import React from "react";
import { useEffect, useState } from 'react'
import GameTile from "./GameTile"
import Featured from "./Featured";
import Reccomended from './Reccomend';



const Home = (props) => {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [sort, setSort] = useState(0);
    const [asc, setAsc] = useState(1);

    const [featuredGames, setFeaturedGames] = useState([]);
    const [games, setGames] = useState([]);

    const [pagination, setPagination] = useState({})


    const sortings = ['_id', 'name', 'price', 'discount', 'positive', 'genre', 'developer'];
    const sortingsString = ['Game ID', 'Name', 'Price', 'Discount', 'Positive Reviews', 'Genre', 'Developer'];

    useEffect(() => {
        // Get Data
        const fetchGames = async () => {
            const queryParams = new URLSearchParams(
                {"page": page,
                "pageSize": pageSize,
                "sortField": sortings[sort],
                "sortOrder": asc})
        try {
            const res = await fetch(`/api/games?${queryParams.toString()}`, {
                method: 'GET'});
            
            if (!res.ok) throw new Error('Failed to fetch games');
            const data = await res.json();
            setGames(data.games);
            setPagination(data.pagination);
        } catch (error) {
            console.error("Error Loading Games:", error)
        }};

        fetchGames();
    }, [page, pageSize, sort, asc])

    useEffect(() => {
        const fetchFeatured = async () => {
            const queryParams = new URLSearchParams({"page": 0,
                            "pageSize": 10,
                            "sortField": 'discount',
                            "sortOrder": -1})
            try {
                const res = await fetch(`/api/games?${queryParams.toString()}`, { method: 'GET'});
                if (!res.ok) throw new Error('Failed to fetch featured games');
                const data = await res.json();
                setFeaturedGames(data.games);
            } catch (error) {
                console.error("Error Loading Featured Games:", error);
            }
        }

        fetchFeatured();
    }, []);

    return (
        <>
            <Featured games={featuredGames} user={props.user}/>
             { props.user?
            (props.user.purchases.length > 0? 
                <Reccomended user={props.user}/>:
                <div className="alert alert-info">Purchace a Game for Reccomendations</div>
            ) : 
            <div className="alert alert-info">Log in for Personalized Reccomendations</div>
            }
            
            <div>
                {/* Paging controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                        disabled={page === 0}
                        style={{ marginRight: '1rem' }}
                    >
                        &#8592;
                    </button>
                    <h3 style={{ margin: 0 }}>All Games</h3> <p style={{ margin: '0 0 0 0.5rem' }}>(Page {page + 1})</p>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => setPage(prev => prev + 1)}
                        style={{ marginLeft: '1rem' }}
                    >
                        &#8594;
                    </button>
                </div>
                {/* Controls for sorting, order, and page size */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {/* Sort dropdown */}
                    <div>
                        <label htmlFor="sort-select" style={{ marginRight: '0.5rem' }}>Sort by:</label>
                        <select
                            id="sort-select"
                            value={sort}
                            onChange={e => { setSort(Number(e.target.value)); setPage(0); }}
                            className="form-select"
                            style={{ display: 'inline-block', width: 'auto' }}
                        >
                            {sortingsString.map((label, idx) => (
                                <option key={sortings[idx]} value={idx}>{label}</option>
                            ))}
                        </select>
                    </div>
                    {/* Ascending/Descending checkbox */}
                    <div>
                        <label htmlFor="asc-checkbox" style={{ marginRight: '0.5rem' }}>Ascending</label>
                        <input
                            id="asc-checkbox"
                            type="checkbox"
                            checked={asc === 1}
                            onChange={e => { setAsc(e.target.checked ? 1 : -1); setPage(0); }}
                        />
                    </div>
                    {/* Page size dropdown */}
                    <div>
                        <label htmlFor="page-size-select" style={{ marginRight: '0.5rem' }}>Games per page:</label>
                        <select
                            id="page-size-select"
                            value={pageSize}
                            onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
                            className="form-select"
                            style={{ display: 'inline-block', width: 'auto' }}
                        >
                            {[10, 30, 50, 100].map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="card-container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
                    {games.map((game) => (
                        <GameTile key={game._id} data={game} user={props.user}/>
                    ))}
                </div>
            </div>
        </>
    );
}
export default Home