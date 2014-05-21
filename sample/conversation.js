var Q = require("q");
var offerFactory = require("./offer");

exports.fromPeerRequest = function(data) {
    var deferredOffer;
    var deferredHandshake;

    var conversation = {
        data: data,
        initiatorSocket: Q.defer(),
        receiverSocket: Q.defer(),
        getOffer: function() {
            return deferredOffer.promise
        },
        setOffer: function(offer) {
            offer.getResponsePromise().then(function() {
                deferredHandshake.resolve();
            });
            deferredOffer.resolve(offer);
        },
        getHandshakePromise: function() {
            return deferredHandshake.promise;
        },
        resetOffer: function() {
            deferredOffer = Q.defer();
            deferredHandshake = Q.defer();
        }
    };

    conversation.resetOffer();

    if(data.data) {
        conversation.setOffer(offerFactory.fromRequestData(data.data));
    }

    return conversation;
};