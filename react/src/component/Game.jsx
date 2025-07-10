import React from "react";
import GameTile from "./GameTile"
import ExampleGame from "../assets/ExampleGame.json"
import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";



const Game = (props) => {
    const star0 = '☆'
    const star1 = '★'

    const blurb ="Dive into the thrilling world of [Game Title], where you play as the daring [Main Character Role] tasked with saving [Setting or World Type] from imminent peril. Customize your skills and gear, form alliances with compelling characters, and navigate through intense challenges to uncover the truth and defeat [Antagonists/Challenges]. Whether adventuring solo or teaming up in multiplayer, every choice you make shapes the fate of the realms."
    const [userKey, setUserKey] = useState(()=> {
        return localStorage.getItem('userKey') || '';
      });
    
      useEffect(() => {
        localStorage.setItem('userKey', userKey);
      }, [userKey]);
    
    const { game_id } = useParams();
    const game = ExampleGame[game_id];
    let stars_string1 = '';
    let stars_string0 = '';
    let ratings = 0;
    let rating = 0;

    let sortedtags = []
    if (game) {
        ratings = (game.positive + game.negative);
        rating = (game.positive/ ratings);
        const stars = (Math.round(rating * 5));
        stars_string1 = star1.repeat(stars);
        stars_string0 = star0.repeat(5 - stars);

        const tags = Object.entries(game.tags);
        sortedtags = tags.sort((a, b) => b[1] - a[1]);
    }

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
            <p>{blurb}</p>
            
            <h5>{game.discount ? (
            <>  
                <span className="discount">-{Math.floor(game.discount * 100)}% </span>
                <span className="faint-text" style={{ textDecoration: 'line-through'}}>${game.initialPrice}</span>
                <span> ${game.price}</span>
            </>
           ) : (<span>${game.price}</span>) }</h5>
           {userKey ? (
           <button>
            Add To Cart
           </button>) :
           (<Link to="/login"><button>
            Login to add to Cart
           </button></Link>)}
           <div className="ttc">
            <span className="stars">{stars_string1}</span>
            <span className="stars star-empty">{stars_string0}</span>
            <span className="tt">{Math.round(rating * 100)}% positive</span>
            </div>
            <div className="faint-text">{ratings} ratings</div>
            </div>
        </>: 
        <>
        <h3>Game Not Found</h3>
        <Link to="/">Return to Home</Link>
        </>
    );
};
export default Game;