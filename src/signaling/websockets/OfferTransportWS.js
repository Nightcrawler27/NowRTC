angular.module("now.rtc").factory("OfferTransport", function($q, RTCOffer, NRTCSessionDescription) {
    "use strict";

    function NRTCRequestTransportFB(url, sessionID) {
        this.socket = io.connect(url);
        this.sessionID = sessionID;
    }

    NRTCRequestTransportFB.prototype = {
        handshake: function(configuration) {
            this.socket.emit("peer", {
                user: configuration.targetUser,
                from: this.sessionID,
                key: configuration.key
            });
        },

        listen: function(listener) {
            this.socket.emit("listen", {
                userID: this.sessionID
            });

            this.socket.on('peer', function(data) {
                listener(data);
            })
        },

        createOffer: function(configuration) {
            var deferred = $q.defer();
            this.socket.emit("offer", {
                offer: configuration.localDescription,
                key: configuration.key
            });

            this.socket.on('offer_response', (function (data) {
                if(data.key !== configuration.key)
                    return;

                configuration.remoteDescription = new NRTCSessionDescription(data.response);
                deferred.resolve(configuration);
            }).bind(this));

            return deferred.promise;
        },

        onOffer: function(listener) {
            this.socket.on('offer', (function (offer) {
                listener(new RTCOffer({
                    offer: offer,
                    transport: this.socket
                }))
            }).bind(this));
        },

        close: function() {
        }
    };

    return NRTCRequestTransportFB;
});