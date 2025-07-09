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
import GameTile from './component/GameTile';

import Game from './component/Game';



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
            <a className="navbar-brand" href="/">Umbrella Games</a>
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
                  <Link className="nav-link" to="/login">
                    Login
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
        </Routes>


      </main>
    </Router>
  </>
  )
}

export default App
