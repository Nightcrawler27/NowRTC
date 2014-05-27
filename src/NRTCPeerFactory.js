angular.module("now.rtc").factory("NRTCPeerFactory", function($rootScope, NRTCPeer, NRTCPeerConnection) {
    return function(me, offerChannel, iceChannel) {
        var peers = {};

        function getPeerConfiguration(user, key) {
            return {
                peerConnection: new NRTCPeerConnection({"iceServers":[{"url":"stun:23.21.150.121"}]}),
                iceChannel: iceChannel,
                offerChannel: offerChannel,
                targetUser: user,
                key: key
            };
        }

        return {
            getPeer: function(user) {
                if(peers[user])
                    return peers[user];

                peers[user] = NRTCPeer(getPeerConfiguration(user, Math.random()));

                return peers[user];
            },

            listen: function(callback) {
                offerChannel.listen(function(offer) {
                    console.log("peer request from", offer.user);
                    var peer = NRTCPeer(getPeerConfiguration(offer.from, offer.key));
                    peers[offer.from] = peer;
                    $rootScope.$apply(function() {
                        callback(peer);
                    });
                })
            },

            getPeers: function() {
                return peers;
            },

            isOnline: function() {
                return offerChannel.isOnline();
            }
        }
    };
});