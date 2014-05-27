angular.module("now.rtc").factory("OfferTransport", function($rootScope, $q, RTCOffer, NRTCSessionDescription) {
    "use strict";

    function NRTCRequestTransportFB(url, sessionID) {
        this.socket = io.connect(url);
        this.sessionID = sessionID;
        this.users = [];
    }

    NRTCRequestTransportFB.prototype = {
        handshake: function(configuration) {
            this.socket.emit("peer", {
                user: configuration.targetUser,
                from: this.sessionID,
                key: configuration.key
            });
        },

        isOnline: function() {
            return this.socket.socket.connected;
        },

        listen: function(listener) {
            var that = this;

            this.socket.emit("listen", {
                userID: this.sessionID
            });

            this.socket.on('peer', function(data) {
                listener(data);
            });

            this.socket.on("new_user", function(newUsers) {
                console.log("new user", newUsers);
                $rootScope.$apply(function() {
                    newUsers.forEach(function(user) {
                        if(that.users.indexOf(user) == -1)
                            that.users.push(user)
                    });
                })
            }.bind(this))
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