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

            angular.forEach(streams, peerConfiguration.peerConnection.addStream);

            return new NRTCPeer(peerConfiguration.peerConnection);
        },

        listen: function(onOffer) {
            this.offerChannel.listen(function(offer) {
                var peer = this.fromOffer(offer);
                onOffer(peer);
            }.bind(this))
        },

        fromOffer: function(offer) {
            var peerConfiguration = getPeerConfiguration(this, "", offer.value.key, false);
            peerConfiguration.remoteDescription = new NRTCSessionDescription(offer.value.data);
            peerConfiguration.offer = offer;

            NRTCPeerConnectionBindings.bind(peerConfiguration);
            NRTCPeerActions.receive(peerConfiguration);

            return new NRTCPeer(peerConfiguration.peerConnection);
        }
    };

    return NRTCPeerFactory;
});