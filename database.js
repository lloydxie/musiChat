//Database setup
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/mydb');
var database = {};

// gets number of users with the username/password in the database
database.get_user_count = function(username, encrypted_password, callback) {
    var collection = db.get('users');
    // TODO: unencrypt password
    var password = encrypted_password;
    if (password) {
        collection.find({
                "username": username,
                "password": password
        }, function (err, docs) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, docs.length);
            }
        });
    } else {
        collection.find({
                "username": username
        }, function (err, docs) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, docs.length);
            }
        });
    }
}

// inserts user in database
database.insert_user = function (username, encrypted_password, callback) {
    var collection = db.get('users');
    // TODO: unencrypt password
    var password = encrypted_password;
    collection.insert({
            "username": username,
            "password": password
    }, function (err, doc) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, doc);
        }
    });
}

module.exports = database;
