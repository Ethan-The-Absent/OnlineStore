import React from "react";
import { Link } from "react-router-dom"

const GameTile = (props) => {
    const [owned, setOwned] = React.useState(false);

    const tags = Object.entries(props.data.tags);
    const sortedtags = tags.sort((a, b) => b[1] - a[1]);
    const toptags = sortedtags.slice(0, 3);
    const link = "/game/" + props.data._id;

    let borderColor = '';
    if (props.user?.purchases.includes(props.data._id)) {
        borderColor = '#749f76ff';
        (owned ? 1 : setOwned(true));
    } else if (props.user?.cart.includes(props.data._id)) {
        borderColor = '#03a9bcff';
    }

    return (
        <Link to={link} style={{textDecoration:'none'}}>
        <div className="card" style={borderColor ? { border: `3px solid ${borderColor}` } : {}}>
           <h4>{props.data.name}</h4>
           <p>{props.data.developer}</p>
           <>
                {owned ? <h5>Owned</h5> : (<h5>{props.data.discount ? (
                <>  
                    <span className="discount">-{Math.floor(props.data.discount)}% </span>
                    <span className="faint-text" style={{ textDecoration: 'line-through'}}>${props.data.initialPrice/100}</span>
                    <span> ${props.data.price/100}</span>
                </>
            ) : (
                <span>{props.data.price === 0 ? 'Free' : `$${props.data.price/100}`}</span>
            ) }</h5>)}
           </>
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