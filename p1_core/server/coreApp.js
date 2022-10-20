fs = require('fs');
glob = require('glob');
UT = require('./ut');
request = require('request')
dbstring = PublishMode ? 'mongodb://10.2.96.3/mydb' : 'mongodb://localhost:27017/mydb';

var dal = require('./dal');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var babel = require('@babel/core');//+need babel-preset-env
var mongo = require('mongodb');
var uglify = require('uglify-es');

UT.Extensions();
App = {};

mongoc = mongo.MongoClient;

var controllers = [];
var vnum = 590;//Math.floor(Math.random() * 1000);
App.VNUM = vnum;
console.log('disabled -- VNUM causes hard-reset-------------------');

MAIN = { html: "", css: "", js: "" };
LANDING = { html: "", css: "", js: "" };
ABOUT = { html: "", css: "", js: "" };

io.on('connection', function (req) {
    req.on('any', function (method, key, args) {

        ANALY.IncomingSocketCalls++;
        ANALY.Info.TotalSocketConnections = io.engine.clientsCount;

        if(key[0]=='f'){ //ignore Connect. Fast
            controllers._each(x => {
                if (x && x[method])
                    x[method](req, dal, key, args, function () { });
            });
        }else{
            dal.Connect(mongoc, dbstring, function () {
                controllers._each(x => {
                    if (x && x[method])
                        x[method](req, dal, key, args, function () { });
                });
            });
        }
    });
});

function PageRequest(req, res, isLanding) {
    PageLoad(req, function (data) {
        var html = "<script>loadData = " + JSON.stringify(data) + ";</script>";
        var buff = (isLanding ? LANDING.buff : MAIN.buff);
        
        //what is buff vs html
        if(buff){
            res.set('Content-Type', 'text/html');
            res.write(buff);
            res.write(html);
            res.end();
        }
        ANALY.PageRequests++;
    });
}

app.use(express.urlencoded({
    extended: true
}))

app.post('/payment1247', function(req,res,test){
    console.log('PAYMENT TRIGGER', req.body);
    App.Discord('payment attempt:', true, '-');
    if (App.OnPayment && dal && req.body && req.body.data)
        App.OnPayment(JSON.parse(req.body.data), dal);
});
app.get('/app', function (req, res) {
    //console.log('app requrest??');
    PageRequest(req, res, false);
});
app.get('/', function (req, res) {
    var isLanding = LANDING.html.length > 0 ? true : false;
    PageRequest(req, res, isLanding);
});

app.get('/about', function (req, res) {
    PageLoad(req, function (data) {
        var html = "<script>loadData = " + JSON.stringify(data) + ";</script>";
        var buff = ABOUT.buff;

        //what is buff vs html
        if (buff) {
            res.set('Content-Type', 'text/html');
            res.write(buff);
            res.write(html);
            res.end();
        }
        ANALY.PageRequests++;
    });
});

server.listen(PORT, '0.0.0.0', function () {

    var readyFunc = function () {
        SiteMapper();
        dal.ObjID = mongo.ObjectID;
        console.log('listening');
        
        if (App.OnLoad)
            App.OnLoad(dal);
        if(PublishMode)
            App.Discord(__dirname + " started.", PublishMode);
    };

    FindDirs(function (dirs) {
        //var hasLanding = dirs._any(x => x == 'p4_landing');
        console.log('hey',dirs);

        var doneCount = 0;

        for (var i = 0; i < dirs.length; i++) {

            var source = MAIN;
            if(dirs[i] == 'p4_landing')
                source = LANDING;
            if(dirs[i] == 'p6_about')
                source = ABOUT;

            CompilePage(dirs[i], dirs, source, function (dir, test) {
                doneCount++;

                //console.log('Compile page end', dir);

                if (dir == 'p4_landing')
                    LANDING = test;
                if (dir == 'p5_app')
                    MAIN = test;
                if (dir == 'p6_about'){
                    ABOUT = test;
                }

                

                if (doneCount == dirs.length-1){

                    WriteCompiled('landing', LANDING, function () {
                        WriteCompiled('about', ABOUT, function(){
                            WriteCompiled('index', MAIN, function () {
                                MAIN.buff = new Buffer.from(MAIN.html);
                                LANDING.buff = new Buffer.from(LANDING.html);
                                ABOUT.buff = new Buffer.from(ABOUT.html);

                                readyFunc();
                            });
                        });
                    });
                }
            });
        }

        /*
        CompilePage('p4_landing', dirs, function () {
            if (hasLanding)
                dirs.splice(dirs.indexOf('p4_landing'), 1);

            WriteCompiled('landing', LANDING, function (data) {
                LANDING = data;
                if (hasLanding) readyFunc();

                for (var i = 0; i < dirs.length; i++) {
                    CompilePage(dirs[i], dirs, function (dir) {
                        if (dir == dirs[dirs.length - 1]) {
                            WriteCompiled('index', MAIN, function () {
                                MAIN.buff = new Buffer.from(MAIN.html);
                                LANDING.buff = new Buffer.from(LANDING.html);
                                //MAIN.html = null;
                                if (!hasLanding) readyFunc();
                            });
                        }
                    });
                }
            });
        });*/
    });
});


if (PublishMode) {
    process.stderr.write = (ch, enc, callback) => {
        if (typeof ch === 'string') {
            App.Discord(ch, PublishMode, 'normal - stderr.write log');
        }
    }
    process.on('uncaughtException', function (err) {
        console.log(((err && err.stack) ? err.stack : err) + " \n FYI: Process exited");
        console.error(((err && err.stack) ? err.stack : err) + " \n FYI: Process exited");
        setTimeout(function () { process.exit(1) }, 500);
    });

    process.on('unhandledRejection', (reason, promise) => {
        App.Discord(reason.toString(), PublishMode, 'normal - unhandled rejection');
    });
}

App.Discord = function (info, alert, context) {
    info = info.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').toString();

    if (alert)
        info += " <@115893129378398210> " + GPATH + " -- " + context;
    request.post(
        'https://discordapp.com/api/webhooks/564328517169446942/hbeTzJ-TsvN4MJsALm4kkOq_aJ7SG4re7EA7DPR_3WAp778f7dOjLYCBdtGqg3OMtUFL',
        { json: { content: info } },
        function (er, resp, body) { }
    );
};

function FindDirs(done) {
    var dirs = [];

    glob(__dirname + '/../../*', function (er, files) {
        files._each(x => {
            var hier = x.split('/');
            var nme = hier[hier.length - 1];

            if (nme.indexOf('.') < 0 && nme.indexOf('node_modules') < 0)
                dirs.push(nme);
        });

        dirs._each(x => {
            app.use('/', express.static(__dirname + '/../../' + x + '/res'));
            controllers.push(require(GPATH + '/' + x + '/server/controller'));
        });
        done(dirs);
    });
}

//Custom Pre Loaded Data per Site
function PageLoad(req, done) {
    var q = req.query;
    done({ PORT, VNUM:vnum });
}

//populate dynamic pages
function SiteMapper() {
}

//compile separate files to single pages
function Compile(location, includeUtil, dir, done) {

    glob(location, function (er, files) {
        var pg = {
            html: "", js: "", css: ""
        };

        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            if (file.indexOf("main.html") > -1){
                pg.html += fs.readFileSync(file, 'utf-8').replace('</html>', '');
                //console.log(pg.html);
            }
            if (file.indexOf(".js") > -1 && file.indexOf('.json') <= -1) {
                var tempjs = fs.readFileSync(file, 'utf-8');
                pg.js += tempjs ? tempjs : "";
            }
            if (file.indexOf(".css") > -1) {
                var tempcss = fs.readFileSync(file, 'utf-8');
                pg.css += tempcss ? tempcss : "";
            }
        }

        if(pg.html.length > 0)
            pg.html += "</html>";
        pg.html = pg.html.replace('_vn_', vnum);
        pg.js = babel.transform(pg.js, { presets: ["@babel/env", "@babel/react"] }).code;

        pg.js = "/* ======== No Steal (>.>) Twelve47Kevin@gmail.com ======== */ \n" + pg.js;



        //console.log('test3', location, pg)
        done(pg, dir);
    });
}

//send to files
function WriteCompiled(filename, targ, done) {
    var api = fs.readFileSync(__dirname + '/api.js', 'utf-8');
    var ut = fs.readFileSync(__dirname + '/ut.js', 'utf-8');
    var util = fs.readFileSync(__dirname + '/util.js', 'utf-8');
    targ.js = api + ut + util + targ.js;

    if (PublishMode) {
        targ.js = uglify.minify(targ.js, {
            mangle: { properties: { regex: /_$/ } }
        }).code;
    }

    fs.writeFile(__dirname + '/../res/' + filename + '.html', targ.html, function () {
        fs.writeFile(__dirname + '/../res/' + filename + '.css', targ.css, function () {
            fs.writeFile(__dirname + '/../res/' + filename + '.js', targ.js, function () {
                console.log(filename + ' compiled');
                targ.js = null;
                targ.css = null;
                done(targ, filename);
            });
        });
    });
}

// Auto creates index.html from main.html.  <web> tags are broken down.
function CompilePage(dir, dirs, targ, done) {
    if (!dirs._any(x => x == dir))
        return done();

    var location = __dirname + "/../../" + dir + "/web/**/*";
    var isLanding = dir == 'p4_landing';
    var includeUtils = dir == 'p1_core' || isLanding;
    //var targ = isLanding ? LANDING : MAIN;


    Compile(location, includeUtils, dir, function (page, name) {
        targ.html += page.html;
        targ.css += page.css;
        targ.js += page.js;
        done(dir, targ);
    });
}