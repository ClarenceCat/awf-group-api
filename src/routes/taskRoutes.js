// File: ProjectRoutes.js
// Description: This file contains the routes handling project related requests

const express = require ('express');
const mongoose = require('mongoose');
const requireAuth = require('../middleware/requireAuth');

const User = mongoose.model('User');
const Project = mongoose.model('Project');


const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    // get the user id form req object
    const { user } = req;

    try{
        const tasks = await Project.aggregate([{
            $match: { 'tasks.assignedTo': user._id }
        }, {
            $unwind: '$tasks'
        }, {
            $match : { 'tasks.assignedTo': user._id }
        }, {
            $project : {
                title: '$tasks.title',
                description: '$tasks.description',
                assignedTo: '$tasks.assignedTo',
                dueDate: '$tasks.dueDate',
                created: '$tasks.created'
            }
        }])

        let ret_tasks = [];
        // loop through the retrieved tasks to generate the return tasks
        for(let task of tasks){
            let assigned = [];
            for(let user_id of task.assignedTo) {
                const user = await User.findById(user_id);
                assigned.push({name: `${user.firstName} ${user.lastName}`, email: user.email});
            }
            let insertTask = { id: task._id, title: task.title, description: task.description, assigned_to: assigned, created: new Date(task.created).toISOString().slice(0, 10) };

            // check if there is a due date
            if(task.dueDate){
                insertTask['due_date'] = task.dueDate;
            }
            else{
                insertTask['due_date'] = task.dueDate;
            }

            ret_tasks.push(insertTask);

        }
        return res.status(200).send({tasks: ret_tasks})
    }
    catch(e){
        console.error(e);
        return res.status(500).send({error: "Failed to retrieve Tasks"})
    }
})

module.exports = router;