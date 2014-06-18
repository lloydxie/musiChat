$(document).ready(function () {
    $("#field").keyup(function (e) {
        if (e.keyCode === 13) {
            sendMessage();
        }
    });
});

window.onload = function () {
    var messageList = [];
    var socket = io.connect('http://localhost:3700');
    var field = document.getElementById("field");
    var sendButton = document.getElementById("send");
    var username = document.getElementById("username");
    var password = document.getElementById("password");
    var loginButton = document.getElementById("login");
    var content = document.getElementById('content');
    var name = document.getElementById('name');
    var loggedin = false;

    // if a socket receives a message
    socket.on ('message', function (data) {
        if (data.message) {
            // add the message to the list
            messageList.push(data);

            //generate the html for all of the messages in the list
            var html = '';
            for (var i = 0; i < messageList.length; i++) {
                html += '<b>' + (messageList[i].username ? messageList[i].username : 'Server') + ': </b>';
                html += messageList[i].message + '<br />';
            }

            //set the list's HTML to show all of the messages
            content.innerHTML = html;
        } else {
            console.log("There is a problem: ", data);
        }
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

