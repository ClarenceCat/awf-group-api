// File: ProjectRoutes.js
// Description: This file contains the routes handling project related requests

const express = require ('express');
const mongoose = require('mongoose');
const requireAuth = require('../middleware/requireAuth');

const User = mongoose.model('User');
const Project = mongoose.model('Project');


const router = express.Router();

// @GET /projects
// middleware: requireAuth
// Description: This route is used to retrieve all projects associated with a user's account
// @req: none
// @res: {projects: [{id, title, description}]}
router.get('/', requireAuth, (req, res) => {

})

// @POST /projects
// middleware: requireAuth
// Description: Allows a user to create a project that will be associated with them
// @req: { title, description }
// @res: { project: { id, title, description } }
router.post('/', requireAuth, (req, res) => {

})


// @GET /projects/:id
// middleware: requireAuth
// Description: Retrieves information about a project
// @req: none
// @res: { project: {id, title, description, created, [members], [[tasks: {id, title, description, due_date, created, [assigned_to] }]]} }
router.get('/:id', requireAuth, (req, res) => {
    
})



module.exports = router;