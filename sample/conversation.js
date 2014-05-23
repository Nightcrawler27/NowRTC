var Q = require("q");

exports.fromPeerRequest = function(data) {
    var deferredOffer = Q.defer();
    var deferredResponse = Q.defer();
    var deferredAgreement = Q.defer().promise;

    var conversation = {
        data: data,
        initiatorSocket: Q.defer(),
        receiverSocket: Q.defer(),
        getOffer: function() {
            return deferredOffer.promise
        },
        setOffer: function(offer) {
            deferredOffer = Q.defer();
            deferredResponse = Q.defer();
            deferredAgreement = Q.all([deferredOffer.promise, deferredResponse.promise]);

            deferredOffer.resolve(offer);
        },
        getResponse: function() {
            return deferredResponse.promise;
        },
        setResponse: function(response) {
            deferredResponse.resolve(response);
        },
        getHandshake: function() {
            return deferredHandshake;
        },
        getAgreement: function() {
            return deferredAgreement;
        }
    };

    var deferredHandshake = Q.all([conversation.initiatorSocket.promise, conversation.receiverSocket.promise]);

    return conversation;
};