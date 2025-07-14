import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const API = '/api/auth/';

const Account = (props) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formUser, setFormUser] = useState({
        username: "",
        passcode: "",
        confirmPasscode: ""
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormUser(prevState => ({ ...prevState, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isLogin) {
                if (formUser.passcode && formUser.username) {
                    const response = await fetch(`${API}login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            username: formUser.username,
                            password: formUser.passcode
                        })
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Login failed');
                    }
                    const data = await response.json();
                    console.log("Login successful:", data);
                    window.location.reload();
                } else {
                    setError("Please fill all fields");
                }
            } else {
                if (formUser.passcode && formUser.username) {
                    if (formUser.passcode === formUser.confirmPasscode) {
                        const response = await fetch(`${API}register`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                username: formUser.username,
                                password: formUser.passcode
                            })
                        });
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || 'Registration failed');
                        }
                        const data = await response.json();
                        console.log("Registration successful:", data);
                        setIsLogin(true);
                        setFormUser({
                            username: formUser.username,
                            passcode: "",
                            confirmPasscode: ""
                        });
                    } else {
                        setError("Passcodes do not match");
                    }
                } else {
                    setError("Please fill all fields");
                }
            }
        } catch (err) {
            console.error("Error:", err);
            setError(err.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const toggleForm = () => {
        setIsLogin(!isLogin);
        setFormUser({
            username: "",
            passcode: "",
            confirmPasscode: ""
        });
    };

    // Logout handler
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            window.location.reload();
        } catch (err) {
            setError('Logout failed');
        }
    };

    // Get Purcheses if Logged In
    const [gameIds, setGameIds] = React.useState([]);
    const [games, setGames] = React.useState([]);
    
        React.useEffect(() => {
            if (props.user && Array.isArray(props.user.purchases)) {
                setGameIds(props.user.purchases);
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


    // If user is present in props, show user info and buttons
    if (props.user && props.user.username) {
        return (
            <div className="text-center mt-5">
                <h2>Welcome, {props.user.username}!</h2>
                <div className="mt-4">
                    <button className="btn btn-success me-2" onClick={() => navigate('/cart')}>Go to Cart</button>
                    <button className="btn btn-danger" onClick={handleLogout}>Log Out</button>
                    { games.length > 0 ? <div>
                        <h4 className="mt-3">Your Games:</h4>
                        <div style={{justifySelf:'center', textDecoration:'none'}}>
                        { games.map((game) => (
                            <Link key={game._id} to={`/game/${game._id}`}>
                                <div className="card">{game.name}</div>
                            </Link>))}
                        </div>
                    </div> : <div>No Purchaced Games</div>}
                </div>
            </div>
        );
    }

    // Otherwise, show login/register form
    return (
        <div>
            <h2>{isLogin ? "Login" : "Register"}</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        className="form-control"
                        id="username"
                        name="username"
                        value={formUser.username}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="passcode">Passcode</label>
                    <input
                        type="password"
                        className="form-control"
                        id="passcode"
                        name="passcode"
                        value={formUser.passcode}
                        onChange={handleChange}
                    />
                </div>
                <hr></hr>
                {!isLogin && (
                    <div className="form-group">
                        <label htmlFor="confirmPasscode">Confirm Passcode</label>
                        <input
                            type="password"
                            className="form-control"
                            id="confirmPasscode"
                            name="confirmPasscode"
                            value={formUser.confirmPasscode}
                            onChange={handleChange}
                        />
                    </div>
                )}
                <button type="submit" className="btn btn-primary">
                    {isLogin ? "Login" : "Register"}
                </button>
            </form>
            <div className="mt-3">
                <p>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        type="button" 
                        className="btn btn-link p-0" 
                        onClick={toggleForm}
                    >
                        {isLogin ? "Register here" : "Login here"}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Account;
