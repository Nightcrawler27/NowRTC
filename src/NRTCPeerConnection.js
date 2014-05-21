angular.module("now.rtc").factory("NRTCPeerConnection", function() {
    "use strict";

    function NRTCPeerConnection(configuration) {
        console.log("creating peer connection");
        this.peerConnection = new RTCPeerConnection(configuration);
    }

    NRTCPeerConnection.prototype = {
        addStream: function(stream) {
            this.peerConnection.addStream(stream)
        },

        bind: function(event, fn) {
            this.peerConnection[event] = fn.bind(this);
        },

        trigger: function(event, data) {
            var fn = this.peerConnection[event];
            console.log("triggering ", fn);
            if(fn)
                fn.apply(this.peerConnection, data);
        },

        addIceCandidate: function(candidate) {
            this.peerConnection.addIceCandidate(candidate);
        },

        createDataChannel: function(name) {
            return this.peerConnection.createDataChannel(name);
        },

        close: function() {
            console.log("closing peer connection");
            this.peerConnection.close();
        },

        getSignalingState: function() {
            return this.peerConnection.signalingState;
        },

        getIceGatheringState: function() {
            return this.peerConnection.iceGatheringState;
        }
    };

    return NRTCPeerConnection;
});