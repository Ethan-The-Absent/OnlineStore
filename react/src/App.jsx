
import React, { useEffect, useState } from 'react';
import './App.css'
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.js";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useNavigate
} from "react-router-dom"


/* Components */
import Home from './component/Home'
import Game from './component/Game';
import Account from './component/Account';
import Cart from './component/Cart';
import Checkout from './component/Checkout';
import About from './component/About';
import Search from './component/Search';
import NavbarSearch from './component/NavbarSearch';




function App() {
  const [user, setUser] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const incrementRefresh = () => setRefresh((r) => r + 1);

  useEffect(() => {
    // Fetch access token using refreshToken cookie
    const fetchUser = async () => {
      try {
        // Access token
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include', // send cookies
        });
        if (!refreshRes.ok) throw new Error('Failed to refresh token');
        const { accessToken } = await refreshRes.json();

        // Send access token to get user id
        const userRes = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!userRes.ok) throw new Error('Failed to fetch ID');
        const userData = await userRes.json();
        // Fetch cart and purchases and add to user state var
        let cart = [];
        let purchases = [];
        if (userData._id) {
          const cartRes = await fetch(`/api/users/${userData._id}/cart`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          if (cartRes.ok) {
            cart = await cartRes.json();
          }
          const purchasesRes = await fetch(`/api/users/${userData._id}/purchases`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          if (purchasesRes.ok) {
            purchases = await purchasesRes.json();
          }
        }
        setUser({ ...userData, cart, purchases });
        
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, [refresh]);

  return (
    <>
      <Router>
        <nav className="navbar navbar-expand-md bg-body-tertiary" >
          <div className="container-fluid">
            <Link className="navbar-brand d-flex align-items-center" to="/">
              <img src="/UmbrellaGames.png" alt="Umbrella Games Logo" style={{ height: '40px', marginRight: '10px' }} />
              Umbrella Games
            </Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link className="nav-link" to="/about">
                    About
                  </Link>
                </li>
                <li className="nav-item dropdown">
                  <Link className="nav-link" to="/account">
                    {user ? `${user.username}` : 'Login'}
                  </Link>
                </li>
                {user ? (
                  <li className="nav-item dropdown">
                    <Link className="nav-link" to="/cart">
                      Cart{Array.isArray(user.cart) && user.cart.length > 0 ? ` (${user.cart.length})` : ''}
                    </Link>
                  </li>
                ) : <></>}
              </ul>
              <NavbarSearch />
            </div>
          </div>
        </nav>
        <main style={{ marginTop: 0, paddingTop: 0 }}>
          <Routes>
            <Route exact path="/" element={<Home user={user}/>} />
            <Route path='account' element={<Account user={user}/>}/>
            <Route path="game/:game_id" element={<Game user={user} incrementRefresh={incrementRefresh}/>}/>
            <Route path="cart" element={<Cart user={user} incrementRefresh={incrementRefresh}/>}/>
            <Route path="checkout" element={<Checkout/>}/>
            <Route path="about" element={<About/>}/>
            <Route path="search" element={<Search user={user}/>}/>
          </Routes>
        </main>
      </Router>
    </>)
}

export default App;
