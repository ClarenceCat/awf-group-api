// File: server.js
// Description: This is the main launching point for the express server

// initialize dotenv
require('dotenv').config();

// require the models 

// require dependencies 
const express = require('express');


// require cors
const cors = require('cors');

const app = express();

// use cors and exporess json
app.use(cors);
app.use(express.json());

// set routes to be used

// set up cors policy
app.use((req, res, next) => {
    // allow requests from all origins
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');

    if(req.method === 'OPTION'){
        req.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
})

// test route
app.get('/', (req, res) => {
    return res.send("Test route");
})

// set port
const port = process.env.PORT || 5000;

module.exports = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})