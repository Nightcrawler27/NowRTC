angular.module("now.rtc").factory("ICETransport", function() {
    'use strict';

    function ICETransportFB(url) {
        this.socket = io.connect(url);
    }

    ICETransportFB.prototype = {
        root : '',
        fb: null,
        sessionID: null,
        signalProcessors: null,

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
            console.log("watch for ice candidates", type);
            this.socket.on("ice_candidate", function(item) {
                if(item.key === key) {
                    console.log("remote ice candidate");
                    callback(new RTCIceCandidate(item));
                }
            });
        },

        close: function() {
            var self = this;
            Object.keys(this.signalProcessors).forEach(function (name) {
                var t = self.get(name);
                t.off('value', self.signalProcessors[name]);
            });

            Firebase.goOffline();
            this.signalProcessors = {};
        },

        reset: function() {
            this.fb.remove();
        },

        send: function(name, data) {
            console.log("send!");
            var o = $.extend({}, data);
            // remove functions
            Object.keys(o).forEach(function (name) {
                if (typeof o[name] !== 'function')
                    return;

                delete o[name];
            });
            o.sessionID = this.sessionID;
            o.time = new Date().valueOf();
            var d = {};
            d[name] = o;
            this.fb.update(d);
        },

        toString : function() {
            return this.root;
        }
    };

    return ICETransportFB;
});