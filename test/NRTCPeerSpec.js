describe("NRTCPeer", function() {
    "use strict";

    var NRTCPeer, NRTCSignalServer, NRTCPeerConnection, $rootScope;

    beforeEach(module("now.rtc", "now.rtcmocks"));

    beforeEach(inject(function (_NRTCPeer_, _NRTCSignalServer_, _NRTCPeerConnection_, _$rootScope_) {
        NRTCPeer = _NRTCPeer_;
        NRTCSignalServer = _NRTCSignalServer_;
        NRTCPeerConnection = _NRTCPeerConnection_;
        $rootScope = _$rootScope_;
    }));

    it("is defined", function() {
        expect(NRTCPeer).toBeDefined();
    });

    describe("offer initiation", function () {
        var peer;

        beforeEach(function() {
            var signalServer = new NRTCSignalServer();
            peer = new NRTCPeer(signalServer, {});
        });

        afterEach(function() {
            NRTCPeerConnection.ensureNoOutstandingOffers();
        });

        it("returns a promise of a connection offer", function() {
            var offer = peer.initiate([]);
            NRTCPeerConnection.flushOffer();
            expect(offer.then).toBeDefined();
        });

        it("resolves the offer promise when an offer is available", function() {
            var offerPromise = peer.initiate([]);
            var response = void(0);
            NRTCPeerConnection.flushOffer();
            offerPromise.then(function(offer) {
                response = offer;
            });

            $rootScope.$digest();

            expect(response).toBeDefined();
        })
    });

    describe("offer response", function () {
        var peer;

        beforeEach(function() {
            var signalServer = new NRTCSignalServer();
            peer = new NRTCPeer(signalServer, {});
        });

        afterEach(function() {
            NRTCPeerConnection.ensureNoOutstandingOffers();
        });

        it("creates a peer connection", function() {
            peer.fromOffer({});
            expect(peer.peerConnection).toBeDefined();
        });

        it("sets the conversation key", function() {
            peer.fromOffer({ key: "foobar" });
            expect(peer.key).toBe("foobar");
        });

        it("resolves the connection promise", function() {
            var resolved = false;
            peer.fromOffer({ key: "foobar" }).then(function(data) {
                resolved = data;
            });

            peer.peerConnection.trigger("onnegotiationneeded");
            var offer = {};
            NRTCPeerConnection.flushOffer(offer);
            $rootScope.$digest();
            NRTCPeerConnection.flushOffer(offer);
            expect(resolved.offer).toBe(offer);
        });

        it("sets a data channel handler", function() {
            peer.fromOffer({});
            expect(peer.peerConnection.ondatachannel).toBeDefined();
        })
    })
});