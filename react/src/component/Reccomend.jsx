import React from 'react';
import GameTile from './GameTile';

const Recommended = ({ games }) => (
  <div className="recommended-container">
    <h1>Recommended Games</h1>
    <div className="card-container">
      {games.map((game) => (
        <GameTile key={game.game_id} data={game} />
      ))}
    </div>
  </div>
);

export default Recommended;
