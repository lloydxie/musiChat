$(document).ready(function () {
    $("#chatField").keyup(function (e) {
        if (e.keyCode === 13) {
            sendMessage();
        }
    });
});

window.onload = function () {
    var messageList = [];
    var userList = [];
    var my_username = null;
    var socket = io.connect('http://localhost:3700');

    // login controls
    var loginUsername = document.getElementById('loginUsername');
    var loginPassword = document.getElementById('loginPassword');
    var loginButton = document.getElementById('loginButton');
    var loggedin = document.getElementById('loggedin');

    // signup controls
    var signupUsername = document.getElementById('signupUsername');
    var signupPassword = document.getElementById('signupPassword');
    var signupPasswordReenter = document.getElementById('signupPasswordReenter');
    var signupButton = document.getElementById('signupButton');
    var warningMessage = document.getElementById('warningMessage');
    warningMessage.innerHTML = "";

    // chat controls
    var chatbox = document.getElementById('chatbox');
    var user_list = document.getElementById('userList');
    var chatField = document.getElementById('chatField');
    var sendButton = document.getElementById('sendButton');

    // dialog boxes
    var modalLogin = document.getElementById('modalLogin');
    var modalSignup = document.getElementById('modalSignup');

    // grab list of active users when first loading
    socket.emit('list');

    function getLabelText(str, my_str) {
        if (my_str == null) {
            return "default";
        } else if (str === my_str) {
            return "success";
        } else {
            return "primary";
        }
    }

    function reload_message_list() {
        //generate the html for all of the messages in the list
        var html = '';
        for (var i = messageList.length - 1; i >= 0; i--) {
            if (messageList[i].receiver) {
                // private message
                var username_test = messageList[i].username === my_username;
                var receiver_test = messageList[i].receiver === my_username;
                var username_label_text = getLabelText(messageList[i].username, my_username);
                var receiver_label_text = getLabelText(messageList[i].receiver, my_username);
                html += '<div class="alert alert-dismissable alert-info">';
                html += '<button type="button" class="close" data-dismiss="alert">x</button>';
                html += '<span class="label label-' + username_label_text + '">' + (username_test ? "You" : messageList[i].username) + '</span> ';
                html += '<span class="label label-' + receiver_label_text + '">' + (receiver_test ? "You" : messageList[i].username)  + '</span> '; 
                html += messageList[i].message;
                html += '</div>';
            } else if (messageList[i].username) {
                // public message
                var username_test = (messageList[i].username === my_username);
                var label_text = getLabelText(messageList[i].username, my_username);
                html += '<div class="alert alert-dismissable alert-success">';
                html += '<button type="button" class="close" data-dismiss="alert">x</button>';
                html += '<span class="label label-' + label_text + '">' + (username_test ? "You" : messageList[i].username) + '</span> ';
                html += messageList[i].message;
                html += '</div>';
            } else {
                // server message
                html += '<div class="alert alert-dismissable alert-warning">';
                html += '<button type="button" class="close" data-dismiss="alert">x</button>';
                html += '<span class="label label-default">' + "Server" + '</span> ';
                html += messageList[i].message;
                html += '</div>';
            }
        }
        //set the list's HTML to show all of the messages
        chatbox.innerHTML = html;
    }

    function reload_user_list() {
        var html = '';
        for (var i = 0; i < userList.length; i++) {
            if (userList[i] === my_username) {
                //html += '<a href="#" class="list-group-item user_list" data-toggle="tooltip" data-placement="right" title="" data-original-title="You">' +
                    //userList[i] + '</a>';
            } else {
                html += '<a href="#" class="list-group-item user_list">' + userList[i] + '</a>';
            }
        }
        if (my_username)
            loggedin.innerHTML = "Logged in as " + my_username;
        user_list.innerHTML = html;

        var elements = document.getElementsByClassName('user_list');
        for (var i = 0; i < elements.length; i++) {
            elements[i].onclick = function () {
                if (this.innerHTML !== my_username) {
                    this.classList.toggle('active');
                }
            }
        }
    }

    // if a socket receives a message
    socket.on ('message', function (data) {
        if (data.message) {
            // add the message to the list
            messageList.push(data);
            reload_message_list();
        } else {
            console.log("There is a problem: ", data);
        }
    });

    socket.on ('userlogin', function (data) {
        socket.emit('list');
        var messageData = {};
        messageData.message = data.username + " has connected to the server";
        messageList.push(messageData);
        reload_message_list();
    });

    socket.on('userlogout', function (data) {
        socket.emit('list');
        var messageData = {};
        messageData.message = data.username + " has disconnected from the server";
        messageList.push(messageData);
        reload_message_list();
    });

    socket.on('list', function (data) {
        // clear user list
        while (userList.length > 0) {
            userList.pop();
        }
        // push load usernames in list into user list
        for (var index = 0; index < data.list.length; index++) {
            userList.push(data.list[index]);
        }
        reload_user_list();
    });

    sendButton.onclick = sendMessage = function () {
        var text = chatField.value;
        var elements = document.getElementsByClassName('user_list');
        var privateSent = false;
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].classList.contains('active')) {
                console.log(elements[i].innerHTML);
                socket.emit('send-private', { message: text, username: my_username, receiver: elements[i].innerHTML });
                privateSent = true;
            }
        }
        if (!privateSent) {
            socket.emit('send', { message: text, username: my_username });
        }
        chatField.value = "";
    };

    loginButton.onclick = function () {
        var usernameText = loginUsername.value;
        var passwordText = loginPassword.value;
        socket.emit('login', { username: usernameText, password: passwordText });
        my_username = usernameText;
        loginUsername.value = "";
        loginPassword.value = "";
    }

    signupButton.onclick = function () {
        var usernameText = signupUsername.value;
        var passwordText = signupPassword.value;
        var reenterPassword = signupPasswordReenter.value;
        if (usernameText === "") {
            warningMessage.innerHTML = "Please enter a username";
        } else if (passwordText === reenterPassword) {
            socket.emit('signup', { username: usernameText, password: passwordText });
            socket.on('signup-response', function (data) {
                if (data.response === "OK") {
                    socket.emit('login', { username: usernameText, password: passwordText });
                    $('#modalSignup').modal('hide');
                } else {
                    warningMessage.innerHTML = data.response;
                }
            });
        } else {
            warningMessage.innerHTML = "The two password fields are not the same";
        }
        signupUsername.value = "";
        signupPassword.value = "";
        signupPasswordReenter.value = "";
    };

}

