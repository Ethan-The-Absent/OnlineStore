import { useEffect, useState } from 'react'
import './App.css'
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.js";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link
} from "react-router-dom"


/* Components */
import Home from './component/Home'
import Game from './component/Game';
import Account from './component/Account';
import Cart from './component/Cart';
import Checkout from './component/Checkout';
import About from './component/About';




function App() {
  const [user, setUser] = useState(null);

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
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  return (
    <>
      <Router>
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
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
                {user ? (<li className="nav-item dropdown">
                  <Link className="nav-link" to="/cart">
                    Cart
                  </Link>
                </li>) : <></>}
              </ul>
              {/* <Search setData={setData} /> */}
            </div>
          </div>
        </nav>
        <main>
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route path='account' element={<Account user={user}/>}/>
            <Route path="game/:game_id" element={<Game/>}/>
            <Route path="cart" element={<Cart user={user}/>}/>
            <Route path="checkout" element={<Checkout/>}/>
            <Route path="about" element={<About/>}/>
          </Routes>
        </main>
      </Router>
    </>
  );
}

export default App
