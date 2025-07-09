import React from "react";

const GameTile = (props) => {
    const tags = Object.entries(props.data.tags);
    const sortedtags = tags.sort((a, b) => b[1] - a[1]);
    const toptags = sortedtags.slice(0, 3);
    return (
        <div className="card">
           <h4>{props.data.name}</h4>
           <p>{props.data.developer}</p>
            <div>{
                    toptags.map((tag) => (
                        <div className="tag-bubble" key={tag}>{tag[0]}</div>
                    ))
                }</div>
        </div>
    );
}
export default GameTile