// settings
// tune interval and grace period to preference, and to avoid potential throttling or IP bans
// with current settings, the scrape routine will run every 4 hours, and each loop will take ~3 hours
var s = {
    nodeport: 4001,
    routeoptions: {
        root: __dirname + '/static/views/',
        dotfiles: 'ignore'
    },
    scrapeinterval: 43200000 // 12 hours
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
    url: String,
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
    tankarmorylink: String,
    healername: String,
    healerclass: String,
    healerarmorylink: String,
    dps1name: String,
    dps1class: String,
    dps1armorylink: String,
    dps2name: String,
    dps2class: String,
    dps2armorylink: String,
    dps3name: String,
    dps3class: String,
    dps3armorylink: String
});


// start server
var nodeserver = expressapp.listen(s.nodeport, function() {

    // fire it up
    var host = nodeserver.address().address;
    var port = nodeserver.address().port;
    console.log('Listening on port %s...', port);


    // build array of server/dungeon combination pages to scrape
    var combinations = [];

    for (var x = 0, xlen = data.dungeons.length; x < xlen; x++ ) {

        for (var y = 0, ylen = data.servers.length; y < ylen; y++ ) {

            for (var z = 0, zlen = data.servers[y].regions.length; z < zlen; z++ ) {

                var currentdungeon = data.dungeons[x].slug;
                var currentserver = data.servers[y].slug;
                var currentregion = data.servers[y].regions[z];

                var currentregionslug = '';
                switch(currentregion) {
                    case 'AM':
                        currentregionslug = 'en-us';
                        break;
                    case 'EU':
                        currentregionslug = 'en-gb';
                        break;
                    case 'KO':
                        currentregionslug = 'ko-kr';
                        break;
                    case 'TW':
                        currentregionslug = 'zh-tw';
                        break;
                    default:
                        currentregionslug = '';
                }

                var url = 'https://worldofwarcraft.com/' + currentregionslug + '/game/pve/leaderboards/' + currentserver + '/' + currentdungeon;

                var entry = [url, currentregion, currentdungeon]

                // console.log(entry);
                combinations.push(entry);
            }
        }
    }


    // iterate over combination entries and scrape data
    // looper() courtesy of: https://gist.github.com/coryshaw/80fc7d49091ff88bb56e903a1746a999
    var scrapepages = function () {

        console.log('beginning page scraping...');

        var looper = function (item) {

        	if (item) {

                request(item[0], function(error, response, html) {

                    console.log('scraping: ' + item[0]);

                    if ( !error && response.statusCode == 200 ) {

                        // scrape page
                        var $ = cheerio.load(html);
                        var $dungeonresults = $('.Pane-content .SortTable-body .SortTable-row');

                        $dungeonresults.each( function(i) {

                            var mlevelint = parseInt( $(this).find('> div:nth-child(2)').text() );
                            var timestring = $(this).find('> div:nth-child(3)').attr('data-value');
                            var completedstring = $(this).find('> div:nth-child(5)').attr('data-value');

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
                                var tankarmorylinkstring = $tank.attr('href');
                            }

                            var $healer = $party.find('.List-item:nth-child(2) a');
                            if ($healer.length > 0) {
                                var healernamestring = $healer.text();
                                var healerclassstring = getcharclass($healer);
                                var healerarmorylinkstring = $tank.attr('href');
                            }

                            var $dps1 = $party.find('.List-item:nth-child(3) a');
                            if ($dps1.length > 0) {
                                var dps1namestring = $dps1.text();
                                var dps1classstring = getcharclass($dps1);
                                var dps1armorylinkstring = $tank.attr('href');
                            }

                            var $dps2 = $party.find('.List-item:nth-child(4) a');
                            if ($dps2.length > 0) {
                                var dps2namestring = $dps2.text();
                                var dps2classstring = getcharclass($dps2);
                                var dps2armorylinkstring = $tank.attr('href');
                            }

                            var $dps3 = $party.find('.List-item:nth-child(5) a');
                            if ($dps3.length > 0) {
                                var dps3namestring = $dps3.text();
                                var dps3classstring = getcharclass($dps3);
                                var dps3armorylinkstring = $tank.attr('href');
                            }

                            var newrun = new run({
                                url: item[0],
                                region: item[1],
                                dungeon: item[2],
                                affix1: affix1string,
                                affix2: affix2string,
                                affix3: affix3string,
                                mlevel: mlevelint,
                                time: timestring,
                                completed: completedstring,
                                faction: factionstring,
                                tankname: tanknamestring,
                                tankclass: tankclassstring,
                                tankarmorylink: tankarmorylinkstring,
                                healername: healernamestring,
                                healerclass: healerclassstring,
                                healerarmorylink: healerarmorylinkstring,
                                dps1name: dps1namestring,
                                dps1class: dps1classstring,
                                dps1armorylink: dps1armorylinkstring,
                                dps2name: dps2namestring,
                                dps2class: dps2classstring,
                                dps2armorylink: dps2armorylinkstring,
                                dps3name: dps3namestring,
                                dps3class: dps3classstring,
                                dps3armorylink: dps3armorylinkstring
                            });

                            checkandsave(newrun);

                        });

                        // continue iterating
                        looper(combinations.shift());

                    } else {

                        // if there's an error, log it and continue on
                        console.log('error scraping page: ' + error);
                        looper(combinations.shift());
                    }
                });

        	} else {
                console.log('page scraping complete')
            }
        };

        // kick off the looper
        looper(combinations.shift());
    };


    // uncomment if we want to run a scrape immediately when server starts
    // scrapepages();


    // scrape every x ms
    setInterval( function () {
        // uncomment for production
        // scrapepages();
    }, s.scrapeinterval);


    // check an entry against existing db docs, and save if it's new
    var checkandsave = function(newrun) {

        run.find({
            mlevel: newrun.mlevel,
            dungeon: newrun.dungeon,
            time: newrun.time,
            completed: newrun.completed,
            tankname: newrun.tankname
        }, function (err, runs) {
            if ( runs.length > 0 ) {
                // console.log('found existing entry, skipping...')
            } else {
                newrun.save(function (err) {
                    if (err) {
                        console.log('error saving run: ' + err);
                    } else {
                        // console.log('run saved');
                    }
                });
            }
        });
    };


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
expressapp.get('/run/:region/:dungeon/:faction/:limit', function (req, res) {

    var resultslimit = parseInt(req.params.limit);
    var findobject = {};

    if ( req.params.region != 'all' ) {
        findobject.region = req.params.region;
    }

    if ( req.params.dungeon != 'all' ) {
        findobject.dungeon = req.params.dungeon;
    }

    if ( req.params.faction != 'both' ) {
        findobject.faction = req.params.faction;
    }

    run.find(findobject, function (err, runs) {
        res.type('json');
        res.send(runs);
    })
    .sort({
        mlevel: -1,
        time: 1
    })
    .limit(resultslimit);

});

expressapp.get('/*', function(req, res) {
    res.sendFile('index.html', s.routeoptions);
});
