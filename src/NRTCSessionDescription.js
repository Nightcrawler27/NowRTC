angular.module("now.rtc").factory("RTCSessionDescription", function() {
    return function(sdp) {
        return {
            sdp: sdp,
            type: null
        }
    }
});