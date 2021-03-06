// File: server.js
// Description: This is the main launching point for the express server

// initialize dotenv
require('dotenv').config();

// require the models 
require('./models/User');
require('./models/Project');

// require dependencies 
const express = require('express');
const mongoose = require('mongoose');

// require routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

// require cors
const cors = require('cors');

const app = express();

// use cors and exporess json
app.use(cors());
app.use(express.json());

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

// set routes to be used
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);

// set up mongo database
const mongoURI = process.env.DB_CON_STR;
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true 
});

mongoose.connection.on('connected', () => {
    console.log("Connected to MongoDB instance");
})

mongoose.connection.on('error', (err) => {
    console.error(err);
})

mongoose.set('useFindAndModify', false);


// test route
app.get('/', (req, res) => {
    return res.status(200).send("Test route");
})

// set port
const port = process.env.PORT || 5000;

module.exports = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})