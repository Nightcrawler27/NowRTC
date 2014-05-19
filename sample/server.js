var connect = require("connect");
var http = require("http");
var urlrouter = require('urlrouter');
var io = require('socket.io');
var Q = require('q');
var listeners = {};
var chatRequests = {};

console.log(__dirname);

var app = connect(urlrouter(function (app) {
    app.get('/', function (req, res, next) {
        res.end('hello urlrouter');
    });
}));

app.use(connect.logger('dev'));
app.use(connect.static(__dirname + '/..'));

var server = http.createServer(app);
var ioListener = io.listen(server);
ioListener.set('log level', 3);
server.listen(3000);

ioListener.on('connection', function (socket) {
    socket.on('listen', function(data) {
        var userID = data.userID;
        listeners[userID] = listeners[userID] || [];
        listeners[userID].push(socket);
    });

    socket.on('request', function (data) {
        listeners[data.user] = listeners[data.user] || [];
        listeners[data.user].forEach(function(listener) {
            listener.emit('request', data);
        });
        var deferredInitiator = Q.defer();
        var deferredReceiver = Q.defer();
        data.initiatorSocket = deferredInitiator;
        data.receiverSocket = deferredReceiver;

        deferredInitiator.resolve(socket);

        chatRequests[data.key] = data;
    });

    socket.on('response', function (data) {
        chatRequests[data.key].state = data.state;
        chatRequests[data.key].initiatorSocket.promise.then(function(socket){
            socket.emit("response", data);
        }, function() {
            console.log("error")
        });
        chatRequests[data.key].receiverSocket.resolve(socket);
    });

    socket.on('ice_candidate', function (data) {
        var socketPromise;

        if(data.sender === "initiator")
            socketPromise = chatRequests[data.key].receiverSocket;
        else
            socketPromise = chatRequests[data.key].initiatorSocket;

        socketPromise.promise.then(function(socket) {
            socket.emit("ice_candidate", data);
        }, function() {
            console.log("error")
        })
    })
});