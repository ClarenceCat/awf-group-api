// File: project.js
// Description: This file contains all tests used to develop the API

// required modules
const chai = require('chai');
const chaiHttp = require('chai-http');

const server = require('../src/server');

const mongoose = require('mongoose');
const { response } = require('express');
const User = mongoose.model('User');
const Project = mongoose.model('Project');
const jwt = require('jsonwebtoken');

// set up declaration method
chai.should();

// set chai to use chaiHttp
chai.use(chaiHttp);

describe("Project API", () => {

    // constants to be used throughout the testing
    const login1 = { email: "test1@email.com", password: "123456", firstName: 'test', lastName: 'user' };
    const login2 = { email: "test1@emai2.com", password: "123456", firstName: 'doop', lastName: 'doop' };

    const task1 = { title: "test1", description: "This is a test" };
    const task2 = { title: "test2", description: "This is another test" };
    const task3 = { title: "test3", description: "I am, once again, conducting a test" };

    let testuser1 = null;
    let testuser2 = null;

    let test_user1_token = null;
    let test_user2_token = null;

    let project1 = null;
    let project2 = null;

    let created_project = null;

    // Before function
    // Called before each test is run
    beforeEach((async () => {
        // create dummy users 
        try{
            // try to create test user 1
            const tu1 =  new User({email: login1.email, password: login1.password, firstName: login1.firstName, lastName: login1.lastName});
            testuser1 = await tu1.save();

            // try to create test user 2
            const tu2 =  new User({email: login2.email, password: login2.password, firstName: login2.firstName, lastName: login2.lastName });
            testuser2 = await tu2.save();
        }
        catch(e){
            console.error("Failed to add test users");
            console.error(e);
            return;
        }

        // add the test user1 to the task 3 assignedTo
        task3['assignedTo'] = testuser1._id;

        // create a project for test user 1
        try{
            // create a project
            const proj1 = new Project({title: "Test Project 1", description: "This is a test project", members: [testuser1._id], tasks: [task1, task2]});
            project1 = await proj1.save();

            // create project 2 
            const proj2 = new Project({title: "Test Project 2", description: "This is another test project", members: [testuser1._id, testuser2._id], tasks: [task3]});
            project2 = await proj2.save();
        }
        catch(e)
        {
            console.error("error trying to insert projects");
            console.error(e);
        }

        // create jwt for test user 1
        test_user1_token = jwt.sign({ userId: testuser1._id }, process.env.JWT_SECRET);
        test_user2_token = jwt.sign({ userId: testuser2._id}, process.env.JWT_SECRET);

    }));

    // after function
    // This is called after each test is run
    afterEach((async () => {
        // remove each project where test user 1 is a member
        try{
            // delete all projects associated with test user 1
            await Project.deleteMany({members: testuser1._id})
        }
        catch(e){
            console.error("Could not remove test projects from database");
            console.error(e);
        }

        // delete the two test users
        try{
            // delete test user 1 from database
            await User.findByIdAndDelete(testuser1._id);
            // delete test user 2 from database
            await User.findByIdAndDelete(testuser2._id);
        }
        catch(e){
            console.error("Failed to remove the test users");
            console.error(e);
        }
    }))

    // ===========================================================

    // Test 1 
    // ROUTE: @GET /projects
    // Description: This test makes a request the /projects api route
    // Tests the Happy Path 
    // Expected Return: A list of projects
    describe('GET /projects', () => {

        it('Should retrieve a list of projects for the testuser1 user', (done) => {
            // make a request to the server
            chai.request(server).get("/projects").set("authorization", test_user1_token)
            .end((err, response) => {
                // check the response
                response.should.have.status(200);
                response.body.should.have.property("projects");
                if(response.body.projects){
                    response.body.projects.length.should.be.eq(2);
                    response.body.projects[0].should.have.property("id");
                    response.body.projects[0].should.have.property("title");
                    response.body.projects[0].should.have.property("description");
                }
                done();
            })
        })
    })

    // TEST 2
    // ROUTE: @POST /projects
    // Description: This test makes a request to create a new project
    // Tests happy path
    // Expected return: the newly created project details
    describe('POST /projects', () => {
        // declare the project you wish to create
        const new_project_details = { title: "Test 2", description: "Test creating a new Project" };

        it('Should return a newly created project', (done) => {
            // make a request to the server
            chai.request(server).post('/projects').set("authorization", test_user1_token).send(new_project_details)
            .end((err, response) => {
                // check the response
                response.should.have.status(201);
                response.body.should.have.property('project');
                if(response.body.project){
                    response.body.project.should.have.property('id');
                    response.body.project.should.have.property('title').eq("Test 2");
                    response.body.project.should.have.property('description').eq("Test creating a new Project");
                }
                done();
            })
        })
    })

    // TEST 3
    // ROUTE: @GET /projects/:id 
    // Description: This tests the api route that retrieves project details based on the project id
    // Tests Happy Path
    // Expected Return: The details of the specified project
    describe('GET /projects/:id', () => {
        it('Should retrieve the details of a specified project', (done) => {
            // make request to the api
            chai.request(server).get(`/projects/${project1._id}`).set("authorization", test_user1_token)
            .end((err, response)  => {
                // check the response
                response.should.have.status(200);
                response.body.should.have.property('project');
                if(response.body.project){
                    response.body.project.should.have.property('id').eq(project1._id.toString());
                    response.body.project.should.have.property('title').eq(project1.title.toString());
                    response.body.project.should.have.property('description').eq(project1.description.toString());
                    response.body.project.should.have.property('members');
                    if(response.body.project.members){
                        response.body.project.members.length.should.be.eq(1);
                    }
                    response.body.project.should.have.property('tasks');
                    if(response.body.project.tasks){
                        response.body.project.tasks.length.should.be.eq(2)
                    }
                }
                done();
            });
        })
    })


    // TEST 4
    // ROUTE: @PUT /projects/:id
    // Description: This tests the route that allows users to update project information
    // Tests Happy Path
    // Expected Return: The updated project info
    describe('PUT /projects/:id', () => {
        // specify the changes you would like to make
        const new_project_info = { title: "New Title", description: "This project has been updated" };
        it('Should update the project details and return the updated project info', (done) => {
            // make api call
            chai.request(server).put(`/projects/${project1._id}`).set("authorization", test_user1_token).send(new_project_info)
            .end((err, response) => {
                response.should.have.status(200);
                response.body.should.have.property('project');
                if(response.body.project){
                    response.body.project.should.have.property('id').eq(project1._id.toString());
                    response.body.project.should.have.property('title').eq('New Title');
                    response.body.project.should.have.property('description').eq('This project has been updated');
                }
                done();
            })
        })
    });


    // TEST 5 
    // ROUTE: @DELETE /projects/:id 
    // Description: This tests the route that allows users to delete projects
    // Tests Happy Path
    // Expected Return: An array of projects not containing the removed project
    describe('DELETE /projects/:id', () => {
        it('Should delete the specified project', (done) => {
            chai.request(server).delete(`/projects/${project1._id}`).set("authorization", test_user1_token)
            .end((err, response) => {
                response.should.have.status(200);
                response.body.should.have.property('projects');
                if(response.body.projects){
                    response.body.projects.length.should.be.eq(1);
                }
                done();
            })
        })
    });

    // TEST 6
    // ROUTE: @POST /projects/:id/tasks
    // Description: This tests the route that allows users to add a new task to a project
    // Tests Happy Path
    // Expected Return: The newly created task
    describe('POST /projects/:id/tasks', () => {
        // define new task
        const task_details = { title: "Task N", description: "Test inserting a task", due_date: "2021-04-21" }
        it("Should create a new task for the specified project", (done) => {
            // make api call
            chai.request(server).post(`/projects/${project1._id}/tasks`).set("authorization", test_user1_token).send(task_details)
            .end((err, response) => {
                response.should.have.status(201);
                response.body.should.have.property('task');
                if(response.body.task){
                    response.body.task.should.have.property("id");
                    response.body.task.should.have.property('title').eq('Task N');
                    response.body.task.should.have.property('description').eq('Test inserting a task');
                    response.body.task.should.have.property('due_date').eq("2021-04-21");
                    response.body.task.should.have.property('assigned_to');
                    if(response.body.task.assigned_to){
                        response.body.task.assigned_to.length.should.be.eq(0);
                    }

                    done();
                }
            })
        })

    })
    
    // TEST 7
    // ROUTE: @PUT /projects/:project_id/tasks/:task_id
    // Description: This tests the route that allows the user to update a task
    // Tests Happy Path
    // Expected Return: The newly updated task
    describe('PUT /projects/:project_id/tasks/:task_id', () => {
        // define new task
        const task_details = { title: "Updated Task", description: "Test update a task", due_date: "2021-04-25" }
        it("Should update a specific task for the specified project", (done) => {
            // make api call
            chai.request(server).put(`/projects/${project1._id}/tasks/${project1.tasks[0]._id}`).set("authorization", test_user1_token).send(task_details)
            .end((err, response) => {
                response.should.have.status(200);
                response.body.should.have.property('task');
                if(response.body.task){
                    response.body.task.should.have.property("id").eq(project1.tasks[0]._id.toString());
                    response.body.task.should.have.property('title').eq("Updated Task");
                    response.body.task.should.have.property('description').eq("Test update a task");
                    response.body.task.should.have.property('due_date').eq("2021-04-25");
                    response.body.task.should.have.property('assigned_to');
                    if(response.body.task.assigned_to){
                        response.body.task.assigned_to.length.should.be.eq(0);
                    }

                }
                done();
            })
        })
    })

    // TEST 8
    // ROUTE: @DELETE /projects/:project_id/tasks/:task_id
    // Description: Tests the route used to delete a task from a project
    // Tests Happy Path
    // Expected Return: The updated list of tasks after the deletion
    describe('DELETE /projects/:project_id/tasks/:task_id', () => {
        it("Should update a specific task for the specified project", (done) => {
            // make api call
            chai.request(server).delete(`/projects/${project1._id}/tasks/${project1.tasks[0]._id}`).set("authorization", test_user1_token)
            .end((err, response) => {
                response.should.have.status(200);
                response.body.should.have.property('tasks');
                if(response.body.tasks){
                    response.body.tasks.length.should.be.eq(1);
                    response.body.tasks[0].should.have.property('id').eq(project1.tasks[1]._id.toString());
                }
                done();
            })
        })
    })

    // TEST 9
    // ROUTE: @POST /projects/:id/members
    // Description: Tests the route responsible for adding a member to a project
    // Tests Happy Path
    // Expected Return: The name and email of the newly created member
    describe('POST /projects/:id/members', () => {
        // specify the email of the new member that is to be added
        const add_member = { email: login2.email };

        it("Should add a new member to the specified project", (done) => {
            chai.request(server).post(`/projects/${project1._id}/members`).set("authorization", test_user1_token).send(add_member)
            .end((err, response) => {
                response.should.have.status(200);
                response.body.should.have.property('member');
                if(response.body.member){
                    response.body.member.should.have.property('firstName');
                    response.body.member.should.have.property('lastName');
                    response.body.member.should.have.property('email');
                }
                done();
            })
        })
    })

    // TEST 10
    // ROUTE: @DELETE /projects/:id/members
    // Description: Tests the route responsible for removing a member from a project
    // Tests Happy Path
    // Expected Return: An array of members after the deletion
    describe('POST /projects/:id/members', () => {
        // specify the email of the new member that is to be added
        const rem_member = { email: login2.email };

        it("Should remove a member from the specified project", (done) => {
            chai.request(server).delete(`/projects/${project2._id}/members`).set("authorization", test_user1_token).send(rem_member)
            .end((err, response) => {
                response.should.have.status(200);
                response.body.should.have.property('members');
                if(response.body.members){
                    response.body.members.length.should.be.eq(1);
                }
                done();
            })
        })
    })
    
    // TEST 11
    // ROUTE: @GET /tasks
    // Description: Test route to retrieve all tasks assigned to a user
    // Tests happy path
    // Expected Return: list of tasks assigned to the user
    describe('GET /tasks', () => {
        it("Should retrieve a list of tasks assigned to the user", (done) => {
            chai.request(server).get('/tasks').set("authorization", test_user1_token)
            .end((err, response) => {
                response.should.have.status(200);
                response.body.should.have.property('tasks');
                if(response.body.tasks){
                    response.body.tasks.length.should.be.eq(1);
                    response.body.tasks[0].title.should.eq("test3");
                }
                done();
            })
        })
    });

    // TEST 12
    // ROUTE: @GET /projects/:project_id/tasks/:task_id/members
    // Description: Test route to assign a user to a task
    // Tests happy path
    // Expected Return: the updated task with the new assigned user list
    describe('POST /projects/:project_id/tasks/:task_id/assigned', () => {
        const send_email = { email: login2.email };
        it("Should assign a member to a task", (done) => {
            chai.request(server).post(`/projects/${project2._id}/tasks/${project2.tasks[0]._id}/assigned`).set("authorization", test_user1_token).send(send_email)
            .end((err, response) => {
                response.should.have.status(200);
                response.body.should.have.property('task');
                if(response.body.task){
                    response.body.task.assigned_to.length.should.eq(2);
                }
                done();
            })
        })
    });

    // TEST 13
    // ROUTE: @GET /projects/:project_id/tasks/:task_id/members
    // Description: Test route to assign a user to a task 
    // Tests Boundary Condition - the user is already assigned to the task
    // Expected Return: 400 status
    describe('POST /projects/:project_id/tasks/:task_id/assigned', () => {
        const send_email = { email: login1.email };
        it("Should not add user to the task - repeat user", (done) => {
            chai.request(server).post(`/projects/${project2._id}/tasks/${project2.tasks[0]._id}/assigned`).set("authorization", test_user1_token).send(send_email)
            .end((err, response) => {
                response.should.have.status(400);
                done();
            })
        })
    });

    // TEST 14
    // ROUTE: @GET /projects/:project_id/tasks/:task_id/members
    // Description: Test route to assign a user to a task 
    // Tests Boundary Condition - the user is already assigned to the task
    // Expected Return: 400 status
    describe('DELETE /projects/:project_id/tasks/:task_id/assigned', () => {
        const send_email = { email: login1.email };
        it("Should remove a member from a task", (done) => {
            chai.request(server).delete(`/projects/${project2._id}/tasks/${project2.tasks[0]._id}/assigned`).set("authorization", test_user1_token).send(send_email)
            .end((err, response) => {
                response.should.have.status(200);
                response.body.should.have.property('task');
                if(response.body.task){
                    response.body.task.assigned_to.length.should.eq(0);
                }
                done();
            })
        })
    });
    
})