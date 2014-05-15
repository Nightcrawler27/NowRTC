angular.module("now.rtcmocks").factory("OfferTransport", function() {
    var listeners = [];

    function OfferTransportMock() {

    }

    OfferTransportMock.prototype = {
        initiate: function(configuration) {

        },

        listen: function(listener) {
            listeners.push(listener);
        },

        close: function() {

        }
    };

    OfferTransportMock.flush = function(offer) {
        var listener = listeners.shift();
        if(listener)
            listener(offer);
    };

    return OfferTransportMock;
});