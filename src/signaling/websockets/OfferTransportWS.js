angular.module("now.rtc").factory("OfferTransport", function($q, RTCOffer) {
    "use strict";

    function NRTCRequestTransportFB(url, sessionID) {
        this.socket = io.connect(url);
        this.sessionID = sessionID;
    }

    NRTCRequestTransportFB.prototype = {
        initiate: function(configuration) {
            var deferred = $q.defer();

            this.socket.on("response", function(data) {
                console.log("request response");
                if(data.key !== configuration.key)
                    return;

                if(data.state === "accepted") {
                    configuration.remoteDescription = new RTCSessionDescription(data.response);
                    deferred.resolve(configuration);
                } else {
                    deferred.reject();
                }
            });

            this.socket.emit("request", {
                initiator: configuration.initiator,
                data: configuration.localDescription,
                user: "my_user",
                key: configuration.key
            });

            return deferred.promise;
        },

        listen: function(listener) {
            this.socket.emit("listen", {
                userID: this.sessionID
            });


            this.socket.on('request', (function (offer) {
                listener(new RTCOffer({
                    offer: offer,
                    transport: this.socket
                }))
            }).bind(this));
        },

        close: function() {
            var self = this;
            Object.keys(this.signalProcessors).forEach(function (name) {
                var t = self.get(name);
                t.off('value', self.signalProcessors[name]);
            });

            Firebase.goOffline();
            this.signalProcessors = {};
        }
    };

    return NRTCRequestTransportFB;
});