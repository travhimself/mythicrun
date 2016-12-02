// settings
var s = {
    nodeport: 4001,
    routeoptions: {
        root: __dirname + '/static/views/',
        dotfiles: 'ignore'
    },
    scrapeinterval: 14400000, // time between data grabs, 4 hours
    scrapegraceperiod: 3000, // time between each scrape in a data grab, 3 seconds
    baseurl: 'https://worldofwarcraft.com/en-us/game/pve/leaderboards/'
};


// include modules and start app
var https = require('https');
var express = require('express');
var request = require('request');
var mongoose = require('mongoose');
var cheerio = require('cheerio');
var expressapp = express();
var server = https.Server(expressapp);


// static server and dungeon data
var data = require('./static/js/data.json');


// db connection and models
mongoose.connect('mongodb://localhost/data');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    // do something
});

var run = mongoose.model('run', {
    server: String,
    region: String,
    dungeon: String,
    affix1: String,
    affix2: String,
    affix3: String,
    mlevel: Number,
    time: Number,
    completed: Date,
    faction: String,
    tankname: String,
    tankclass: String,
    healername: String,
    healerclass: String,
    dps1name: String,
    dps1class: String,
    dps2name: String,
    dps2class: String,
    dps3name: String,
    dps3class: String
});


// start server
var nodeserver = expressapp.listen(s.nodeport, function() {

    // fire it up
    var host = nodeserver.address().address;
    var port = nodeserver.address().port;
    console.log('Listening on port %s...', port);


    // build array of server/dungeon combination pages to scrape
    var combinations = [];

    for (var x = 0, xlen = data.servers.length; x < xlen; x++ ) {

        for (var z = 0, zlen = data.dungeons.length; z < zlen; z++ ) {
            var currentserver = data.servers[x].slug;
            var currentserverregion = data.servers[x].region;
            var currentdungeon = data.dungeons[z].slug;
            var url = s.baseurl + currentserver + '/' + currentdungeon;

            var entry = [url, currentserver, currentserverregion, currentdungeon];
            combinations.push(entry);
        }
    }


    // iterate over combination entries and scrape data
    // looper() courtesy of: https://gist.github.com/coryshaw/80fc7d49091ff88bb56e903a1746a999
    var scrapepages = function () {

        console.log('beginning page scraping...');

        var looper = function (item) {

        	if (item) {

                request(item[0], function(error, response, html) {

                    if ( !error && response.statusCode == 200 ) {

                        // scrape page
                        var $ = cheerio.load(html);

                        var $dungeonresults = $('.Pane-content .SortTable-body .SortTable-row');

                        $dungeonresults.each( function(i) {

                            var mlevelint = parseInt( $(this).find('> div:nth-child(2)').text() );
                            var timestring = $(this).find('> div:nth-child(3)').attr('data-value');
                            var completedstring = $(this).find('> div:nth-child(5)').text();

                            var $affixes = $('.Box--leather > div > .List > .List-item:nth-child(2) > .List > .List-item:nth-child(2) > .List > .List-item');
                            var affix1string = $affixes.find('.List-item:nth-child(1) .List-item').text();
                            var affix2string = $affixes.find('.List-item:nth-child(2) .List-item').text();
                            var affix3string = $affixes.find('.List-item:nth-child(3) .List-item').text();

                            var $party = $(this).find('div:nth-child(4)');
                            var factionstring = $party.attr('data-value');

                            var $tank = $party.find('.List-item:nth-child(1) a');
                            if ($tank.length > 0) {
                                var tanknamestring = $tank.text();
                                var tankclassstring = getcharclass($tank);
                            }

                            var $healer = $party.find('.List-item:nth-child(2) a');
                            if ($healer.length > 0) {
                                var healernamestring = $healer.text();
                                var healerclassstring = getcharclass($healer);
                            }

                            var $dps1 = $party.find('.List-item:nth-child(3) a');
                            if ($dps1.length > 0) {
                                var dps1namestring = $dps1.text();
                                var dps1classstring = getcharclass($dps1);
                            }

                            var $dps2 = $party.find('.List-item:nth-child(4) a');
                            if ($dps2.length > 0) {
                                var dps2namestring = $dps2.text();
                                var dps2classstring = getcharclass($dps2);
                            }

                            var $dps3 = $party.find('.List-item:nth-child(5) a');
                            if ($dps3.length > 0) {
                                var dps3namestring = $dps3.text();
                                var dps3classstring = getcharclass($dps3);
                            }

                            var newrun = new run({
                                server: item[1],
                                region: item[2],
                                dungeon: item[3],
                                affix1: affix1string,
                                affix2: affix2string,
                                affix3: affix3string,
                                mlevel: mlevelint,
                                time: timestring,
                                completed: completedstring,
                                faction: factionstring,
                                tankname: tanknamestring,
                                tankclass: tankclassstring,
                                healername: healernamestring,
                                healerclass: healerclassstring,
                                dps1name: dps1namestring,
                                dps1class: dps1classstring,
                                dps2name: dps2namestring,
                                dps2class: dps2classstring,
                                dps3name: dps3namestring,
                                dps3class: dps3classstring
                            });

                            // console.log(newrun);

                            newrun.save(function (err) {
                                if (err) {
                                    console.log('run not saved: ' + err);
                                } else {
                                    // console.log('run saved');
                                }
                            });

                        });

                        // continue iterating
            			looper(combinations.shift());

                    } else {
                        console.log(error);
                    }
                });

        	} else {
                console.log('page scraping complete.')
            }
        };

        looper(combinations.shift());
    };


    // uncomment if we want to run a scrape immediately when server starts
    // scrapepages();


    // scrape every x ms
    setTimeout( function () {
        // uncomment for production
        // scrapepages();
    }, s.scrapeinterval);


    // function to grab character class from css class
    var getcharclass = function (charelement) {
        var charclass = charelement.attr('class').split(/\s+/)[2];
        charclass = charclass.substring(11, charclass.length+1).toLowerCase();
        return charclass;
    };

});


// set directory for static files with express.static middleware
expressapp.use(express.static('static'));


// routes
expressapp.get('/run/:dungeon/:server', function (req, res) {

    var findobject = {};

    if ( req.params.dungeon != 'all' ) {
        findobject.dungeon = req.params.dungeon;
    }

    if ( req.params.server != 'all' ) {
        findobject.server = req.params.server;
    }

    run.find(findobject, function (err, runs) {
        res.type('json');
        res.send(runs);
    })
    .sort({
        mlevel: -1,
        time: 1
    })
    .limit(10);

});

expressapp.get('/*', function(req, res) {
    res.sendFile('index.html', s.routeoptions);
});
