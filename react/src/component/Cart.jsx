import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";


const CartItem = (props) => {
    return (<tr>
        <td>{props.data.name}</td>
        <td>{props.data.developer}</td>
        <td>{props.data.publisher}</td>
        <td>{props.data.price/100}</td>
        
        <td><button style={{background:"#ff111177", width:100}}
        onClick={() => props.handleRemove(props.data._id)}>Remove</button></td>
    </tr>)
}

const Cart = (props) => {
    const [gameIds, setGameIds] = React.useState([]);
    const [games, setGames] = React.useState([]);

    React.useEffect(() => {
        if (props.user && Array.isArray(props.user.cart)) {
            setGameIds(props.user.cart);
        }
    }, [props.user]);

    
    React.useEffect(() => {
        if (gameIds.length === 0) {
            setGames([]);
            return;
        }
        const fetchGames = async () => {
            try {
                const res = await fetch(`/api/games?ids=${gameIds.toString()}`, {
                    method: 'GET'
                });
                if (!res.ok) throw new Error('Failed to fetch games');
                const data = await res.json();
                setGames(data);
            } catch (error) {
                console.error("Error Loading Games:", error)
            }
        };
        fetchGames();
    }, [gameIds]);

    const handleRemove = async (id) => {
        let accessToken = null;
        try {
            const refreshRes = await fetch('/api/auth/refresh', {
                method: 'POST',
            });
            if (!refreshRes.ok) throw new Error('Failed to refresh token');
            const { accessToken: newAccessToken } = await refreshRes.json();
            accessToken = newAccessToken;
        } catch (error) {
            console.error("Error refreshing token:", error);
        }

        try {
            const response = await fetch(`/api/users/${props.user._id}/cart/`, {
                method: 'DELETE',
                body: JSON.stringify({ gameId: id }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                }
            });
            if (response.ok) {
                const result = await response.json();
                // Expecting result.cart to be the updated cart array
                if (Array.isArray(result.userCart)) {
                    setGameIds(result.userCart);
                }
            }
        } catch (error) {
            console.error("Error removing item from cart:", error);
        }
    }

    if (!props.user) return null;
    return (
        <>
            <h1>Cart</h1>
            {gameIds.length === 0 ? (
                <div>No items in cart</div>
            ) : (
                <>
                    <table className="tbl">
                        <tbody>
                            <tr>
                                <th>Game</th>
                                <th>Developer</th>
                                <th>Publisher</th>
                                <th>Price</th>
                                <th></th>
                            </tr>
                            {Array.isArray(games) ? (
                                games.map((game) => (
                                    <CartItem key={game._id} data={game} handleRemove={handleRemove}/>
                                ))
                            ) : null}
                        </tbody>
                    </table>
                    <Link to="/checkout"> 
                        <button >Proceed to Checkout</button>
                    </Link>
                </>
            )}
        </>
    );
};



export default Cart;