/* globals Firebase */
angular.module("now.rtc").factory("RTCOffer", function() {
    "use strict";

    function RTCOfferWS(offer) {
        this.offer = offer;
        this.value = offer.offer;
    }

    RTCOfferWS.prototype = {
        accept: function(response) {
            if(this.value.state)
                throw "Request has already been " + this.value.state;

            this.value.state = "accepted";
            this.offer.transport.emit("response", {
                response: response,
                key: this.offer.offer.key,
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

    return RTCOfferWS;
})