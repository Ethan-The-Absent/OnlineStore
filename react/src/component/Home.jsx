import React from "react";
import { useEffect, useState } from 'react'
import GameTile from "./GameTile"
import Featured from "./Featured";
import Reccomended from './Reccomend';

import ExampleGame from '../assets/ExampleGame.json'

const Home = (props) => {
    const [page, setPage] = useState(0);
    const games = ExampleGame

    useEffect(() => {
        // Get Data
        const fetchGames = async () => {
        try {

        } catch (error) {
            console.error("Error Loading Games:", error)
        }};

        fetchGames();
    }, [page])

    return (
        <>
        <Featured games={games}/>
        <Reccomended games={games}/>
        <div>
            All Games:
            <div className="card-container">
                {
                    games.map((game) => (
                        <GameTile key={game.game_id} data={game}/>
                    ))
                }
            </div>
        </div>
        </>
    );
}
export default Home