angular.module("now.rtc").factory("NRTCPeer", function($rootScope, $q, NRTCPeerConnectionBindings, NRTCPeerActions, NRTCSessionDescription, NRTCDataChannel) {
    "use strict";

    return function(peerConfiguration) {
        var messages = [];
        var dataChannelPromise;

        peerConfiguration.offerChannel.handshake(peerConfiguration);
        peerConfiguration.offerChannel.onOffer(function(offer) {
            peerConfiguration.remoteDescription = new NRTCSessionDescription(offer.value.offer);
            peerConfiguration.offer = offer;
            NRTCPeerActions.receive(peerConfiguration);
        });

        NRTCPeerConnectionBindings.bind(peerConfiguration);

        peerConfiguration.peerConnection.bind("ondatachannel", function (event) {
            console.log("data channel");
            var channel = new NRTCDataChannel(event.channel);
            peerConfiguration.peerConnection.dataChannel = channel;
            var deferred = $q.defer();
            dataChannelPromise  = deferred.promise;
            channel.bind("onmessage", function(event) {
                $rootScope.$apply(function () {
                    console.log("Got message: ", event.data);
                    messages.push(event.data)
                })
            });
            deferred.resolve(channel)
        });

        function getDataChannel() {
            if(dataChannelPromise)
                return dataChannelPromise;

            var deferred = $q.defer();
            dataChannelPromise  = deferred.promise;
            var dataChannel = peerConfiguration.peerConnection.createDataChannel("chat");
            dataChannel.onopen = function() { deferred.resolve(dataChannel) };
            dataChannel.onclose = function() { console.log("channel closing") };
            dataChannel.onerror = function(event) { console.log("channel error:", event); };
            dataChannel.onmessage = function(event) { $rootScope.$apply(function() {
                console.log("Got message: ", event.data);
                messages.push(event.data)
            })};

            return dataChannelPromise;
        }

        return {
            send: function(message) {
                getDataChannel().then(function(dataChannel) {
                    console.log("sending message", message);
                    dataChannel.send(message);
                }, function() {
                    console.log("error sending message");
                })
            },

            addStream: function(stream) {
                this.peerConnection.addStream(stream);
            },

            isConnected: function() {
                return this.connected || this.connecting
            },

            getUserName: function() {
                return peerConfiguration.targetUser;
            },

            getMessages: function() {
                return messages;
            }
        }
    };
});