angular.module("now.rtcmocks").factory("NRTCRequestTransport", function() {
    return {
        createOffer: function(successCallback, failureCallback, constraints) {

        },

        createAnswer: function(successCallback, failureCallback, constraints) {

        },

        setLocalDescription: function(description, successCallback, failureCallback) {

        },
        setRemoteDescription: function(description, successCallback, failureCallback) {

        },
        updateIce: function(configuration, constraints) {

        },
        addIceCandidate: function(candidate, successCallback, failureCallback) {

        },
        getRemoteStreams: function() {

        },
        getStreamById: function(streamId) {

        },
        addStream: function(stream, optionconstraints) {

        },
        removeStream: function(stream) {

        },
        close: function() {

        },
        createDataChannel: function(label, dataChannelDict) {

        }
    }
});