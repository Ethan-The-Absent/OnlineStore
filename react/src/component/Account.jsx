import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Account = () => {
    const [user, setUser] = useState({
        username: "",
        passcode: ""
    });

    const navigate = useNavigate();
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = (e) => {
        if (user.passcode && user.username){
            console.log("Submitted user:", user);
            navigate("/");
        } else {
            alert("Please fill the Feilds")
        }
    };

    return (
        <div>
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
                <button type="submit" className="btn btn-primary">
                    Login
                </button>
            </form>
        </div>
    );
};

export default Account;
