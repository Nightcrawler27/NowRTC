angular.module("now.rtc").directive("nrtcVideo", function() {
    return {
        restrict: "E",
        replace: true,
        scope: {
            stream: "="
        },
        template: "<video autoplay />",
        link: function(scope, element) {
            scope.$watch("stream", function() {
                if(!scope.stream)
                    return;
                console.log("stream changed");
                attachMediaStream(element[0], scope.stream)
            })
        }
    }
});