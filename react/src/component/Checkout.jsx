import React, { useState } from "react";
import { Navigate } from "react-router-dom";

const Checkout = () => {
    const [formData, setFormData] = useState({
        streetAddress: "",
        city: "",
        state: "",
        zipCode: "",
        cardNumber: "",
        expirationDate: "",
        cvv: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if(formData.cardNumber && formData.city && formData.cvv &&
             formData.expirationDate && formData.state &&
              formData.streetAddress && formData.zipCode){
                // Handle form submission, e.g., send data to server
        console.log("Submitted data:", formData);
        }
        
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <h2>Address Information</h2>
                <div className="form-group">
                    <label htmlFor="streetAddress">Street Address</label>
                    <input
                        type="text"
                        className="form-control"
                        id="streetAddress"
                        name="streetAddress"
                        value={formData.streetAddress}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                        type="text"
                        className="form-control"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="state">State</label>
                    <input
                        type="text"
                        className="form-control"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="zipCode">Zip Code</label>
                    <input
                        type="text"
                        className="form-control"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                    />
                </div>

                <h2>Payment Information</h2>
                <div className="form-group">
                    <label htmlFor="cardNumber">Card Number</label>
                    <input
                        type="text"
                        className="form-control"
                        id="cardNumber"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="expirationDate">Expiration Date</label>
                    <input
                        type="text"
                        className="form-control"
                        id="expirationDate"
                        name="expirationDate"
                        placeholder="MM/YY"
                        value={formData.expirationDate}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="cvv">CVV</label>
                    <input
                        type="text"
                        className="form-control"
                        id="cvv"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit" className="btn btn-primary">
                    Submit
                </button>
            </form>
        </div>
    );
};

export default Checkout;
