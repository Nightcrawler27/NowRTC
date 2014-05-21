var connect = require("connect");
var http = require("http");
var Conversation = require("./conversation");
var offer = require("./offer");
var io = require('socket.io');
var Q = require('q');
var listeners = {};
var chatRequests = {};

var app = connect();

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

        var conversation = Conversation.fromPeerRequest(data);
        conversation.initiatorSocket.resolve(socket);
        chatRequests[data.key] = conversation;

        listeners[data.user].forEach(function(listener) {
            listener.emit('peer', data);
        });
    });

    socket.on('peer_response', function(data) {
        var conversation = chatRequests[data.key];
        conversation.receiverSocket.resolve(socket);
    });

    socket.on('offer', function(data) {
        var conversation = chatRequests[data.key];
        conversation.getHandshake().then(function(sockets) {
            data.timestamp = new Date().getTime();
            var targetSocket = (socket === sockets[0]) ? sockets[1] : sockets[0];
            conversation.setOffer(data);
            conversation.getResponse().then(function(response) {
                socket.emit("offer_response", response);
            });
            targetSocket.emit("offer", data);
        })
    });

    socket.on('offer_response', function (data) {
        var conversation = chatRequests[data.key];
        conversation.getOffer().then(function(offer) {
            if(data.timestamp !== offer.timestamp) {
                console.log("Received response for expired or invalid offer");
                return;
            }

            conversation.setResponse(data);
        }, function(err) {
            console.log("error", err)
        });
    });

    socket.on('ice_candidate', function (data) {
        var socketPromise;
        var conversation = chatRequests[data.key];

        if(data.sender === "initiator")
            socketPromise = conversation.receiverSocket;
        else
            socketPromise = conversation.initiatorSocket;

        conversation.getAgreement().then(function(){
            socketPromise.then(function(targetSocket) {
                targetSocket.emit("ice_candidate", data);
            })
        });
    })
});