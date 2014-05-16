angular.module("now.rtc", []);
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
angular.module("now.rtc").factory("OfferTransport", function($q, RTCOffer) {
    "use strict";

    function NRTCRequestTransportFB(url, sessionID) {
        this.sessionID = sessionID;
        this.fb = new Firebase(url);
        Firebase.goOnline();
    }

    NRTCRequestTransportFB.prototype = {
        initiate: function(configuration) {
            var deferred = $q.defer();

            var requestRef = this.fb.child(configuration.targetUser + "/offers").push({
                initiator: configuration.initiator,
                data: configuration.localDescription,
                key: configuration.key
            });

            requestRef.child("state").on("value", function(value) {
                if (value && value.val() === "accepted") {
                    requestRef.child("response").once("value", function(data) {
                        configuration.remoteDescription = new RTCSessionDescription(data.val());
                        deferred.resolve(configuration);
                    })
                } else if (value && value.val() === "rejected") {
                    deferred.reject();
                }
            });

            return deferred.promise;
        },

        listen: function(listener) {
            this.fb.child(this.sessionID + "/offers").on("child_added", function(offer) {
                //Already accepted or rejected... should probably set to 'unanswered' until accepted or rejected.
                if(offer.val().state)
                    return;

                listener(new RTCOffer(offer))
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
        }
    };

    return NRTCRequestTransportFB;
});
/* globals Firebase */
angular.module("now.rtc").factory("RTCOffer", function() {
    "use strict";

    function RTCOfferFB(snapshot) {
        this.ref = snapshot.ref();
        this.value = snapshot.val();
    }

    RTCOfferFB.prototype = {
        accept: function(response) {
            if(this.value.state)
                throw "Request has already been " + this.value.state;

            this.value.state = "accepted";
            this.ref.update({
                response: response,
                state: "accepted"
            });
        },

        reject: function() {
            if(this.value.state)
                throw "Request has already been " + this.value.state;

            this.value.state = "rejected";
            this.ref.update({
                state: "rejected"
            });
        },

        isValid: function() {
            return !!this.value.state;
        }
    };

    return RTCOfferFB;
})
angular.module("now.rtc").factory("NRTCDataChannel", function() {
    function NRTCDataChannel(dataChannel) {
        this.dataChannel = dataChannel;
    }

    NRTCDataChannel.prototype = {
        bind: function(event, callback) {
            this.dataChannel[event] = callback;
        },

        send: function(message) {
            this.dataChannel.send(message);
        }
    }

    return NRTCDataChannel;
})
angular.module("now.rtc").factory("NRTCIceCandidate", function() {
    return RTCIceCandidate;
});
angular.module("now.rtc").factory("NRTCPeer", function($rootScope, $q) {
    "use strict";
    function NRTCPeer(peerConnection, constraints) {
        this.peerConnection = peerConnection;
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
        send: function(message) {
            this.dataChannel.send(message)
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

        createDataChannel: function() {
            var dataChannel = this.peerConnection.createDataChannel("chat");
            dataChannel.onopen = function(evt) { console.log("opening channel", evt); };
            dataChannel.onclose = function() { console.log("channel closing") };
            dataChannel.onerror = function(event) { console.log("channel error:", event); };
            dataChannel.onmessage = function(event) { $rootScope.$apply(function() {})};
            return dataChannel;
        },

        isConnected: function() {
            return this.connected || this.connecting
        }
    };

    return NRTCPeer;
});
angular.module("now.rtc").factory("NRTCPeerActions", function($q, NRTCSessionDescription) {
    function createOffer(data) {
        return defer(data, "createOffer", function(data, connectionDesc) {
            data.localDescription = connectionDesc;
        });
    }

    function createAnswer(data) {
        return defer(data, "createAnswer", function(data, answer) {
            data.localDescription = new NRTCSessionDescription(answer);
        });
    }

    function setRemoteDescription(data) {
        return defer(data, "setRemoteDescription", angular.noop, "remoteDescription");
    }

    function setLocalDescription(data) {
        return defer(data, "setLocalDescription", angular.noop, "localDescription");
    }

    function defer(data, methodName, callback, dataMember) {
        var deferred = $q.defer();
        var errorHandler = deferred.reject.bind(deferred);
        var fnArgs = [wrappedCallback, errorHandler];

        if(dataMember)
            fnArgs.unshift(data[dataMember]);

        data.peerConnection.trigger(methodName, fnArgs);

        function wrappedCallback(answer) {
            callback(data, answer);
            deferred.resolve(data);
        }

        return deferred.promise;
    }

    function acceptRemoteOffer(data){
        data.offer.accept(data.localDescription);
        return data;
    }

    function setupICEWatcher(peerConfiguration) {
        var type = peerConfiguration.initiator ? "receiver" : "initiator";
        var callback = peerConfiguration.peerConnection.addIceCandidate.bind(peerConfiguration.peerConnection);
        peerConfiguration.iceChannel.onCandidate(peerConfiguration.key, type, callback)
    }

    function onError(error) {
        console.log(error);
    }

    return {
        initiate: setupICEWatcher,

        renegotiate: function(peerConfiguration) {
            var initiateOffer = peerConfiguration.offerChannel.initiate.bind(peerConfiguration.offerChannel);
            return createOffer(peerConfiguration)
                .then(setLocalDescription)
                .then(initiateOffer)
                .then(setRemoteDescription)
                .then(null, onError);
        },

        receive: function(peerConfiguration) {
            return setRemoteDescription(peerConfiguration)
                .then(createAnswer)
                .then(setLocalDescription)
                .then(acceptRemoteOffer)
                .then(setupICEWatcher)
                .then(null, onError);
        }
    }
});
angular.module("now.rtc").factory("NRTCPeerConnection", function() {
    "use strict";

    function NRTCPeerConnection(configuration) {
        console.log("creating peer connection");
        this.peerConnection = new RTCPeerConnection(configuration);
    }

    NRTCPeerConnection.prototype = {
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
                fn.apply(this.peerConnection, data);
        },

        addIceCandidate: function(candidate) {
            this.peerConnection.addIceCandidate(candidate);
        },

        createDataChannel: function(name) {
            return this.peerConnection.createDataChannel(name);
        },

        close: function() {
            console.log("closing peer connection");
            this.peerConnection.close();
        },

        getSignalingState: function() {
            return this.peerConnection.signalingState;
        },

        getIceGatheringState: function() {
            return this.peerConnection.iceGatheringState;
        }
    };

    return NRTCPeerConnection;
});
angular.module("now.rtc").factory("NRTCPeerConnectionBindings", function(NRTCDataChannel, NRTCPeerActions) {
    return {
        bind: function (payload) {
            payload.peerConnection.bind("onsignalingstatechange", function (event) {
                console.log("signaling state changed", event)
            });

            payload.peerConnection.bind("onstatechange", function(event) {
                console.log("state changed", event)
            });

            payload.peerConnection.bind("onicecandidate", function (event) {
                console.log("local ice candidate");
                if (!event.candidate)
                    return;

                payload.iceChannel.addCandidate(payload.key, payload.initiator ? "initiator" : "receiver", event.candidate);
            });

            payload.peerConnection.bind("ondatachannel", function (event) {
                console.log("data channel");
                var channel = new NRTCDataChannel(event.channel);

                channel.bind("onmessage", function (a, b, c) {
                    console.log(a, b, c)
                });
            });

            payload.peerConnection.bind("oniceconnectionstatechange", function (event) {
                console.log("iceConnectionStateChange");
                console.log('>>> IceConnectionStateChanged to ' + event.target.iceConnectionState);
            });

            //angular.extend(payload.peerConnection, actions);

            payload.peerConnection.bind("onnegotiationneeded", function () {
                NRTCPeerActions.renegotiate(payload);
            });
        }
    }
});
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
angular.module("now.rtc").factory("NRTCSessionDescription", function() {
    return RTCSessionDescription;
});