angular.module("now.rtc").factory("NRTCPeerActions", function($q, NRTCSessionDescription) {
    function createOffer(data) {
        return defer(data, "createOffer", function(data, connectionDesc) {
            data.localDescription = connectionDesc;
        });
    }

    function createAnswer(data) {
        return defer(data, "createAnswer", function(data, answer) {
            data.localDescription = new NRTCSessionDescription(answer);
        });
    }

    function setRemoteDescription(data) {
        return defer(data, "setRemoteDescription", angular.noop, "remoteDescription");
    }

    function setLocalDescription(data) {
        return defer(data, "setLocalDescription", angular.noop, "localDescription");
    }

    function defer(data, methodName, callback, dataMember) {
        var deferred = $q.defer();
        var errorHandler = deferred.reject.bind(deferred);
        var fn = data.peerConnection[methodName];
        var fnArgs = [wrappedCallback, errorHandler];

        if(dataMember)
            fnArgs.unshift(data[dataMember]);

        fn.apply(data.peerConnection, fnArgs);

        function wrappedCallback(answer) {
            callback(data, answer);
            deferred.resolve(data);
        }

        return deferred.promise;
    }

    function acceptRemoteOffer(data){
        data.offer.accept(data.localDescription);
        return data;
    }

    function setupICEWatcher(peerConfiguration) {
        var type = peerConfiguration.initiator ? "receiver" : "initiator";
        var callback = peerConfiguration.peerConnection.addIceCandidate.bind(peerConfiguration.peerConnection);
        peerConfiguration.iceChannel.onCandidate(peerConfiguration.key, type, callback)
    }

    function onError(error) {
        console.log(error);
    }

    return {
        initiate: setupICEWatcher,

        renegotiate: function(peerConfiguration) {
            var initiateOffer = peerConfiguration.offerChannel.initiate.bind(peerConfiguration.offerChannel);
            return createOffer(peerConfiguration)
                .then(setLocalDescription)
                .then(initiateOffer)
                .then(setRemoteDescription)
                .then(null, onError);
        },

        receive: function(peerConfiguration) {
            return setRemoteDescription(peerConfiguration)
                .then(createAnswer)
                .then(setLocalDescription)
                .then(acceptRemoteOffer)
                .then(setupICEWatcher)
                .then(null, onError);
        }
    }
});