angular.module("now.rtc").factory("NRTCPeerConnection", function($q) {
    "use strict";

    function NRTCPeerConnection(configuration) {
        this.peerConnection = new RTCPeerConnection(configuration);
        this.peerConnection.onsignalingstatechange = function(evt) {
            console.log("signaling state changed", evt)
        };
        this.peerConnection.onstatechange = function(evt) {
            console.log("state changed", evt)
        };
        this.waitForRemoteDescription = $q.defer();

        console.log(this.peerConnection);
    }

    NRTCPeerConnection.prototype = {
        createOffer: function(constraints) {
            var deferred = $q.defer();

            this.peerConnection.createOffer(function(connectionDesc) {
                deferred.resolve(connectionDesc);
            }, function(error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },

        createAnswer: function() {
            var deferred = $q.defer();
            this.peerConnection.createAnswer(function(answer) {
                deferred.resolve(answer);
            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        },

        createDataChannel: function(stuff) {
            return this.peerConnection.createDataChannel(stuff)
        },

        addIceCandidate: function(candidate) {
            var that = this;
            this.waitForRemoteDescription.promise.then(function() {
                that.peerConnection.addIceCandidate(candidate);
            })
        },

        setRemoteDescription: function(offer) {
            console.log(offer);
            var that = this;
            var deferred = $q.defer();
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer), function() {
                console.log("remote description set");
                that.waitForRemoteDescription.resolve();
                deferred.resolve();
            }, function(error) {
                console.log("Error: ", error);
                deferred.reject(error);
            });
            return deferred.promise;
        },

        setLocalDescription: function(description) {
            var deferred = $q.defer();
            this.peerConnection.setLocalDescription(description, function() {
                deferred.resolve(description);
            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        },

        addStream: function(stream) {
            this.peerConnection.addStream(stream)
        },

        bind: function(event, fn) {
            this.peerConnection[event] = fn;
        },

        trigger: function(event, data) {
            var fn = this.peerConnection[event];
            console.log("triggering ", fn);
            if(fn)
                fn(data);
        },

        close: function() {
            console.log("closing peer connection");
            this.peerConnection.close();
        }
    };

    return NRTCPeerConnection;
});