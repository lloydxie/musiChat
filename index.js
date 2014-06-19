var express = require('express');
var app = express();
var port = 3700;
var async = require('async');

// include database functions
var database = require('./database.js');

// so you can find current username using the socket
var sockid_to_username = {}

//you need this to parse requests!!!!!
//app.use(express.json()); //this doesn't work!!!
//app.use(express.urlencoded()); //this doesn't work either!!!

// have to manually include body parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded());

// set the views directory to the tpl directory that we made
app.set('views', __dirname + '/tpl');

// set the jade engine
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

// set up server that renders the page when a request is made
app.get("/", function (req, res) {
    res.render("page");
});

// display the form to add new user
app.get("/newuser", function (req, res) {
    res.render('newuser', { title: 'Add new User' });
});

// handle the add user post request
app.post('/adduser', function (req, res) {
    // req.body instead of req.query in express 3.0
    var userName = req.body.username;
    // should be encrypted 
    var userPwd = req.body.password;

    if (userName == null || userPwd == null) {
        res.send("Username or password is empty");
    }

    //check if username is already taken
    database.get_user_count(userName, null, function (err, count) {
        if (err) {
            console.log("There was an error accessing the database!");
        } else if (count <= 0) {
            database.insert_user(userName, userPwd, function (err, doc) {
                if (err) 
                    res.send("There was a problem adding the information to the database");
                else {
                    res.location("/");
                    res.redirect("/");
                }
            });
        } else {
            res.send("There is already an account with this username");
        }
    });
});

// tell express to find where the public files needed for the html pages are
app.use(express.static(__dirname + '/public'));

// use socket integration
//app.listen(port); 
var io = require('socket.io').listen(app.listen(port));

console.log("Listening on port " + port);

// function to check if the client socket is in the room
function clientSocketInRoom(roomId, clientSocket) {
    var room = io.sockets.adapter.rooms[roomId];
    if (room) {
        for (var id in room) {
            //res.push(io.sockets.adapter.nsp.connected[id]);
            if (id === clientSocket.id) {
                return true;
            }
        }
    } else {
        return false;
    }
    return false;
}

// socket passed in function (socket) is the client's socket
io.sockets.on('connection', function (socket) {
        socket.emit('message', { message: 'Hello, please login to chat'});
        //if it receives a login request, check database for existing users
        socket.on('login', function (data) {
            var already_registered = false;
            for (var key in sockid_to_username) {
                // if the username that you want is already in a socket
                if (sockid_to_username[key] === data.username) {
                    already_registered = true;
                }
            }
            if (already_registered) {
                socket.emit('message', { message: 'You have already logged in' });
            } else {
                database.get_user_count(data.username, data.password, function (err, count) {
                    if (err) {
                        console.log("There was an error accessing the database!");
                    } else if (count > 0) {
                        socket.emit('message', { message: 'Welcome to the chat' });
                        socket.join('registered');
                        io.sockets.emit('message', { message: data.username + " has connected to the server" });
                        sockid_to_username[socket.id] = data.username;
                    } else {
                        database.get_user_count(data.username, null, function (err, count) {
                            if (count && count > 0) {
                                socket.emit('message', { message: 'Your username or password was incorrect' });
                            } else {
                                socket.emit('message', { message: "You haven't signed up yet" });
                            }
                        });
                    }
                });
            }
        });
        // when client sends data, emit data to other clients
        socket.on('send', function (data) {
            //if the socket is registered, send the message
            if (sockid_to_username[socket.id] != null) {
                //io.sockets.in('registered').emit('message', data);
                io.sockets.emit('message', data);
            } else {
                socket.emit('message', { message: 'You have to login before chatting' });
            }
        });

        socket.on('disconnect', function () {
            // emit disconnected message
            if (sockid_to_username[socket.id] != null) {
                var disconnected_uname = sockid_to_username[socket.id];
                io.sockets.emit('message', { message: sockid_to_username[socket.id] + " has disconnected from the server" });
                sockid_to_username[socket.id] = null;
            }
        });
});


