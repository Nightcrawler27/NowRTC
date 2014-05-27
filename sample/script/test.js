angular.module("foo", ["now.rtc"]).controller("ChatTest", function($scope, NRTCPeerFactory, ICETransport, OfferTransport) {
    var HOST = "http://localhost:3000";
    var iceChannel;
    var peerFactory;
    $scope.peers = [];

    $scope.start = function() {
        iceChannel =  new ICETransport(HOST, $scope.me);
        $scope.requestChannel = new OfferTransport(HOST, $scope.me);
        peerFactory = NRTCPeerFactory($scope.me, $scope.requestChannel, iceChannel);
        peerFactory.listen(function(peer) {
            $scope.peers.push(peer)
        });
    };

    $scope.isOnline = function() {
        return peerFactory && peerFactory.isOnline();
    };

    $scope.setActiveUser = function(user) {
        $scope.activeUser = user;
        $scope.currentPeer = peerFactory.getPeer(user);
    };

    $scope.isActiveUser = function(user) {
        return user === $scope.activeUser;
    }

    $scope.getPeers = function() {
        return peerFactory ? peerFactory.getPeers() : [];
    };

    $scope.sendMessage = function(user, message) {
        console.log("sending message", message, "to", user);
        var peer = peerFactory.getPeer(user);
        peer.send(message);
    };

    $scope.video = function() {
        getUserMedia({
            video : {
                optional : []
            }
        }, function(stream) {
            $scope.$apply(function() {
                $scope.localStream = stream;
                attachMediaStream($("#local")[0], stream);
                $scope.peerConnection.addStream(stream);
            });
        }, function(err) {
            console.log(err)
        });
    };
});