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
        onClick={() => props.handleRemove(props.data.game_id)}>Remove</button></td>
    </tr>)
}

const Cart = () => {
    const [user, setUser] = React.useState(null);
    const [games, setGames] = React.useState([]);
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchUser = async () => {
            try {
                // Access token
                const refreshRes = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    credentials: 'include', // send cookies
                });
                if (!refreshRes.ok) throw new Error('Failed to refresh token');
                const { accessToken } = await refreshRes.json();

                // Send access token to get user data
                const userRes = await fetch('/api/auth/me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!userRes.ok) throw new Error('Failed to fetch user');
                const userData = await userRes.json();
                setUser(userData);
                // Fetch cart items
                const cartRes = await fetch(`/api/users/${userData._id}/cart`, {
                    method: 'POST',
                    headers: {'Authorization': `Bearer ${accessToken}`},
                });
                if (!cartRes.ok) throw new Error('Failed to fetch cart');
                const cartData = await cartRes.json();
                if (cartData && cartData.message === 'cart is empty') {
                    setGames([]);
                    console.log('Cart is empty');
                } else {
                    setGames(cartData.items);
                    console.log(games, "cart items fetched");
                }
            } catch (err) {
                // If error response is {message: 'cart is empty'}
                if (err && err.message && err.message.includes('cart is empty')) {
                    setGames([]);
                    console.log('Cart is empty');
                } else {
                    setUser(null);
                    console.error("Error fetching cart:", err);
                    navigate('/');
                }
            }
        };
        fetchUser();
    }, [navigate]);

    const handleRemove = async (id) => {
        //make api call to remove
        console.log(id, "removed from cart")
    }

    if (!user) return null;

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