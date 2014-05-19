angular.module("foo", ["now.rtc"]).controller("ChatTest", function($scope, NRTCPeerFactory, ICETransport, OfferTransport) {
    var iceChannel = new ICETransport("http://localhost:3000", "my_user");
    var requestChannel = new OfferTransport("http://localhost:3000", "my_user");
    var peerFactory = new NRTCPeerFactory(requestChannel, iceChannel);

    $scope.start = function() {
        $scope.peerConnection = peerFactory.initiate("my_key", [], "my_user");
        $scope.dataChannel = $scope.peerConnection.createDataChannel();
    };

    $scope.listen = function() {
        peerFactory.listen(function(peer) {
            $scope.peerConnection = peer;
        });
    };

    $scope.message = function() {
        $scope.dataChannel.send("saldjf")
    };

    $scope.video = function() {
        var videoConstraints = {
            mandatory : {
                chromeMediaSource : 'screen',
                maxWidth: 1920,
                maxHeight: 1200
            },
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
            // attach to the local view
            attachMediaStream($("#local")[0], stream);
            $scope.peerConnection.addStream(stream);
        });
    }
});