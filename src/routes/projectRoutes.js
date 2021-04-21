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
router.get('/', requireAuth, async (req, res) => {
    // extract user from the request 
    const { user } = req;

    // empty list used to fill with project details to send back to the user
    let ret_projects = [];

    try{
        // attempt to find all projects where user is a member
        const projects = await Project.find({ members: user._id });

        // loop through the project list, and add the project details to the ret_projects list
        for(let project of projects){
            ret_projects.push({ id: project._id, title: project.title, description: project.description })
        }

        // respond with the list objects containing project details
        return res.status(200).send({ projects: ret_projects });
    }
    catch(e){
        console.error(e);
        return res.status(500).send({ error: "Error retrieving the Projects for the user" })
    }

})

// @POST /projects
// middleware: requireAuth
// Description: Allows a user to create a project that will be associated with them
// @req: { title, description }
// @res: { project: { id, title, description } }
router.post('/', requireAuth, async (req, res) => {
    // retrieve the user from the req (obtained through requireAuth middleware)
    const { user } = req;

    // retrieve the new project details from the request body
    const { title, description } = req.body;

    // check if the request body contains the required elements
    if(!title || !description){
        return res.status(400).send({error: "Missing credentials to create a project"});
    }

    // create a new project object
    const new_project = new Project({ title: title, description: description, members: [user._id] });

    try{
        // save the project to the database
        const saved_project = await new_project.save();

        // respond with the newly created project details
        return res.status(201).send({ project: { id: saved_project._id, title: saved_project.title, description: saved_project.description } })
    }
    catch(e){
        console.error(e);
        return res.status(500).send({error: "There was an error attempting to create a new project"})
    }
})


// @GET /projects/:id
// middleware: requireAuth
// Description: Retrieves information about a project
// @req: none
// @res: { project: {id, title, description, created, [members], [[tasks: {id, title, description, due_date, created, [assigned_to] }]]} }
router.get('/:id', requireAuth, async (req, res) => {

})



module.exports = router;