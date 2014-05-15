describe("NRTCPeerFactory", function() {
    "use strict";

    var NRTCPeerFactory, NRTCPeerConnection, OfferTransport, ICETransport, $rootScope;

    beforeEach(module("now.rtc", "now.rtcmocks"));

    beforeEach(inject(function (_NRTCPeerFactory_, _NRTCPeerConnection_, _OfferTransport_, _ICETransport_, _$rootScope_) {
        NRTCPeerFactory = _NRTCPeerFactory_;
        NRTCPeerConnection = _NRTCPeerConnection_;
        OfferTransport = _OfferTransport_;
        ICETransport = _ICETransport_;
        $rootScope = _$rootScope_;
    }));

    it("is defined", function() {
        expect(NRTCPeerFactory).toBeDefined();
    });

    describe("offer initiation", function() {
        var peerFactory;

        beforeEach(function() {
            peerFactory = new NRTCPeerFactory(new OfferTransport(), new ICETransport());
        });

        afterEach(function() {
            NRTCPeerConnection.ensureNoOutstandingOffers();
        });

        it("creates a peer", function() {
            var peer = peerFactory.initiate("my_key", [], "some_user");
            expect(peer).toBeDefined();
        });

        it("sets up RTC initiation sequence", function() {
            var peer = peerFactory.initiate("my_key", [], "some_user");
            var dataChannel = peer.createDataChannel();
            NRTCPeerConnection.flushOffer();
            expect(dataChannel).toBeDefined();
        });

        it("listens for offers", function() {
            spyOn(peerFactory, "fromOffer");
            var pendingOffer = {
                value: { key: "my_key" }
            };

            peerFactory.listen(angular.noop);
            OfferTransport.flush(pendingOffer);

            expect(peerFactory.fromOffer).toHaveBeenCalledWith(pendingOffer);
        });

        it("sets up RTC response sequence", function() {
            var peer = peerFactory.initiate("my_key", [], "some_user");
            var dataChannel = peer.createDataChannel();
            NRTCPeerConnection.flushOffer();
            expect(dataChannel).toBeDefined();
        });
    });

    describe("offer response", function () {

    })
});