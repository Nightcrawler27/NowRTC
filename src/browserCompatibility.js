/* global webrtcDetectedBrowser, webrtcDetectedVersion, getUserMedia */
angular.module("now.rtc").factory("browserCompatibility", function() {
    "use strict";

    return {
        isSupported: function() {
            if (!getUserMedia)
                return false;

            if (this.isFirefox() === webrtcDetectedBrowser && webrtcDetectedVersion < 26)
                return false;

            if (this.isChrome() && webrtcDetectedVersion < 31)
                return false;

            return true;
        },

        isChrome: function() {
            return "chrome" === webrtcDetectedBrowser;
        },

        isFirefox: function() {
            return "firefox" === webrtcDetectedBrowser;
        },

        isScreenSharingSupported: function() {
            return (this.isChrome() && webrtcDetectedVersion > 31 && window.location.protocol === 'https:');
        }
    }
})