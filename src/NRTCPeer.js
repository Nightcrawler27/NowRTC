angular.module("now.rtc").factory("NRTCPeer", function($rootScope, $q) {
    "use strict";
    function NRTCPeer(peerConnection, constraints) {
        this.peerConnection = peerConnection;
        this.messages = [];
        this.constraints = angular.extend({
            optional : [],
            mandatory : {
                OfferToReceiveAudio : true,
                OfferToReceiveVideo : true
            }
        }, constraints);
    }

    NRTCPeer.prototype = {
        send: function(message) {
            console.log(this.dataChannel);
            this.dataChannel.send(message)
        },

        addStream: function(stream) {
            this.peerConnection.addStream(stream);
        },

        onStream: function(callback) {
            this.peerConnection.bind("onaddstream", callback);
        },

        createDataChannel: function() {
            var dataChannel = this.peerConnection.createDataChannel("chat");
            dataChannel.onopen = function(evt) { console.log("opening channel", evt); };
            dataChannel.onclose = function() { console.log("channel closing") };
            dataChannel.onerror = function(event) { console.log("channel error:", event); };
            dataChannel.onmessage = function(event) { $rootScope.$apply(function() {})};
            this.dataChannel = dataChannel;
            return dataChannel;
        },

        isConnected: function() {
            return this.connected || this.connecting
        }
    };

    return NRTCPeer;
});