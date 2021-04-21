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

    let project1 = null;
    let project2 = null;

    // Before function
    // Called before the tests are run
    before((async () => {
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

    }));

    // after function
    // This is called after all of the tests have completed running
    after((async () => {
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
})