angular.module("now.rtc").directive("nrtcVideo", function() {
    return {
        restrict: "E",
        replace: true,
        scope: {
            stream: "="
        },
        template: "<div class='video-wrapper'><video autoplay /></div>",
        link: function(scope, element) {
            var video = element.find("video").eq(0);
            video.css({
                "max-width": "100%",
                "max-height": "100%"
            });

            scope.$watch("stream", function() {
                if(!scope.stream)
                    return;
                console.log("stream changed");
                attachMediaStream(video[0], scope.stream)
            })
        }
    }
});