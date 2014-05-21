var Q = require("q");

exports.fromPeerRequest = function(data) {
    var deferredOffer = Q.defer();
    var deferredResponse = Q.defer();
    var deferredAgreement = Q.defer();

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
            deferredAgreement.reject("Agreement ended");
            deferredAgreement = Q.all([deferredOffer, deferredHandshake]);

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

    var deferredHandshake = Q.all([conversation.initiatorSocket, conversation.receiverSocket]);

    return conversation;
};