angular.module('mythicrunapp', []).controller('mythicruncontroller', ['$scope', '$http', function($scope, $http) {

    // alias controller
    var mrcontrol = this;


    // import data
    $http.get('/js/data.json').
        success( function (data) {
            window.servers = data.servers;
            window.dungeons = data.dungeons;

            $scope.servers = data.servers;
            $scope.dungeons = data.dungeons;
        });


    // cache selectors
    mrcontrol.$body = angular.element(document).find('body');


    // fetch data based on user selections
    $scope.inputformdata = {
        dungeon: 'all',
        server: 'all',
        limit: '25',
        week: 'current'
    };

    $scope.$watch("inputformdata", function(){

        $http.get('/run/' + $scope.inputformdata.dungeon + '/' + $scope.inputformdata.server + '/' + $scope.inputformdata.limit).
            success( function (data, status, headers, config) {
                $scope.runs = data;
            }).
            error( function(data, status, headers, config) {
                console.log('error fetching data');
            });

    }, true);

}])

.filter('dungeonname', ['$filter', function($filter) {

    // return the human readable name from a dungeon slug
    return function(input) {

        var dungeon = $filter('filter')(window.dungeons, {slug: input}, true);
        return dungeon[0].name;

    };
}])

.filter('servername', ['$filter', function($filter) {

    // return the human readable name from a server slug
    return function(input) {

        var server = $filter('filter')(window.servers, {slug: input}, true);
        return server[0].name;

    };
}])

.filter('friendlytime', ['$sce', function($sce) {

    // return the time in min:sec from milliseconds
    return function(input) {

        var duration = moment.utc(input).format('HH:mm:ss.SSS');
        var durtationchunks = duration.split('.');

        var timestring = durtationchunks[0] + '<span>.' + durtationchunks[1] + '</span>';

        return $sce.trustAsHtml(timestring);

    };
}])

.directive('dostuff', function() {

    return {
        restrict: 'A',
        templateUrl: '/partials/something.html',
        replace: true,
        link: function(scope, element, attrs) {

            // do stuff

        }
    };
});
