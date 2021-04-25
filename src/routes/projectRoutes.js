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
            const member_found = await User.findById(member_id);

            // make sure the user exists
            if(member_found){
                // add the user's first and last name to the list of members that will be returned to the user
                members.push( { name: `${member_found.firstName} ${member_found.lastName}`, email: member_found.email} )
            }
        }

        let ret_tasks = []
        // process tasks to send 
        for(let task of project.tasks){
            // find make assigned to list
            let assigned = [];

            for(let u_id of task.assignedTo){
                // find user
                const user = await User.findById(u_id);

                if(user){
                    assigned.push({name: `${user.firstName} ${user.lastName}`, email: user.email});
                }
            }

            const add_task = {id: task._id, title: task.title, description: task.description, assigned_to: assigned, created: new Date(task.created).toISOString().slice(0, 10)};

            // check if the task has a due date
            if(task.dueDate){
                add_task['due_date'] = new Date(task.dueDate).toISOString().slice(0, 10);
            }
            else{
                add_task['due_date'] = '';
            }
            // add the task the list of return tasks
            ret_tasks.push(add_task);
        }

        // respond with the details of the project
        return res.status(200).send({
            project: {
                id: project._id,
                title: project.title,
                description: project.description,
                members: members,
                tasks: ret_tasks
            }
        });
    }
    catch(e)
    {
        console.error(e);
        return res.status(500).send({error: "error retrieving project details"})
    }
})

// @PUT /projects/:id
// middleware: requireAuth
// Description: This route allows a user to edit the details of a project - its title or description
// @req - { title, description }
// @res - { id, title, description }
router.put('/:id', requireAuth, async (req, res) => {
    // retrieve the user from the req object
    const { user } = req;

    // retrieve the project id from the params
    const { id } = req.params;

    // retrieve the updated values from the request
    const { title, description } = req.body;

    // make sure the user has submitted at least one thing to update
    if(!title && !description){
        return res.status(401).send({error: "Missing credentials"})
    }

    let update_fields = {};

    // check if the user wants to update the title field
    if(title){
        update_fields['title'] = title;
    }

    // check if the user wants to update the description property 
    if(description){
        update_fields['description'] = description;
    }

    try{
        // attempt to find a project and update it with the new fields
        const updated_project = await Project.findOneAndUpdate({_id: id, members: user._id}, update_fields, { new: true });

        if(!updated_project){
            return res.status(400).send({ error: "Could not find Project to update" });
        }

        // return specific project info to the user
        return res.status(200).send({ project: { id: updated_project._id, title: updated_project.title, description: updated_project.description } });
    }
    catch(e){
        console.error(`Failed to update the project with the id ${id}`);
        return res.status(500).send({error: "Could not update project"})
    }
})


// @DELETE /projects/:id
// middleware: requireAuth
// Description: This route is used to delete a project 
// @req - none
// @res - { projects: [{ id, title, description }]} - list of projects after the specified project has been removed
router.delete('/:id', requireAuth, async (req, res) => {
    // retrieve the user from the req
    const { user } = req;

    // retrieve the project id from the params
    const { id } = req.params;

    try{
        // attempt to delete the project with the specified id, containing the specified member
        const deleted = await Project.findOneAndDelete({ _id: id, members: user._id });

        // check if a project was found and deleted
        if(!deleted){
            return res.status(400).send({ error: "Could not find the project to delete" });
        }

        const updated_list = await Project.find({members: user._id});

        let ret_projects = [];
        // loop through the updated list and add the needed details to the 
        for(let project of updated_list){
            if(project){
                // add the project to the list of ret_projects
                ret_projects.push({ id: project._id, title: project.title, description: project.description });
            }
        }

        // respond with the info for the project that was deleted
        return res.status(200).send({ projects: ret_projects});
    }
    catch(e){
        console.error(`error deleting project with id ${id}`);
        console.error(e);
        return res.status(500).send({error: "Could not delete project"})
    }
})


// @POST /projects/:id/tasks
// middleware: requireAuth
// Description: adds a task to a project
// @req - { title, description, due_date }
// @res - { task: { id, title, description, due_date, assigned_to }}
router.post('/:id/tasks', requireAuth, async (req, res) => {
    // retrieve the user from the req
    const { user } = req;

    // retrieve the project id from the req params
    const { id } = req.params;

    // retrieve the details of the task that is to be added
    const { title, description, due_date } = req.body;

    // check if they submitted a title and description
    if(!title || !description){
        return res.status(400).send({ error: "Missing Credentials" });
    }

    const new_task = { title: title, description: description };

    // check if the user specified a due_date
    if(due_date){
        // add due date to the creation object
        new_task['dueDate'] = new Date(due_date);
    }

    try{
        // attempt to update the project and push the new task
        const insert_into_project = await Project.findOneAndUpdate({_id: id, members: user._id}, { $push: { tasks: new_task }}, {new: true});

        if(!insert_into_project) {
            return res.status(400).send({error: "Could not insert the new task"})
        }

        // set the inserted task to the most recently pushed task
        const inserted_task = insert_into_project.tasks[(insert_into_project.tasks.length - 1)];

        let assigned = [];
        // retrieve user info for assigned users
        for(let u_id of inserted_task.assignedTo){
            const user = await User.findById(u_id);

            if(user) {
                assigned.push({name: `${user.firstName} ${user.lastName}`, email: user.email});
            }
        }

        const ret_task = {
            id: inserted_task._id,
            title: inserted_task.title,
            description: inserted_task.description,
            assigned_to: assigned,
            created: new Date(inserted_task.created).toISOString().slice(0,10)
        };

        // if due date exists in task, then add it to return object
        if(inserted_task.dueDate){
            ret_task['due_date'] = new Date(inserted_task.dueDate).toISOString().slice(0,10);
        }
        else{
            ret_task['due_date'] = '';
        }

        return res.status(201).send({ task: ret_task })
    }
    catch(e){
        console.error(`Could not create task for project with id ${id}`);
        console.error(e);
        return res.status(500).send({error: "Could not insert new task"})
    }

})


// @PUT /projects/:project_id/tasks/:task_id
// middleware: requireAuth
// Description: This route allows a user to modify the title, description, or due date of a task
// @req - { title, description, due_date }
// @res - { task: { id, title, description, due_date, assigned_to }}
router.put('/:project_id/tasks/:task_id', requireAuth, async (req, res) => {
    // retrieve the user from the req
    const { user } = req;

    // retrieve the project id and task id from req params
    const { project_id, task_id } = req.params;

    // retrieve the values to update from the req
    const { title, description, due_date } = req.body;

    // make sure at least one of the values are present to update the task
    if(!title && !description && !due_date){
        return res.status(400).send({ error: "Must specify at least one value to update" });
    }

    const update_fields = {};

    // check if the user wishes to update the title
    if(title){
        update_fields['tasks.$.title'] = title;
    }

    // check if the user wishes to update the description
    if(description){
        update_fields['tasks.$.description'] = description;
    }

    // check if the user wishes to update the title
    if(due_date){
        update_fields['tasks.$.dueDate'] = new Date(due_date);
    }

    try{
        // attempt to update the task subdocument
        const update = await Project.findOneAndUpdate({_id: project_id, members: user._id, "tasks._id": task_id}, {"$set": update_fields }, { new: true });

        if(!update){
            return res.status(400).send({error: "could not update the specified task"});
        }

        const updated_task = update.tasks.id(task_id);

        let assigned = [];
        // retrieve user info for assigned users
        for(let u_id of updated_task.assignedTo){
            const user = await User.findById(u_id);

            if(user) {
                assigned.push({name: `${user.firstName} ${user.lastName}`, email: user.email});
            }
        }

        const ret_task = {
            id: updated_task._id,
            title: updated_task.title,
            description: updated_task.description,
            assigned_to: assigned,
            created: new Date(updated_task.created).toISOString().slice(0,10)
        };
        
        // if the updated task has a due date, add it to the return task
        if(updated_task.dueDate){
            ret_task['due_date'] = new Date(updated_task.dueDate).toISOString().slice(0, 10);
        }
        else{
            ret_task['due_date'] = '';
        }

        return res.status(200).send({ task: ret_task });
    }
    catch(e)
    {
        console.error(e);
        return res.status(500).send({error: "Could not update the specified task"})
    }

})


// @DELETE /projects/:project_id/tasks/:task_id
// middleware: requireAuth
// Description: This route allows a user to delete a task from the list of tasks in a project
// @req - None
// @res - { tasks: [{ id, title, description, due_date, assigned_to }]}
router.delete('/:project_id/tasks/:task_id', requireAuth, async (req, res) => {
    // retrieve user from req
    const { user } = req;

    // retrieve the project id and task id from the parameters
    const { project_id, task_id } = req.params;

    try{
        // attempt to remove the task from the project
        const updated = await Project.findOneAndUpdate({_id: project_id, members: user._id}, { $pull: { tasks: { _id: task_id } } }, { new: true });

        // process updated project doc and compile new list of tasks with the specified one removed
        let ret_tasks = [];
        
        for(let task of updated.tasks){

            let assigned = [];
            // retrieve user info for assigned users
            for(let u_id of task.assignedTo){
                const user = await User.findById(u_id);
    
                if(user) {
                    assigned.push({name: `${user.firstName} ${user.lastName}`, email: user.email});
                }
            }

            let add_task = { id: task._id, title: task.title, description: task.description, assigned_to: assigned, created: new Date(task.created).toISOString().slice(0,10) };

            // check if the task has a due date
            if(task.dueDate){
                // add due date to the add_task object
                add_task['due_date'] = new Date(task.dueDate).toISOString().slice(0,10);
            }
            else{
                add_task['due_date'] = '';
            }

            // add task to the return task list
            ret_tasks.push(add_task);
        }

        return res.status(200).send({ tasks: ret_tasks });

    }
    catch(e){
        console.error(e);
        return res.status(500).send({ error: "Failed to delete the specified post" })
    }
})


// @POST /projects/:project_id/tasks/:task_id/assigned
// middleware: requireAuth
// Description: allows a user to assign a member to a task
// @req - { email }
// @res - { task: { project_id, id, title, description, assigned_to, created, due_date } }
router.post('/:project_id/tasks/:task_id/assigned', requireAuth, async (req, res) => {

    // retrieve user from req
    const { user } = req;

    // retrieve the project and task id from the params
    const { project_id, task_id } = req.params;

    // extract email from req body
    const { email } = req.body;

    try{
        // find user by email
        const assigned_user = await User.findOne({email: email});

        // make sure user exists
        if(!assigned_user){
            return res.status(400).send({ error: `User with email ${email} does not exist` });
        }

        // find the project to make sure that the user is not already assigned to the task
        const alreadyExists = await Project.findOne({ tasks: { "$elemMatch": {"assignedTo": assigned_user._id} } });

        // check if user already exists
        if(alreadyExists){
            return res.status(400).send({error: `${assigned_user.firstName} ${assigned_user.lastName} is already assigned to this task`});
        }

        // attempt to update a task
        const updated_project = await Project.findOneAndUpdate({ _id: project_id, members: assigned_user._id, "tasks._id": task_id,  },
         {$addToSet: {"tasks.$.assignedTo": assigned_user._id}}, {new: true}
        );
        
        if(!updated_project){
            return res.status(400).send({error: "User is not a member of the project or is already assigned to the Task"});
        }

        const updated_task = updated_project.tasks.id(task_id);

        // build the response
        let ret_assigned = [];
        for(let member of updated_task.assignedTo){
            // find the user by the id
            const found_user = await User.findById(member);

            if(found_user){
                ret_assigned.push({name: `${found_user.firstName} ${found_user.lastName}`, email: found_user.email})
            }
        }

        const ret_task = { project_id: updated_project._id , id: updated_task._id, title: updated_task.title, description: updated_task.description, assigned_to: ret_assigned, created: new Date(updated_task.created).toISOString().slice(0,10)};
        
        if(ret_task.dueDate){
            // add due date to the add_task object
            ret_task['due_date'] = new Date(updated_task.dueDate).toISOString().slice(0,10);
        }
        else{
            ret_task['due_date'] = '';
        }

        // return the updated task
        return res.status(200).send({task: ret_task});

    }
    catch(e){
        return res.status(500).send({error: "There was an error assigning a user to this task"});
    }
})


// @DELETE /projects/:project_id/tasks/:task_id/assigned
// middleware: requireAuth
// Description: allows a user to remove a member from a task
// @req - { email }
// @res - { task: { project_id, id, title, description, assigned_to, created, due_date } }
router.delete('/:project_id/tasks/:task_id/assigned', requireAuth, async (req, res) => {

    // retrieve user from req
    const { user } = req;

    // retrieve the project and task id from the params
    const { project_id, task_id } = req.params;

    // extract email from req body
    const { email } = req.body;

    try{
        // find user by email
        const assigned_user = await User.findOne({email: email});

        // make sure user exists
        if(!assigned_user){
            return res.status(400).send({ error: `User with email ${email} does not exist` });
        }

        // find the project to make sure that the user is not already assigned to the task
        const alreadyExists = await Project.findOne({ members: user._id, tasks: { "$elemMatch": {"assignedTo": assigned_user._id} } });

        // check if user already exists
        if(!alreadyExists){
            return res.status(400).send({error: `${assigned_user.firstName} ${assigned_user.lastName} is not assigned to this task`});
        }

        // attempt to update a task
        const updated_project = await Project.findOneAndUpdate({ _id: project_id, members: assigned_user._id, "tasks._id": task_id,  },
         {$pull: {"tasks.$.assignedTo": assigned_user._id}}, {new: true}
        );

        
        if(!updated_project){
            return res.status(400).send({error: "User is not a member of the project or is already assigned to the Task"});
        }

        const updated_task = updated_project.tasks.id(task_id);

        // build the response
        let ret_assigned = [];
        for(let member of updated_task.assignedTo){
            // find the user by the id
            const found_user = await User.findById(member);

            if(found_user){
                ret_assigned.push({name: `${found_user.firstName} ${found_user.lastName}`, email: found_user.email})
            }
        }

        const ret_task = { project_id: updated_project._id , id: updated_task._id, title: updated_task.title, description: updated_task.description, assigned_to: ret_assigned, created: new Date(updated_task.created).toISOString().slice(0,10)};
        
        if(ret_task.dueDate){
            // add due date to the add_task object
            ret_task['due_date'] = new Date(updated_task.dueDate).toISOString().slice(0,10);
        }
        else{
            ret_task['due_date'] = '';
        }

        // return the updated task
        return res.status(200).send({task: ret_task});

    }
    catch(e){
        return res.status(500).send({error: "There was an error assigning a user to this task"});
    }
})


// @POST /projects/:id/members
// middleware: requireAuth
// Description: allows a user to add a member to a project
// @req - { email }
// @res - { member, email } - returns the name of the new member
router.post('/:id/members', requireAuth, async (req, res) => {
    // retrieve the user from the req
    const { user } = req;

    // retrieve the project id from req props
    const { id } = req.params;

    // retrieve the email of the user that is to be added
    const { email } = req.body;

    try{
        // attempt to find a user with the specified email
        const new_member = await User.findOne({ email: email });

        // make sure the user exists
        if(!new_member){
            return res.status(400).send({ error: "A user with the email you have specified does not exist" });
        }


        // check if the user is alread a member
        const check_member = await Project.findOne({_id: id, members: new_member._id});

        // check if the user is already a member
        if(check_member){
            return res.status(400).send({ error: `A person with the email ${email} is already a member of this project` });
        }

        const update =  await Project.findOneAndUpdate({_id: id, members: user._id}, { $push: { members: new_member._id }}, {new: true});

        // make sure the project updated with the new member
        if(!update) {
            return res.status(400).send({ error: `Failed to add user with email ${email} to the group` });
        }

        return res.status(200).send({member: {name: `${new_member.firstName} ${new_member.lastName}`, email: new_member.email}});

    }
    catch(e){
        console.error(e);
        return res.status(500).send({ error: "Could not add a new member to the project" });
    }
})


// @DELETE /projects/:id/members 
// middleware: requireAuth
// Description: This route allows a user to remove another user from the list of members
// @req - { email }
// @res - { [members] }
router.delete('/:id/members', requireAuth, async (req, res) => {
    // get user from the req
    const { user } = req;

    // get the property id from the params
    const { id } = req.params;

    // retrieve the email of the member whomst is to be removed
    const { email } = req.body;

    try{
        // find user to remove by email
        const rem_user = await User.findOne({ email: email });

        // make sure submitting  user is actually a member in the project
        const find_proj = await Project.findOne({ _id: id, members: user._id });

        if(!find_proj){
            return res.status(401).send({error: "You do not have access to this project"});
        }

        // remove the member from the project
        const updated = await Project.findOneAndUpdate({_id: id, members: rem_user._id}, { $pull: { members: rem_user._id  } }, { new: true });

        if(!updated){
            return res.status(400).send({error: `No user with the email ${email} can be removed from the project`});
        }

        // create a return array of members
        let ret_members = [];
        for(let member_id of updated.members){
            // find user
            const found_user = await User.findById(member_id);

            if(found_user){
                // add the found user to the list of members to be returned
                ret_members.push({name: `${found_user.firstName} ${found_user.lastName}`, email: found_user.email});
            }
        }

        return res.status(200).send({members: ret_members});
    }
    catch(e){
        console.error(e);
        return res.status(500).send({error: "Failed to remove member"})
    }
})


module.exports = router;