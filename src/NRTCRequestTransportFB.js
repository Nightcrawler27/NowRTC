/* globals Firebase */
angular.module("now.rtc").factory("NRTCRequestTransport", function($q, RTCOffer) {
    "use strict";

    function NRTCRequestTransportFB(url, sessionID) {
        this.sessionID = sessionID;
        this.fb = new Firebase(url);
        Firebase.goOnline();
    }

    NRTCRequestTransportFB.prototype = {
        initiate: function(info, user, key) {
            var deferred = $q.defer();

            var requestRef = this.fb.child(user + "/offers").push({
                initiator: window.NOW.userID,
                data: info,
                key: key
            });

            requestRef.child("state").on("value", function(value) {
                if (value && value.val() === "accepted") {
                    requestRef.child("response").once("value", function(data) {
                        deferred.resolve(data.val());
                    })
                } else if (value && value.val() === "rejected") {
                    deferred.reject();
                }
            });

            return deferred.promise;
        },

        listen: function(listener) {
            this.fb.child(this.sessionID + "/offers").on("child_added", function(offer) {
                //Already accepted or rejected... should probably set to 'unanswered' until accepted or rejected.
                if(offer.val().state)
                    return;

                listener(new RTCOffer(offer))
            });
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
})