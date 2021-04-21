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
    // retrieve the user object from the req
    const { user } = req;

    // retrieve the id param from the request params
    const { id } = req.params;

    try{
        // attempt to find a project with the specified id where the user is a member
        const project = await Project.findOne({_id: id, members: user._id});

        // check if a project with the specified member and id exists
        if(!project) {
            return res.status(401).send({error: `You are not a member of any projects with the id ${id}`})
        }

        // process members list
        let members = [];
        
        // loop through the members and search for the corresponding user to add to member list
        for(let member_id of project.members){
            // attempt to find the user with the id 
            const member_found = User.findById(member_id);

            // make sure the user exists
            if(member_found){
                // add the user's first and last name to the list of members that will be returned to the user
                members.push( `${member_found.firstName} ${member_found.lastName}` )
            }
        }

        // respond with the details of the project
        return res.status(200).send({
            project: {
                id: project._id,
                title: project.title,
                description: project.description,
                members: members,
                tasks: project.tasks
            }
        });
    }
    catch(e)
    {
        console.error(e);
        return res.status(500).send({error: "error retrieving project details"})
    }
})



module.exports = router;