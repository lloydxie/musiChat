$(document).ready(function () {
    $("#field").keyup(function (e) {
        if (e.keyCode === 13) {
            sendMessage();
        }
    });
});

window.onload = function () {
    var messageList = [];
    var userList = [];
    var socket = io.connect('http://localhost:3700');
    var field = document.getElementById("field");
    var sendButton = document.getElementById("send");
    var username = document.getElementById("username");
    var password = document.getElementById("password");
    var loginButton = document.getElementById("login");
    var content = document.getElementById('content');
    var content_users = document.getElementById('userlist');
    var name = document.getElementById('name');
    var loggedin = false;

    // grab list of active users when first loading
    socket.emit('list');

    function reload_message_list() {
        //generate the html for all of the messages in the list
        var html = '';
        for (var i = 0; i < messageList.length; i++) {
            html += '<b>' + (messageList[i].username ? messageList[i].username : 'Server') + ': </b>';
            html += messageList[i].message + '<br />';
        }
        //set the list's HTML to show all of the messages
        content.innerHTML = html;
    }

    function reload_user_list() {
        var html = '';
        for (var i = 0; i < userList.length; i++) {
            html += userList[i] + '<br />';
        }
        content_users.innerHTML = html;
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
        var text = field.value;
        // when user clicks the button send the value in the text field to the socket
        socket.emit('send', { message: text, username: username.value });
        field.value = "";
    };

    loginButton.onclick = function () {
        var usernameText = username.value;
        var passwordText = password.value;
        socket.emit('login', { username: usernameText, password: passwordText });
        password.value = "";
    }
}

