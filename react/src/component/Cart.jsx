import React from "react";
import { Link } from "react-router-dom";

import games from "../assets/ExampleGame.json"

const CartItem = (props) => {
    return (<tr>
        <td>{props.data.name}</td>
        <td>{props.data.developer}</td>
        <td>{props.data.publisher}</td>
        <td>{props.data.price}</td>
        <td><button style={{background:"#ff111177", width:100}}
        onClick={() => props.handleRemove(props.data.game_id)}>Remove</button></td>
    </tr>)
}

const Cart = () => {
    const handleRemove = async (id) => {
        //make api call to remove
        console.log(id, "removed from cart")
    }
    return (<>
    <h1>Cart</h1>
        <table className="tbl">
            <tbody>
            <tr>
            <th>Game</th>
            <th>Developer</th>
            <th>Publisher</th>
            <th>Price</th>
            <th></th>
            </tr>
      {games.map((game) => (
        <CartItem key={game.game_id} data={game} handleRemove={handleRemove}/>
      ))}
      </tbody>
    </table>
    <Link to="/checkout"> 
    <button >Proceed to Checkout</button>
    </Link>
    </>);
};



export default Cart