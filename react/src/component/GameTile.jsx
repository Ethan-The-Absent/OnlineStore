import React from "react";
import { Link } from "react-router-dom"

const GameTile = (props) => {
    const tags = Object.entries(props.data.tags);
    const sortedtags = tags.sort((a, b) => b[1] - a[1]);
    const toptags = sortedtags.slice(0, 3);
    const link = "game/" + props.data.game_id
    return (
        <Link to={link} style={{textDecoration:'none'}}>
        <div className="card">
           <h4>{props.data.name}</h4>
           <p>{props.data.developer}</p>
           <h5>{props.data.discount ? (
            <>  
                <span className="discount">-{Math.floor(props.data.discount * 100)}% </span>
                <span className="faint-text" style={{ textDecoration: 'line-through'}}>${props.data.initialPrice}</span>
                <span> ${props.data.price}</span>
            </>
           ) : (<span>${props.data.price}</span>) }</h5>
            <div>{
                    toptags.map((tag) => (
                        <span className="tag-bubble" key={tag}>{tag[0]}</span>
                    ))
                }</div>
        </div>
        </Link>
    );
}
export default GameTile;