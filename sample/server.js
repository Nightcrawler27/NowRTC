var connect = require("connect");
var http = require("http");
var urlrouter = require('urlrouter');
var conversation = require("./conversation");
var offer = require("./offer");
var io = require('socket.io');
var Q = require('q');
var listeners = {};
var chatRequests = {};

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

    socket.on('peer', function (data) {
        listeners[data.user] = listeners[data.user] || [];
        listeners[data.user].forEach(function(listener) {
            listener.emit('peer', data);
        });

        var conv = conversation.fromPeerRequest(data);
        conv.initiatorSocket.resolve(socket);

        chatRequests[data.key] = conv;
    });

    socket.on('peer_response', function(data) {
        var conversation = chatRequests[data.key];
        conversation.receiverSocket.resolve(socket);
        conversation.getOffer().then(function(offer) {
            offer.key = data.key;
            socket.emit("offer", offer)
        })
    });

    socket.on('offer', function(data) {
        data.timestamp = new Date().getTime();
        var conversation = chatRequests[data.key];
        conversation.resetOffer();
        conversation.setOffer(offer.fromRequestData(data));
    });

    socket.on('response', function (data) {
        var conversation = chatRequests[data.key];
        conversation.getOffer().then(function(offer) {
            if(data.timestamp !== offer.timestamp) {
                console.log("Received response for expired or invalid offer");
                return;
            }

            offer.setResponse(data);
            conversation.initiatorSocket.promise.then(function(socket){
                socket.emit("response", data);
            }, function() {
                console.log("error")
            });
        }).then(function() {}, function(err) {
            console.log("error")
        });
    });

    socket.on('ice_candidate', function (data) {
        var socketPromise;
        var conversation = chatRequests[data.key];

        if(data.sender === "initiator")
            socketPromise = conversation.receiverSocket;
        else
            socketPromise = conversation.initiatorSocket;

        Q.all([socketPromise.promise, conversation.getHandshakePromise()]).then(function(response){
            response[0].emit("ice_candidate", data);
        });
    })
});