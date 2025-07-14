import React, { useState } from "react";
import { Navigate } from "react-router-dom";

const Checkout = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        country: "",
        streetAddress: "",
        city: "",
        state: "",
        zipCode: "",
        cardNumber: "",
        cardExpMonth: "",
        cardExpYear: "",
        cardCvv: "",
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
        if (error) setError("");
    };


    React.useEffect(() => {},[error])

    const handleSubmit = (e) => {
        e.preventDefault();
        if(
            formData.fullName && formData.country && formData.streetAddress && formData.city && formData.state && formData.zipCode &&
            formData.cardNumber && formData.cardExpMonth && formData.cardExpYear && formData.cardCvv
        ){
            // Get access token from refresh
            (async () => {
                let accessToken = null;
                try {
                    const refreshRes = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        credentials: 'include',
                    });
                    if (!refreshRes.ok) throw new Error('Failed to refresh token');
                    const refreshData = await refreshRes.json();
                    accessToken = refreshData.accessToken;
                } catch (err) {
                    alert('Error refreshing token');
                    return;
                }

                // Get user id from /api/auth/me
                let userId = null;
                try {
                    const userRes = await fetch('/api/auth/me', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    if (!userRes.ok) throw new Error('Failed to fetch user');
                    const userData = await userRes.json();
                    userId = userData._id;
                } catch (err) {
                    alert('Error fetching user');
                    return;
                }

                // POST shipping info to /api/users/:userid/cart
                const payload = {
                    shippingInfo: {
                        fullName: formData.fullName,
                        country: formData.country,
                        state: formData.state,
                        zip: formData.zipCode,
                        streetAddress: formData.streetAddress,
                        city: formData.city
                    },
                    cardInfo: {
                        cardName: formData.fullName,
                        cardNumber: formData.cardNumber,
                        cardExp: formData.cardExpMonth.toString() + "/" + formData.cardExpYear.toString(),
                        cardCvv: formData.cardCvv,
                        cardZip: formData.zipCode
                    }
                };
                try {
                    const response = await fetch(`/api/users/${userId}/cart`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify(payload)
                    });
                    if (!response.ok) {
                        let errorMsg = 'Error submitting order';
                        try {
                            const errorData = await response.json();
                            if (errorData && errorData.message) {
                                errorMsg = errorData.message;
                            }
                        } catch (jsonErr) {
                            // ignore JSON parse error, use default message
                        }
                        setError(errorMsg);
                        return;
                    }
                    alert('Order submitted successfully!');
                    // Redirect to home or order confirmation page
                    window.location.href = "/";
                } catch (err) {
                    setError('Error submitting order');
                }
            })();
        }  else {
            setError("Please fill all fields");
        }
    };

    return (
        <div>
            
            <form onSubmit={handleSubmit}>
                <h2>Payment Information</h2>
                <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input type="text" className="form-control" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="cardNumber">Card Number</label>
                    <input type="text" className="form-control" id="cardNumber" name="cardNumber" value={formData.cardNumber} onChange={handleChange} />
                </div>
                <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Expiration Date</label>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                            <input type="text" className="form-control" id="cardExpMonth" name="cardExpMonth" placeholder="MM" maxLength={2} value={formData.cardExpMonth} onChange={handleChange} style={{ width: '60px', textAlign: 'center' }} />
                            <span>/</span>
                            <input type="text" className="form-control" id="cardExpYear" name="cardExpYear" placeholder="YY" maxLength={2} value={formData.cardExpYear} onChange={handleChange} style={{ width: '60px', textAlign: 'center' }} />
                        </div>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="cardCvv">CVV</label>
                        <input type="text" className="form-control" id="cardCvv" name="cardCvv" value={formData.cardCvv} onChange={handleChange} />
                    </div>
                </div>
                <hr />
                <h4>Address</h4>
                <div className="row">
                    <div className="col-md-6">
                        <div className="form-group">
                            <label htmlFor="country">Country</label>
                            <input type="text" className="form-control" id="country" name="country" value={formData.country} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="streetAddress">Street Address</label>
                            <input type="text" className="form-control" id="streetAddress" name="streetAddress" value={formData.streetAddress} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="form-group">
                            <label htmlFor="city">City</label>
                            <input type="text" className="form-control" id="city" name="city" value={formData.city} onChange={handleChange} />
                        </div>
                        <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label htmlFor="state">State</label>
                                <input type="text" className="form-control" id="state" name="state" value={formData.state} onChange={handleChange} />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label htmlFor="zipCode">Zip Code</label>
                                <input type="text" className="form-control" id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                </div>
                {error && (
                <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
                    {error}
                </div>
            )}
                {!error && (
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '20px' }}>
                        Submit
                    </button>
                )}
            </form>
        </div>
    );
};

export default Checkout;
