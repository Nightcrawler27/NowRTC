angular.module("now.rtc").factory("NRTCPeerConnectionBindings", function(NRTCDataChannel, NRTCPeerActions) {
    return {
        bind: function (payload) {
            payload.peerConnection.bind("onsignalingstatechange", function (event) {
                console.log("signaling state changed", event)
            });

            payload.peerConnection.bind("onstatechange", function(event) {
                console.log("state changed", event)
            });

            payload.peerConnection.bind("onicecandidate", function(event) {
                console.log("local ice candidate");
                if (!event.candidate)
                    return;

                payload.iceChannel.addCandidate(payload.key, "to:" + payload.targetUser, event.candidate);
            });

            payload.peerConnection.bind("oniceconnectionstatechange", function (event) {
                console.log("iceConnectionStateChange");
                console.log('>>> IceConnectionStateChanged to ' + event.target.iceConnectionState, event);
            });

            payload.peerConnection.bind("onnegotiationneeded", function () {
                console.log("Negotiation needed");
                NRTCPeerActions.renegotiate(payload);
            });
        }
    }
});