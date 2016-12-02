angular.module('mythicrunapp', []).controller('mythicruncontroller', ['$scope', '$http', function($scope, $http) {

    // alias controller
    var mrcontrol = this;


    // import data
    $http.get('/js/data.json').
        success( function (data) {
            window.server = data.servers;
            window.dungeons = data.dungeons;

            $scope.servers = data.servers;
            $scope.dungeons = data.dungeons;
        });


    // cache selectors
    mrcontrol.$body = angular.element(document).find('body');


    // fetch data based on user selections
    $scope.inputformdata = {
        dungeon: 'all',
        server: 'all'
    };

    $scope.$watch("inputformdata", function(){

        $http.get('/run/' + $scope.inputformdata.dungeon + '/' + $scope.inputformdata.server).
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

.filter('friendlytime', ['$filter', function($filter) {

    // return the time in min:sec from milliseconds
    return function(input) {

        var duration = moment.duration(input);
        var minutes = duration.minutes();
        var seconds = duration.seconds();

        if ( seconds < 10 ) {
            seconds = '0' + seconds;
        }

        return minutes + ':' + seconds;

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
