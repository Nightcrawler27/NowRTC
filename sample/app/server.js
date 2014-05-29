var connect = require("connect");
var http = require("http");
var Conversation = require("./conversation");
var offer = require("./offer");
var io = require('socket.io');
var sass = require('node-sass');
var Q = require('q');
var listeners = {};
var chatRequests = {};

var app = connect();

app.use(connect.logger('dev'));
app.use(
    sass.middleware({
        src: __dirname + '/assets/styles/', //where the sass files are
        dest: __dirname + '/styles', //where css should go
        debug: true, // obvious
        prefix: "/sample/styles"
    })
);

app.use(connect.static(__dirname + '/..'));

var server = http.createServer(app);
var ioListener = io.listen(server);
ioListener.set('log level', 3);
server.listen(3000);

ioListener.on('connection', function (socket) {
    socket.on('listen', function(data) {
        console.log("user " + data.userID + " can accept peer request");
        Object.keys(listeners).forEach(function(key) {
            console.log("notifying user " + key + " of new user");
            listeners[key].emit("new_user", [data.userID]);
        });

        var userList = Object.keys(listeners);
        userList = userList.filter(function(user) {
           return user !== data.userID;
        });

        socket.emit("new_user", userList);
        listeners[data.userID] = socket;
    });

    socket.on('peer', function (data) {
        var conversation = chatRequests[data.key];
        if(conversation) {
            console.log("Completing existing peer handshake");
            conversation.receiverSocket.resolve(socket);
        } else {
            console.log("Creating new peer handshake");
            conversation = Conversation.fromPeerRequest(data);
            conversation.initiatorSocket.resolve(socket);
            chatRequests[data.key] = conversation;
            if(listeners[data.user]) {
                console.log("Sending handshake from " + data.from + " to " + data.user);
                listeners[data.user].emit('peer', data);
            } else {
                console.log("could not find listener for " + data.user);
            }
        }
    });

    socket.on('offer', function(data) {
        var conversation = chatRequests[data.key];
        conversation.getHandshake().then(function(sockets) {
            data.timestamp = new Date().getTime();
            var targetSocket = (socket === sockets[0]) ? sockets[1] : sockets[0];
            conversation.setOffer(data.offer);
            conversation.getResponse().then(function(response) {
                socket.emit("offer_response", response);
            });

            targetSocket.emit("offer", data);
        }).then(function() {}, function(err) {
            console.log(err)
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
        console.log("ice candidate");
        var conversation = chatRequests[data.key];

        Q.all([conversation.getHandshake(), conversation.getAgreement()]).then(function(test) {
            var targetSocket = test[0][0] === socket ? test[0][1] : test[0][0];
            targetSocket.emit("ice_candidate", data);
        });
    })
});