// File: Task.js
// Description: Task model 
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    dueDate: {
        type: Date
    },
    created: {
        type: Date,
        required: true,
        default: Date.now
    },
    assignedTo: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
})

module.exports = mongoose.model('Task', taskSchema);