import React from "react";

const About = () => {

    return( <>
    
    <h1>Capstone: Online Store</h1>
    <div>Joe Vohnoutka, Thomas Knickerbocker, Ethan Cline-Cole</div>
    <h2>Overview</h2>
    <p>We created an online store. Our React app has a landing page with featured products, a search box, and a list of categories. When users input search text, they are presented with a list of matching products. Similarly, when users select a category, they get a list of products in that category. Selecting a product brings up detailed information about that product including an "Add to cart" button.</p>
    
    <h2>CART AND CHECKOUT FUNCTIONALITY</h2>
    <p>When users finish shopping, the checkout view shows them all products in their cart, an order total, and fields for payment and shipping information. When they checkout, their cart is cleared, and the order is saved to the database.</p>
    
    <h2>Application Architecture</h2>
    <ol>
        <li>MongoDB was used for backend data storage.</li>
        <li>Node.js was implemented to build a web service for reading and writing data.</li>
        <li>The web application was built using React.</li>
    </ol>
    
    <h2>Data Analysis Implementation</h2>
    <ol>
        <li>We created a script that generated and populated the database with over 1000 records of dummy data.</li>
        <li>We trained a model using sklearn.neighbors.NearestNeighbors algorithm to recommend products based on current purchases.</li>
        <li>We added attributes such as popularity, durability, and price to each product to make predictions more accurate.</li>
        <li>We developed a React component that takes a product as input and passes it to the model using a RESTful service. The returned recommended products are displayed to the user.</li>
    </ol>
    


    </>);
};

export default About