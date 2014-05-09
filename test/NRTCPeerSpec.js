describe("NRTCPeer", function() {
    "use strict";

    var NRTCPeer, NRTCSignalServer;

    beforeEach(module("now.rtc", "now.rtcmocks"));

    beforeEach(inject(function (_NRTCPeer_, _NRTCSignalServer_) {
        NRTCPeer = _NRTCPeer_;
        NRTCSignalServer = _NRTCSignalServer_;
    }));

    it("is defined", function() {
        expect(NRTCPeer).toBeDefined();
    })
})