angular.module("now.rtcmocks").factory("NRTCSignalServer", function() {
    "use strict";

    function NRTCSignalServerMock(root, sessionID) {}

    NRTCSignalServerMock.prototype = {
        addCandidate: function() {},
        onCandidate: function(key, type, callback) {},
        listen: function(key, listener) {},
        onAnswer: function(key, handler) {},
        respond: function(key, response) {},
        _watch: function(name, fn) {},
        _get: function(name) {},
        close: function() {},
        reset: function() {},
        send: function(name, data) {},
        toString : function() {}
    };

    return NRTCSignalServerMock;
})