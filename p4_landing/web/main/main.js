$(function () {
    M.Init();
});

var ServerLoc = 'https://twelve47.com/';
var S3 = 'https://twelve47.s3.us-east-2.amazonaws.com';

var M = {
    gameIds: {},
    state: '',
    ios: {},

    Init: function () {
        var query = new URLSearchParams(window.location.search);
        var twitch = query.get('twitch');
        var stream = query.get('stream');
        var autoPlay = query.get('autojoin');
        var passToken = query.get('token');
        M.specificApp = query.get('app');
        var params = new URLSearchParams(window.location.hash);
        var token = params.get('#access_token');
        var code = query.get('code');
        var state = params.get('state');
        var stateType = params.get('statetype');
        M.FirstLoad = true;
        M.LastGetInfoTick = Date.now();

        M.CanJoin = false;
        M.autoPlay = autoPlay;
        var isPublic = twitch != null && twitch.length > 0;

        if(stream || twitch){
            var streamerInfo = stream ? stream : twitch;

            //if(!passToken)
                //M.TwitchAuth(false, streamerInfo, 't1');

            var getStreamInfo = function(){
                var updateType = 'quick';

                if (Date.now() > (M.LastGetInfoTick + (1000 * 60 * 3))) {
                    updateType = 'refresh';
                    M.LastGetInfoTick = Date.now();
                }

                if (M.FirstLoad){
                    $('.div-app-starting').fadeIn();
                    setTimeout(function(){  
                        $('.div-app-starting').fadeOut();
                    }, 2000);
                    updateType = 'full';
                    M.FirstLoad = false;
                }

                if (ioLogin.Sock.disconnected){
                    return setTimeout(function(){
                        if(ioLogin.Sock.disconnected)
                            ioLogin = new API(loadData.PORT, null, false);
                    }, 2000);
                }

                ioLogin.Call('GetStream2', [streamerInfo, isPublic, loadData.VNUM, passToken, updateType], function (data) {
                    console.log('getstream2', data);

                    if(data.reload){
                        console.log('------- new version reload ------------');
                        setTimeout(function () { location.reload(); }, (3000 + (Math.random()*1000)));
                    }

                    if (data.apps == null)
                        return;

                    
                    if(data.needsToken){
                        $('.div-token').show();
                        return;
                    }

                    if(data.apps.length == 0){
                        M.gameIds = {};
                        $('.div-nothing').show();
                        $('.div-obs').hide();
                        $('.div-token').hide();
                        $('.div-webgl').hide();
                        if ($('.div-iframe').length) $('.div-iframe').remove();
                    }else{
                        if (!data.ready)
                            return console.log('1247 Server not ready yet');

                        data.apps._each(app=>{
                            if (app.appType.oneInstance && (!M.specificApp || (M.specificApp == app.type)))
                                M.TryShowApp(app, data);
                            else if(!app.appType.oneInstance){
                                //M.state = streamerInfo;
                                M.GameLoginInfo(app, data, streamerInfo);
                            }
                        });
                    }
                });
            }

            setTimeout(function () { getStreamInfo(); }, 2000 + Math.random() * 500);
            clearInterval(M.ttTry);
            M.ttTry = setInterval(function(){ getStreamInfo(); },6000 + Math.random()*1000);
        }else if(code){
            if(state){
                if(stateType == 't2')
                    M.TryShowGame(state, code)
                else
                    window.location = '/?stream='+state + "&code=" + code;
            }
            else
                M.MainPageTwitchLogin(code);           
        }else{
            $('.div-prod img[vid]').each(function(){
                var adr = S3 + "/twelve47/" + $(this).attr('class').substring(4) + ".mp4";
                $(this).replaceWith('<video class="'+$(this).attr('class')+'" autoplay muted loop><source src="' + adr +'"></source></video>')

                //$(this).attr('src', S3 + "/twelve47/" + $(this).attr('class').substring(4) + ".mp4");
            });
            $('.div-prod img[img]').each(function () {
                $(this).attr('src', S3 + "/twelve47/" + $(this).attr('class').substring(4) + ".gif");
            });
            $('.div-prod img[img_png]').each(function () {
                $(this).attr('src', S3 + "/twelve47/" + $(this).attr('class').substring(4) + ".png");
            });
            //$('.div-intro').css('display','grid');

            $('.f-pages').css('display', 'grid');
            $('.f-company-title').css('display', 'block');
            $('.f-lefter').css('display', 'block');
            $('.f-center').css('display', 'grid');
            FR.Init();
            console.log('show intro ' + stream);
        }
    },

    Test: function(streamerInfo){

    },

    TryShowApp: function(app, streamData){
        //M.ioGame shouldnt be used for for these apps
        //frame-parent
        console.log('-------------');

        if (!M.ios[app.pid] || M.ios[app.pid].Sock.disconnected){
            M.ios[app.pid] = new API(app.port, app.ip, false);
            console.log('new API refresh happened');
        }
        else if (M.ios[app.pid].Sock.io.opts.query != ('port=' + app.port + '&ip=' + app.ip)) {
            console.log(app.pid);
            console.log('reloading??? ' + ('port=' + app.port + '&ip=' + app.ip) + M.ios[app.pid].Sock.io.opts.query);
            console.log('dcd?: ' + M.ios[app.pid].Sock.disconnected)
            setTimeout(function () { location.reload(); }, (3000 + (Math.random()*1000)));
        }

        var member = streamData.member;
        var w = $(window).width();
        $('body').css('background-color','transparent');
        
        if (!M.isWebGLSupported()){
            $('.div-webgl').show();
        }else if (w < 1200)
            $('.div-obs').show();
        else if(app){
            $('.div-nothing').hide();
            $('.div-obs').hide();
            $('.div-token').hide();
            $('.div-webgl').hide();

            if (!M.gameIds[app.pid]){
                var url = "/port/" + app.port + '/ip/' + app.ip + '/?twitch=' + member.twitch;
                M.gameIds[app.pid] = true;// = app.pid;

                if ($('.' + app.pid))
                    $('.' + app.pid).remove();
                if ($('.div-iframe.' + app.type))
                    $('.div-iframe.' + app.type).remove();
                $('.div-frame-parent').append("<iframe class='div-iframe " + app.pid + " "+ app.type +"' src='" + url + "'></iframe>");
                window.IF = $('.div-iframe')[0].contentWindow;

                if ($('.div-frame-parent').children().length > 5)
                    setTimeout(function() { location.reload(); });
            }
        }
    },

    TryShowGame: function (streamerInfo, token){
        if (!M.isWebGLSupported())
            return $('.div-webgl').show();

        ioLogin.Call('GameLogin', [token], function (loginInfo) {
            var twitchName = loginInfo.twitch;
            console.log('game login');
            console.log(loginInfo);

            ioLogin.Call('GetStream', [streamerInfo, true], function (streamData) {
                var port = streamData.apps[0].port;
                M.ioGame = M.ioGame ? M.ioGame : new API(port, streamData.apps[0].ip);
                console.log('get stream');

                M.ioGame.Call('GameQueue', twitchName, function(qdata){
                    console.log('gqueue');
                    console.log(qdata);

                    if (qdata) {
                        M.CheckQueue(twitchName, streamData);

                        clearInterval(M.ttQueue);
                        M.ttQueue = setInterval(function () {
                            M.CheckQueue(twitchName, streamData);
                        }, 2000);
                    } else {
                        $('.div-game-intro').show();
                        $('.div-game-info').html('Game Queue Maxed Out. Sorry.');
                        $('.div-join').hide();
                    }
                });
            });
        });
    },

    GameLoginInfo: function (streamData, autoPlay, streamerInfo){
        if (!M.ioGame || M.ioGame.Sock.disconnected)
            M.ioGame = new API(streamData.port, streamData.ip);

        $('.div-game-intro').show();

        M.ioGame.Call('ServerInfo', [], function(data){
            $('.div-join').show();
            $('.div-players').html('Players: ' + data.players + "/" + data.max);
            $('.div-game-info').html(data.GameStart ? 'Game In Progress' : '');

            if(M.autoPlay){
                M.TwitchAuth(false, streamerInfo, 't2');
                M.autoPlay = false;
            }
        });
    },

    CheckQueue: function (twitch, streamInfo) {
        $('.div-game-intro').show();
        console.log('check queue');

        M.ioGame.Call('SpotInQueue', twitch, function (qdata) {
            console.log('spot in queue');

            if (qdata.canJoin){
                clearInterval(M.ttQueue);
                $('.div-game-intro').hide();
                $('body').css('background-color', 'transparent');
                var url = "/port/" + streamInfo.apps[0].port + "/ip/" + streamInfo.apps[0].ip + '/?name=' + twitch + "&server=" + streamInfo.member.id + "&twitch=" + streamInfo.member.twitch;
                $('.div-frame-parent').html("<iframe class='div-iframe' src='" + url + "'></iframe>");
                window.IF = $('.div-iframe')[0].contentWindow;
            }else{
                $('.div-players').html('Players: ' + qdata.players + "/" + qdata.max)
                $('.div-game-info').html(qdata.GameStart ? 'Game In Progress' : '');

                if (qdata.spot == null) {
                    $('.div-join').show();
                    $('.div-spot').html('');
                } else {
                    $('.div-spot').html((qdata.spot + 1) + " In Queue");
                }
            }
        });
    },

    MainPageTwitchLogin: function(code){
        ioLogin.Call('Login', [code,window.location.origin], function(data){
            if(data && data.twitch)
                window.location = '/app/?guy='+data.loginId;
            else{
                var con = confirm('Access Restricted for new streamers');
                if(con || !con){
                    window.location = '/';
                }
            }
        });
    },

    TwitchAuth: function (getEmail = false, state, type) {
        var cid = window.location.hostname != 'localhost' ? '2dfbw32sgjazyxqscqxan685ykxkc9' : '6l9nxl6qnrfh3mfs3gan230ftv5y06';
        var winloc = window.location.origin;

        window.location = 'https://id.twitch.tv/oauth2/authorize' +
            '?client_id=' + cid +
            (getEmail ? '&scope=user:read:email%20channel:read:hype_train%20channel:read:redemptions%20channel:manage:redemptions' : '&scope=channel:read:hype_train%20channel:read:redemptions%20channel:manage:redemptions') +
            '&redirect_uri=' + winloc +
            '&response_type=code' +
            '&claims={"id_token":{"preferred_username": null}' + 
            '&stateType=' + type +
            (state ? ('&state=' + state) : null);
    },

    isWebGLSupported() {
        if (typeof supported === 'undefined') {
            supported = (function supported() {
                var contextOptions = {
                    stencil: true,
                    failIfMajorPerformanceCaveat: true,
                };
                try {
                    if (!window.WebGLRenderingContext)
                        return false;
                    var canvas = document.createElement('canvas');
                    var gl = (canvas.getContext('webgl', contextOptions)
                        || canvas.getContext('experimental-webgl', contextOptions));
                    var success = !!(gl && gl.getContextAttributes().stencil);
                    if (gl) {
                        var loseContext = gl.getExtension('WEBGL_lose_context');
                        if (loseContext)
                            loseContext.loseContext();
                    }
                    gl = null;
                    return success;
                }
                catch (e) { return false; }
            })();
        }
        return supported;
	}

}

