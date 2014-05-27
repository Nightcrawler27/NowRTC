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
        console.log("setting remote description");
        return defer(data, "setRemoteDescription", function() {
            data.deferredRemoteDescription.resolve()
        }, "remoteDescription");
    }

    function setLocalDescription(data) {
        console.log("setting local description");
        return defer(data, "setLocalDescription", function() {
            data.deferredLocalDescription.resolve()
        },  "localDescription");
    }

    function defer(data, methodName, callback, dataMember) {
        var deferred = $q.defer();
        var fnArgs = [wrappedCallback, function(err) {
            console.log("********** Error", err);
            deferred.reject(err)
        }];

        if(dataMember)
            fnArgs.unshift(data[dataMember]);

        data.peerConnection.trigger(methodName, fnArgs);

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
        var callback = peerConfiguration.peerConnection.addIceCandidate.bind(peerConfiguration.peerConnection);
        var deferredRemoteDescription = $q.defer();
        var deferredLocalDescription = $q.defer();
        peerConfiguration.deferredRemoteDescription = deferredRemoteDescription;
        peerConfiguration.deferredLocalDescription = deferredLocalDescription;
        peerConfiguration.iceChannel.onCandidate(peerConfiguration.key, "", function(candidate) {
            $q.all([deferredRemoteDescription.promise, deferredLocalDescription]).then(function() {
                console.log("remote candidate", candidate);
                callback(candidate)
            })
        });
        return $q.when(peerConfiguration);
    }

    function onError(error) {
        console.log("**********************", error);
    }

    return {
        initiate: setupICEWatcher,

        renegotiate: function(peerConfiguration) {
            var initiateOffer = peerConfiguration.offerChannel.createOffer.bind(peerConfiguration.offerChannel);
            return setupICEWatcher(peerConfiguration)
                .then(createOffer)
                .then(setLocalDescription)
                .then(initiateOffer)
                .then(setRemoteDescription)
                .then(null, onError);
        },

        receive: function(peerConfiguration) {
            return setupICEWatcher(peerConfiguration)
                .then(setRemoteDescription)
                .then(createAnswer)
                .then(setLocalDescription)
                .then(acceptRemoteOffer)
                .then(null, onError);
        }
    }
});