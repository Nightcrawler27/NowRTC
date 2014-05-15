/* globals Firebase */
angular.module("now.rtc").factory("RTCOffer", function() {
    "use strict";

    function RTCOfferFB(snapshot) {
        this.ref = snapshot.ref();
        this.value = snapshot.val();
    }

    RTCOfferFB.prototype = {
        accept: function(response) {
            if(this.value.state)
                throw "Request has already been " + this.value.state;

            this.value.state = "accepted";
            this.ref.update({
                response: response,
                state: "accepted"
            });
        },

        reject: function() {
            if(this.value.state)
                throw "Request has already been " + this.value.state;

            this.value.state = "rejected";
            this.ref.update({
                state: "rejected"
            });
        },

        isValid: function() {
            return !!this.value.state;
        }
    };

    return RTCOfferFB;
})