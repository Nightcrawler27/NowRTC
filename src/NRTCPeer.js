angular.module("now.rtc").factory("NRTCPeer", function($rootScope, $q, NRTCPeerConnection, RTCIceCandidate, RTCSessionDescription) {
    "use strict";

    function onError(error) {
        throw error;
    }

    function NRTCPeer(signalChannel, config, constraints) {
        this.config = config;
        this.signalChannel = signalChannel;
        this.messages = [];
        this.constraints = angular.extend({
            optional : [],
            mandatory : {
                OfferToReceiveAudio : true,
                OfferToReceiveVideo : true
            }
        }, constraints);
        this.offer = $q.defer();
    }

    NRTCPeer.prototype = {
        initiate: function(streams) {
            var that = this;
            this.initiator = true;
            this._setup();

            angular.forEach(streams, function(stream) {
                that.peerConnection.addStream(stream);
            });

            this.dataChannel = this.peerConnection.createDataChannel("chat");
            return this.offer.promise;
        },

        send: function(message) {
            this.dataChannel.send(message)
        },

        setResponse: function(response) {
            this.peerConnection.setRemoteDescription(response, onError);
        },

        addStream: function(stream) {
            if(this.peerConnection) {
                this.offer = $q.defer();
                this.peerConnection.addStream(stream);
                return this.offer.promise;
            } else {
                return this.initiate([stream]);
            }
        },

        fromOffer: function(offer) {
            this.offer = $q.defer();
            this.key = offer.key;
            if(!this.peerConnection) {
                this._setup();
                this._watchForICE();
                this.peerConnection.bind("ondatachannel", $.proxy(function (evt) {
                    this.dataChannel = new RTCDataChannel(evt.channel);
                }, this));
            }

            var sessionDescription = new RTCSessionDescription(offer.data);
            this.key = offer.key;
            this.peerConnection.setRemoteDescription(sessionDescription).then($.proxy(this._respondToOffer, this), onError);

            return this.offer.promise;
        },

        _setup: function() {
            if(this.peerConnection)
                this.peerConnection.close();

            this.connecting = true;
            this._createPeerConnection();
        },

        _watchForICE: function() {
            var that = this;
            this.signalChannel.onCandidate(this.key, this.initiator ? "receiver" : "initiator", function(candidate) {
                console.log("remote iceCandidate", candidate);
                that.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            })
        },

        _createOffer: function() {
            var that = this;
            this.key = new Date().getTime();
            this.key += ("-" + parseInt(Math.random() * 100000000));

            this.peerConnection.createOffer(this.constraints).then(function(offer) {
                that._setLocalDescription(offer).then(function() {
                    that._watchForICE();
                    that.offer.resolve({
                        offer: offer,
                        key: that.key
                    });
                }, onError);
            }, onError);
        },

        _respondToOffer: function() {
            var that = this;
            this.peerConnection.createAnswer().then(function(answer) {
                that._setLocalDescription(answer).then(function(offer) {
                    that.offer.resolve(offer)
                }, onError);
            }, onError);
        },

        _setLocalDescription: function(answer) {
            return this.peerConnection.setLocalDescription(new RTCSessionDescription(answer));
        },

        leave: function() {

        },

        onMessage: function() {
        },

        isConnected: function() {
            return this.connected || this.connecting
        },

        _createPeerConnection: function() {
            var that = this;
            var peerConnection = new NRTCPeerConnection(this.config);

            peerConnection.bind("onicecandidate", function(event) {
                console.log("local ice candidate");
                if (!event.candidate)
                    return;

                that.signalChannel.addCandidate(that.key, that.initiator ? "initiator" : "receiver", event.candidate);
            });

            peerConnection.bind("onnegotiationneeded", $.proxy(this._createOffer, this));
            peerConnection.bind("oniceconnectionstatechange", function(evt) {
                console.log("iceConnectionStateChange");
                $rootScope.$apply(function() {
                    var connectionState = evt.target.iceConnectionState;
                    console.log('>>> IceConnectionStateChanged to ' + connectionState);
                    that.connected = connectionState === 'connected' || connectionState === 'completed';
                    if (that.connected) {
                        that.connecting = false;
                    }
                })
            });

            // useless stuff - looks like you gotta reconnect
            /*peerConnection.bind("onsignalingstatechange", function(a, b, c) {
             console.log("stateChange", a, b, c)
             });*/
            /*
             peerConnection.bind("onstatechange", function(a, b, c) {
             console.log("stateChange", a, b, c)
             });*/
            peerConnection.bind("onaddstream", function(newStream, b, c) {
                console.log("new stream", newStream, b, c);
                if(that.onStream)
                    that.onStream(newStream);
            });
            this.peerConnection = peerConnection;
        }
    };

    return NRTCPeer;
});