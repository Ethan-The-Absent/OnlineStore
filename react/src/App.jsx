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
  const [userKey, setUserKey] = useState(()=> {
    return localStorage.getItem('userKey') || '';
  });

  useEffect(() => {
    localStorage.setItem('userKey', userKey);
  }, [userKey]);

  return (
  <>
    <Router>
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/">Umbrella Games</Link>
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
                    Login
                  </Link>
                </li>
                <li className="nav-item dropdown">
                  <Link className="nav-link" to="/cart">
                    Cart
                  </Link>
                </li>
              </ul>
              {/* <Search setData={setData} /> */}
            </div>
          </div>
        </nav>
      <main>
        <Routes>
        <Route exact path="/" element={<Home />} />
        <Route path='account' element={<Account/>}/>
        <Route path="game/:game_id" element={<Game/>}/>
        <Route path="cart" element={<Cart/>}/>
        <Route path="checkout" element={<Checkout/>}/>
        <Route path="about" element={<About/>}/>
        </Routes>


      </main>
    </Router>
  </>
  )
}

export default App
