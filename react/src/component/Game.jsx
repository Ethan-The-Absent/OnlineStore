import React from "react";
import GameTile from "./GameTile"
import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";



const Game = (props) => {
    const star0 = '☆'
    const star1 = '★'

    
    const { game_id } = useParams();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGame = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/games/${game_id}`);
                if (!res.ok) throw new Error('Game not found');
                const data = await res.json();
                setGame(data);
            } catch (err) {
                setError(err.message);
                setGame(null);
            } finally {
                setLoading(false);
            }
        };
        fetchGame();
    }, [game_id]);

    let stars_string1 = '';
    let stars_string0 = '';
    let ratings = 0;
    let rating = 0;
    let sortedtags = [];
    if (game) {
        ratings = (game.positive + game.negative);
        rating = (game.positive/ ratings);
        const stars = (Math.round(rating * 5));
        stars_string1 = star1.repeat(stars);
        stars_string0 = star0.repeat(5 - stars);
        const tags = Object.entries(game.tags);
        sortedtags = tags.sort((a, b) => b[1] - a[1]);
    }

    // Add to cart handler
    const handleAddToCart = async () => {
        if (!props.user || !game) return;
        let accessToken = null;
        try {
            // Get new access token using refresh token in cookies
            const refreshRes = await fetch('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include',
            });
            if (!refreshRes.ok) throw new Error('Failed to refresh token');
            const refreshData = await refreshRes.json();
            accessToken = refreshData.accessToken;
        } catch (err) {
            alert('Error refreshing token');
            return;
        }

        try {
            // Make add to cart API call
            const res = await fetch(`/api/users/${props.user._id}/cart`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ gameId: game._id })
            });
            if (!res.ok) throw new Error('Failed to add to cart');
            // Targeted refresh after successful add
            if (props.incrementRefresh) props.incrementRefresh();
        } catch (err) {
            console.error("Error adding to cart:", err);
        }
    };

    return (
        game ? 
        <>
        <div>
            <h1>{game.name}</h1>
            <h3>{game.developer}</h3>
            <div className="tag-holder"> 
                {sortedtags.map((tag) => (
                <span className="tag-bubble" key={tag}>{tag[0]}</span>))}
            </div>
            <h5>{game.discount ? (
            <>  
                <span className="discount">-{Math.floor(game.discount)}% </span>
                <span className="faint-text" style={{ textDecoration: 'line-through'}}>${game.initialPrice/100}</span>
                <span> ${game.price/100}</span>
            </>
           ) : (<span>${game.price/100}</span>) }</h5>
           {props.user ? (
                Array.isArray(props.user.purchases) && props.user.purchases.includes(game._id) ? (
                    <span className="badge bg-success">Owned</span>
                ) : Array.isArray(props.user.cart) && props.user.cart.includes(game._id) ? (
                    <span className="badge bg-info">Added to Cart</span>
                ) : (
                    <button onClick={handleAddToCart}>
                        Add To Cart
                    </button>
                )
            ) :
           (<Link to="/account"><button>
            Login to add to Cart
           </button></Link>)}
           <div className="ttc">
            <span className="stars">{stars_string1}</span>
            <span className="stars star-empty">{stars_string0}</span>
            <span className="tt">{Math.round(rating * 100)}% positive</span>
            </div>
            <div className="faint-text">{ratings} ratings</div>
            <div className="mt-3">
                <div className="description-grid" style={{ display: 'flex', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    <div className="description-item card">Concurent Players: {game.ccu}</div>
                    <div className="description-item card">hello</div>
                    <div className="description-item card">hello</div>
                    <div className="description-item card">hello</div>
                </div>
            </div>
        </div>
        </>: 
        <>
        <h3>Game Not Found</h3>
        <Link to="/">Return to Home</Link>
        </>
    );
};
export default Game;