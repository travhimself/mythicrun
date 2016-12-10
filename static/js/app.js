angular.module('mythicrunapp', []).controller('mythicruncontroller', ['$scope', '$http', function($scope, $http) {

    // alias controller
    var mrcontrol = this;


    // import data
    $http.get('/js/data.json').
        success( function (data) {
            window.regions = data.regions;
            window.servers = data.servers;
            window.dungeons = data.dungeons;

            $scope.regions = data.regions;
            $scope.servers = data.servers;
            $scope.dungeons = data.dungeons;
        });


    // cache selectors
    mrcontrol.$body = angular.element(document).find('body');


    // fetch data based on user selections
    $scope.inputformdata = {
        region: 'all',
        // week: 'current',
        dungeon: 'all',
        faction: 'both',
        limit: '10'
    };

    $scope.$watch("inputformdata", function(){

        $http.get('/run/' + $scope.inputformdata.region + '/' + $scope.inputformdata.dungeon + '/' + $scope.inputformdata.faction + '/' + $scope.inputformdata.limit).
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

.filter('regionname', ['$filter', function($filter) {

    // return the full region name from a region abbreviation
    return function(input) {

        var region = $filter('filter')(window.regions, {abbr: input}, true);
        return region[0].name;

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
}]);
