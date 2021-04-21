// File: ProjectRoutes.js
// Description: This file contains the routes handling project related requests

const express = require ('express');
const mongoose = require('mongoose');

const User = mongoose.model('User');
const Project = mongoose.model('Project');

const router = express.Router();


module.exports = router;