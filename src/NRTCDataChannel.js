angular.module("now.rtc").factory("NRTCDataChannel", function() {
    function NRTCDataChannel(dataChannel) {
        this.dataChannel = dataChannel;
    }

    NRTCDataChannel.prototype = {
        bind: function(event, callback) {
            this.dataChannel[event] = callback;
        },

        send: function(message) {
            this.dataChannel.send(message);
        }
    }

    return NRTCDataChannel;
})