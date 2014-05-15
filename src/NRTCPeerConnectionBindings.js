angular.module("now.rtc").factory("NRTCPeerConnectionBindings", function(NRTCDataChannel, NRTCPeerActions) {
    return {
        bind: function (payload) {
            var actions = {
                onsignalingstatechange: function (evt) {
                    console.log("signaling state changed", evt)
                },

                onstatechange: function (evt) {
                    console.log("state changed", evt)
                },

                onicecandidate: function (event) {
                    console.log("local ice candidate");
                    if (!event.candidate)
                        return;

                    payload.iceChannel.addCandidate(payload.key, payload.initiator ? "initiator" : "receiver", event.candidate);
                },

                ondatachannel: function (evt) {
                    console.log("data channel");
                    var channel = new NRTCDataChannel(evt.channel);

                    channel.bind("onmessage", function (a, b, c) {
                        console.log(a, b, c)
                    });
                },

                onnegotiationneeded: function () {
                    NRTCPeerActions.renegotiate(payload);
                },

                oniceconnectionstatechange: function (evt) {
                    console.log("iceConnectionStateChange");
                    console.log('>>> IceConnectionStateChanged to ' + evt.target.iceConnectionState);
                }
            };

            angular.extend(payload.peerConnection, actions);
        }
    }
});