import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

const Account = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    

    const [user, setUser] = useState({
        username: "",
        passcode: "",
        confirmPasscode: "" // Added for registration
    });

    const navigate = useNavigate();
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prevState => ({ ...prevState, [name]: value }));
        setError(null); // Clear any previous errors when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            if (isLogin) {
                // Login logic
                if (user.passcode && user.username) {
                    // Send login POST request
                    const response = await fetch(`${API}/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            username: user.username,
                            password: user.passcode
                        })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Login failed');
                    }
                    
                    const data = await response.json();
                    console.log("Login successful:", data);
                    navigate("/");
                } else {
                    setError("Please fill all fields");
                }
            } else {
                // Registration logic
                if (user.passcode && user.username) {
                    if (user.passcode === user.confirmPasscode) {
                        // Send registration POST request
                        const response = await fetch(`${API}/auth/register`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                username: user.username,
                                password: user.passcode
                            })
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || 'Registration failed');
                        }
                        
                        const data = await response.json();
                        console.log("Registration successful:", data);
                        setIsLogin(true);
                        setUser({
                            username: user.username,
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
        // Clear form when switching between login and register
        setUser({
            username: "",
            passcode: "",
            confirmPasscode: ""
        });
    };

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
                        value={user.username}
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
                        value={user.passcode}
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
                            value={user.confirmPasscode}
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
