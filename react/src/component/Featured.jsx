import React from 'react';
import GameTile from './GameTile'; // Assuming GameTile is in the same directory

const Featured = ({ games }) => (
  <div className="featured-container">
    <h1>Featured Games</h1>
    <div className="card-container">
      {games.map((game) => (
        <GameTile key={game.game_id} data={game} />
      ))}
    </div>
  </div>
);

export default Featured;
