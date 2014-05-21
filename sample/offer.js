var Q = require("q");
exports.fromRequestData = function(data) {
    var deferredResponse = Q.defer();

    return {
        data: data,
        getResponsePromise: function() {
            return deferredResponse.promise;
        },
        setResponse: function(response) {
            deferredResponse.resolve(response);
        }
    };
};