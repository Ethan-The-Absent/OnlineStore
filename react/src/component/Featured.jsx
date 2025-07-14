import React from 'react';
import GameTile from './GameTile';

const Featured = (props) => 
  {
    return (
      <div className="featured-container">
        <h1>Featured Games</h1>
        <div
          className="card-container"
          style={{
            display: 'flex',
            flexDirection: 'row',
            overflowX: 'auto',
            gap: '1rem',
            paddingBottom: '1rem',
            scrollbarWidth: 'thin',
          }}
        >
          {props.games.map((game) => (
            <GameTile className="featured-card" key={game._id} data={game} user={props.user}/>
          ))}
        </div>
      </div>
    );
  };

export default Featured;
