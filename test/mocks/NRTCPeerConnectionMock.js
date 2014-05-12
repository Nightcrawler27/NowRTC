angular.module("now.rtcmocks").factory("NRTCPeerConnection", function($q) {
    "use strict";

    var offers = [];

    function NRTCPeerConnectionMock(configuration) {
    }

    NRTCPeerConnectionMock.prototype = {
        createOffer: function() {
            var deferred = $q.defer();
            offers.push(deferred);
            return deferred.promise;
        },

        createAnswer: function() {
            return this.createOffer();
        },

        createDataChannel: function(stuff) {
            if(this.onnegotiationneeded)
                this.onnegotiationneeded();

            return {};
        },

        addIceCandidate: function(candidate) {
        },

        setRemoteDescription: function(offer) {
            var deferred = $q.defer();
            deferred.resolve(offer);
            return deferred.promise;
        },

        setLocalDescription: function(description) {
            var deferred = $q.defer();
            deferred.resolve(description);
            return deferred.promise;
        },

        addStream: function(stream) {
        },

        bind: function(event, fn) {
            this[event] = fn;
        },

        trigger: function(event, data) {
            this[event](data);
        },

        close: function() {
        }
    };

    NRTCPeerConnectionMock.flushOffer = function(offer) {
        if(offers.length > 0)
            offers.shift().resolve(offer);
        else
            throw "No outstanding offers to flush";
    };

    NRTCPeerConnectionMock.ensureNoOutstandingOffers = function(offer) {
        if(offers.length > 0)
            throw "Expected no outstanding offers.  There are " + offers.length;
    };

    return NRTCPeerConnectionMock;
});