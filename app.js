
API = require('./p1_core/server/api');
io = require('socket.io-client');
PORT = process.env.PORT ? process.env.PORT : 3001;
GPATH = __dirname;
PublishMode = true;
APP = { servers: {}, apps: [], appTypes: [], maxApp: 3101, appsReady: false, flags: new Map() };
PORT = PublishMode ? PORT : 3100;

ANALY = require('./p1_core/server/analy');
shortId = require('shortid');
cp = require("child_process");

setTimeout(function(){ Init(); },50);

//HOW TO ADD NEW APP
/*
    - add app type below
    - Get a photo + GIF
    - add component in xApp
    - create new component folder for the app
*/

var Init = function(){
    require('./p1_core/server/coreApp');
    console.log(PORT);
    APP.cid = PublishMode ? '2dfbw32sgjazyxqscqxan685ykxkc9' : '6l9nxl6qnrfh3mfs3gan230ftv5y06';
    APP.secret = PublishMode ? '75enj0v3b2gm1jau45nqj1huc1zzv5' : 'qgu1b46zvygwhtfdhf9p8xxjilmy14';

    App.OnLoad = function (dal) {
        if(PublishMode)
            ANALY.Init();

        APP.servers = {
            //S1: { name: 'S1', local: '10.2.96.3', public: '137.220.62.49', apps: {} },
            G1: { name: 'G1', local: '10.2.96.4', public: '137.220.63.164', apps: {} },
            G2: { name: 'G2', local: '10.2.96.5', public: '149.28.118.14', apps: {} },
            S2: { name: 'S2', local: '10.2.96.6', public: '45.63.74.89', apps: {} },
        };
        APP.servers._each((s) => { s.io = new API(3005, s.local, true) })

        APP.appTypes = {
            train: { name: 'train', display: 'Hype Train', oneInstance: true },
            cloud: { name: 'cloud', display: 'Chat Cloud', oneInstance: true },
            combo: { name: 'combo', display: 'Emote Combos', oneInstance: true  },
            //planck: { name: 'planck', display: 'Running Game (Beta)', oneInstance: false, beta: true },
            score: { name: 'score', display: 'Scoreboard', oneInstance: true },
            wheel: { name: 'wheel', display: 'Chance Wheel (Alpha Test)', oneInstance: true, beta: true }
            //{ name: 'hangman', display: 'Hangman' },
        };
        APP.appIOs = {};

        APP.UpdateTest(dal, function () { 
            APP.appsReady = true; 
            APP.UpdateAppConnections();
        });

        APP.AppToken(dal);

        clearInterval(APP.ttUpdateTest1);
        APP.ttUpdateTest1 = setInterval(function(){

            APP.UpdateTest(dal, function () { 
                APP.appsReady = true;
                APP.UpdateAppConnections();
            });

        }, 20000);

        clearInterval(APP.ttToken);
        APP.ttToken = setInterval(() => { APP.AppToken(dal); }, 60000 * 60 * 24);
    };

    //payment stuff from kofi
    App.OnPayment = function (data, dal) {
        dal.Connect(mongoc, dbstring, function () {
            if (!data || !data.email)
                return;
            var payment = {
                email: data.email,
                amount: data.amount,
                items: data.shop_items
            };
            if (data && data.email)
                App.Discord('payment attempting at: ' + data.email, false, '-');
            dal.Save('payment', payment, function (pay) {
                dal.Get('streamer', { 'email': data.email }, function (guys) {
                    var guy = guys[0];
                    if (guy) {
                        guy.access = '2';
                        dal.Save('streamer', guy, function (stream) {
                            console.log('payment integrated / saved');
                            App.Discord('payment successful integrated: ' + guy.twitch, false, '-');
                        });
                    }
                });
            });
        });
    };

};

APP.CreateFlag = function(streamId, twitch){
    APP.flags.set(streamId, {
        time: Date.now(),
        twitch: twitch,
        streamId: streamId
    });
    //cleanup old stuff
    if(APP.flags.size > 20){
        APP.flags.forEach((f, key) => {
            if(Date.now() > (f.time + 17000))
                APP.flags.delete(key);
        });
    }
}

APP.GetApps = function(){
    var apps = [];
    APP.servers._each(s=> { apps = apps.concat(UT.List(s.apps)) });
    return apps;
}

APP.UpdateTest = function(dal, done){
    dal.Connect(mongoc, dbstring, function () {
    
        var selectObj = { twitch: 1, LastTick: 1, InActive: 1};
        APP.appTypes._each(atype => {
            selectObj['active'+atype.name] = 1;
        });

    //do not need to do this call on every Update
    dal.Select('streamer', {}, selectObj, function (guys) {
        var all = {};
        var doneCount = APP.servers._where(x => x.io.Sock.connected).length;
        var time = Date.now();
        
        guys._each(g=> {
            if (!g.InActive && (g.InActive == null || ((time - g.LastTick) > (1000 * 60 * 15)))) {
                g.InActive = true;
                dal.Save('streamer', g, function (data) { });
            }

            APP.appTypes._each(atype=>{
                if(g['active'+atype.name]){
                    var uid = atype.name + (atype.oneInstance ? '' : g.twitch);
                    all[uid] = { uid, type: atype.name, twitch: (atype.oneInstance ? null : g.twitch) };
                }
            });
        });


        var s1 = {};//all._where(x=> x => x.twitch != null);
       
        var g1 = all._where(x => (x.type == 'combo' || x.type == 'score'));
        var g2 = all._where(x=> x.type == 'train');
        var s2 = all._where(x=> (x.type == 'wheel' || x.type == 'cloud'));

        //UpdateServer simply make sure Apps are running
        //only needs to happen if not one-instance app || app isnt running at all
        /*
        APP.servers.S1.io.Call('UpdateServer', UT.List(s1), function (s1Apps) {
            APP.servers.S1.apps = s1Apps;
            doneCount--; if (doneCount == 0) done();
        });*/
        APP.servers.G1.io.Call('UpdateServer', UT.List(g1), function (g1Apps) {
            console.log('update server finish');
            APP.servers.G1.apps = g1Apps;
            doneCount--; if (doneCount == 0) done();
        });
        
        APP.servers.G2.io.Call('UpdateServer', UT.List(g2), function (g2Apps) {
            APP.servers.G2.apps = g2Apps;
            doneCount--; if (doneCount == 0) done();
        });

        APP.servers.S2.io.Call('UpdateServer', UT.List(s2), function (s2Apps) {
            APP.servers.S2.apps = s2Apps;
            doneCount--; if (doneCount == 0) done();
        });
    });
    });
}

APP.UpdateAppConnections = function(){
    var apps = APP.GetApps();
    apps._each(a=> {
        var io = APP.appIOs[a.uid];
        if(!io || io.Sock.disconnected)
            APP.appIOs[a.uid] = new API(a.port, a.ip, false) ;
    });
}

APP.AppToken = function(dal){
    var cid = '2dfbw32sgjazyxqscqxan685ykxkc9';
    var secret = '75enj0v3b2gm1jau45nqj1huc1zzv5';
    
    if(!PublishMode){
        cid = '6l9nxl6qnrfh3mfs3gan230ftv5y06';
        secret = 'qgu1b46zvygwhtfdhf9p8xxjilmy14';
    }
    console.log('app tokeining');

    request.post(
        'https://id.twitch.tv/oauth2/token?grant_type=client_credentials&client_id=' + cid + '&client_secret=' + secret,
        { },
        function (er, resp, body) { 
            var data = JSON.parse(body);

            dal.Connect(mongoc, dbstring, function () {
                dal.Get('TwitchToken', {}, function (toks) {
                    var tok = toks[0] ? toks[0] : {};
                    tok.access_token = data.access_token;
                    tok.cid = cid;
                    dal.Save('TwitchToken', tok, function (data) { });
                });
            });
        }
    );
}







