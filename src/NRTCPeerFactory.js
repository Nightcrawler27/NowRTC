angular.module("now.rtc").factory("NRTCPeerFactory", function($q, NRTCPeer, NRTCPeerActions, NRTCSessionDescription, NRTCPeerConnection, NRTCPeerConnectionBindings) {
    var configuration = {"iceServers":[{"url":"stun:23.21.150.121"}]};

    function NRTCPeerFactory(offerChannel, iceChannel) {
        this.offerChannel = offerChannel;
        this.iceChannel = iceChannel;
    }

    function getPeerConfiguration(peerFactory, user, key, initiator) {
        return {
            peerConnection: new NRTCPeerConnection(configuration),
            iceChannel: peerFactory.iceChannel,
            offerChannel: peerFactory.offerChannel,
            targetUser: user,
            key: key,
            initiator: initiator
        };
    }

    NRTCPeerFactory.prototype =  {
        initiate: function(key, streams, user) {
            var peerConfiguration = getPeerConfiguration(this, user, key, true);

            NRTCPeerConnectionBindings.bind(peerConfiguration);
            NRTCPeerActions.initiate(peerConfiguration);
            this.offerChannel.onOffer(function(offer) {
                console.log("incoming offer");
                peerConfiguration.remoteDescription = new NRTCSessionDescription(offer.value.data);
                peerConfiguration.offer = offer;

                NRTCPeerConnectionBindings.bind(peerConfiguration);
                NRTCPeerActions.receive(peerConfiguration);
            });

            angular.forEach(streams, peerConfiguration.peerConnection.addStream);

            return new NRTCPeer(peerConfiguration.peerConnection);
        },

        listen: function(onOffer) {
            this.offerChannel.listen(function(offer) {
                var peer = this.fromPeer(offer);
                onOffer(peer);
            }.bind(this))
        },

        fromPeer: function(peer) {
            var peerConfiguration = getPeerConfiguration(this, "", peer.key, false);
            this.offerChannel.onOffer(function(offer) {
                peerConfiguration.remoteDescription = new NRTCSessionDescription(offer.value.data);
                peerConfiguration.offer = offer;

                NRTCPeerConnectionBindings.bind(peerConfiguration);
                NRTCPeerActions.receive(peerConfiguration);
            });

            return new NRTCPeer(peerConfiguration.peerConnection);
        }
    };

    return NRTCPeerFactory;
});