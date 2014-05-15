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
        this.offer = $q.defer();
    }

    NRTCPeer.prototype = {
        send: function(message) {
            this.dataChannel.send(message)
        },

        addStream: function(stream) {
            if(this.peerConnection) {
                this.offer = $q.defer();
                this.peerConnection.addStream(stream);
                return this.offer.promise;
            } else {
                return this.initiate([stream]);
            }
        },

        createDataChannel: function() {
            var dataChannel = this.peerConnection.createDataChannel("chat");
            dataChannel.onopen = function(evt) { console.log("opening channel", evt); };
            dataChannel.onclose = function() { console.log("channel closing") };
            dataChannel.onerror = function(event) { console.log("channel error:", event); };
            dataChannel.onmessage = function(event) { $rootScope.$apply(function() {})};
            return dataChannel;
        },

        isConnected: function() {
            return this.connected || this.connecting
        }
    };

    return NRTCPeer;
});