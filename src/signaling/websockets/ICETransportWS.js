angular.module("now.rtc").factory("ICETransport", function() {
    'use strict';

    function ICETransportWS(url) {
        this.socket = io.connect(url);
    }

    ICETransportWS.prototype = {
        addCandidate: function(key, type, candidate) {
            //Adds ICE Candidate
            if(!key) {
                console.log("Invalid key: " + key);
                throw new TypeError("invalid key");
            }

            this.socket.emit("ice_candidate", {
                type : 'candidate',
                sender: type,
                key: key,
                label : candidate.sdpMLineIndex,
                id : candidate.sdpMid,
                candidate : candidate.candidate
            })
        },

        onCandidate: function(key, type, callback) {
            //Callback when remote ICE candidate appears
            console.log("watch for ice candidates from", type);
            this.socket.on("ice_candidate", function(item) {
                if(item.key === key) {
                    console.log("remote ice candidate");
                    callback(new RTCIceCandidate(item));
                }
            });
        },

        close: function() {},
        reset: function() {}
    };

    return ICETransportWS;
});