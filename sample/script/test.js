angular.module("foo", ["now.rtc"]).controller("ChatTest", function($scope, NRTCPeerFactory, ICETransport, OfferTransport) {
    var iceChannel;
    var requestChannel;
    var peerFactory;

    $scope.activeUser = "foo";

    $scope.peers = [];

    $scope.start = function() {
        iceChannel =  new ICETransport("http://localhost:3000", $scope.me);
        requestChannel = new OfferTransport("http://localhost:3000", $scope.me);
        peerFactory = NRTCPeerFactory($scope.me, requestChannel, iceChannel);
        peerFactory.listen(function(peer) {
            $scope.$apply(function() {
                console.log("new peer:", peer);
                $scope.peers.push(peer);
            });
        });
    };

    $scope.setActiveTab = function(user) {
        console.log(user);
        $scope.activeUser = user;
    };

    $scope.getPeers = function() {
        if(peerFactory)
            return peerFactory.getPeers();
        else
            return [];
    };

    $scope.sendMessage = function(user, message) {
        console.log("sending message", message, "to", user);
        var peer = peerFactory.getPeer(user);
        peer.send(message);
    };

    $scope.video = function() {
        var videoConstraints = {
            optional : []
        };

        getUserMedia({
            video : videoConstraints
        }, gotVideo, function(a,b,c) {
            console.log(a,b,c)
        });
    };

    function gotVideo(stream) {
        $scope.$apply(function() {
            $scope.localStream = stream;
            attachMediaStream($("#local")[0], stream);
            $scope.peerConnection.addStream(stream);
        });
    }
});