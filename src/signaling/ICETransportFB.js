angular.module("now.rtc").factory("ICETransport", function() {
    'use strict';

    function ICETransportFB(url, sessionID) {
        this.sessionID = sessionID;
        this.fb = new Firebase(url);
        Firebase.goOnline();
        this.fb.child(this.sessionID);
    }

    ICETransportFB.prototype = {
        root : '',
        fb: null,
        sessionID: null,
        signalProcessors: null,

        addCandidate: function(key, type, candidate) {
            if(!key) {
                console.log("Invalid key: " + key);
                throw "invalid key";
            }

            this.fb.child(key + "/ice/" + type).push({
                type : 'candidate',
                label : candidate.sdpMLineIndex,
                id : candidate.sdpMid,
                candidate : candidate.candidate
            })
        },

        onCandidate: function(key, type, callback) {
            console.log("watch for ice candidates", type);
            this.fb.child(key + "/ice/" + type).on("child_added", function(item) {
                callback(new RTCIceCandidate(item.val()));
            });
        },

        listen: function(key, listener) {
            console.log("setting up request listener");
            this.fb.child(key + "/requests").on("child_added", listener);
        },

        onAnswer: function(key, handler) {
            console.log("setting up response handler for", key);
            this.fb.child(key + "/responses").on("child_added", handler);
        },

        respond: function(key, response) {
            console.log("responding to offer for ", key);
            this.fb.child(key + "/responses").push(response)
        },

        _watch: function(name, fn) {
            if (this.signalProcessors[name])
                return;

            var t = this.get(name);
            t.on('value', fn);
            this.signalProcessors[name] = fn;
        },

        _get: function(name) {
            return this.fb.child(name);
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