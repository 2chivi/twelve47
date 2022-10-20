var e = exports;

e.GetStream2 = function (req, dal, key, args, done) {
    //check for flag.
    var flag = APP.flags.get(args[0]);
    var firstTimeLoad = args[4] == 'full';
    var needRefresh = args[4] == 'refresh'; //change this on 5min?
    var needFullUpdate = firstTimeLoad;

    if(flag != null && Date.now() < (flag.time+17000))
        needFullUpdate = true; //also need to do this on first-time loading 

    if(!needFullUpdate){
        var reload = App.VNUM != args[2];
        req.emit('any', key, { ready: APP.appsReady, reload });
    }

    if(needFullUpdate || needRefresh){
        var prop = args[1] ? { 'twitch': args[0] } : { 'streamId': args[0] };

        dal.Get('streamer', prop, function (guys) {
            var member = guys[0];
            var streamerApps = [];
            var serverApps = APP.GetApps();
            if(!member)
                return console.log(args[0], 'no user found problem???');

            var needsToken = member.refresh == null;

            member.InActive = false;
            member.LastTick = Date.now();
            dal.Save('streamer', member, function (data) { });

            if(needFullUpdate){
                APP.appTypes._each(appType => {
                    if (member['active' + appType.name]) {
                        var isGame = appType && !appType.oneInstance;
                        var ap = null;

                        if (!isGame)
                            ap = serverApps._first(x => x.type == appType.name);
                        if (appType && isGame)
                            ap = serverApps._first(x => x.type == appType.name && x.twitch == member.twitch);

                        if (ap) {
                            ap.appType = appType;
                            streamerApps.push(ap);

                            //request updates on FLAG or new NEW PAGE LOAD
                            if (needFullUpdate && APP.appIOs[ap.uid] && APP.appIOs[ap.uid].Sock.connected) {
                                APP.appIOs[ap.uid].Call('Update', [], function (data) {
                                    console.log('success streamer joined ' + ap.uid + " " + member.twitch)
                                });
                            }
                        }
                    }
                });
            }

            var reload = App.VNUM != args[2];
            req.emit('any', key, { member, apps: streamerApps, ready: APP.appsReady, reload, needsToken });

            //check for refresh tokens
            request({
                url: 'https://id.twitch.tv/oauth2/validate',
                headers: { 'Authorization': 'OAuth ' + member.token },
                dataType: 'json',
            }, function (er, res, info) {
                var parsed = false;
                try {
                    info = JSON.parse(info);
                    parsed = true;
                } catch (e) { }

                console.log('helo', info);

                if(needsToken) 
                    return;

                if (!parsed || (!info || !info.expires_in) || (info.expires_in && info.expires_in < 10000)) {
                    request({
                        url: 'https://id.twitch.tv/oauth2/token',
                        method: 'POST',
                        form: {
                            'refresh_token': member.refresh,
                            'client_id': APP.cid,
                            'client_secret': APP.secret,
                            'grant_type': 'refresh_token'
                        },
                        //headers: { 'Authorization': 'OAuth ' + member.token },
                        dataType: 'json',
                    }, function (er, res, info) {
                        try {
                            info = JSON.parse(info);
                            member.token = info.access_token;
                            dal.Save('streamer', member, function () { });
                            //console.log('save??');
                        } catch (e) { }
                    });
                }
            });
        });
    }
};

e.GetStream = function (req, dal, key, args, done) {
    var aps = [];
    var prop = args[1] ? { 'twitch': args[0] } : { 'streamId': args[0] };

    //this needs to be drastically re-drawn up
    //server has quick map of active users
    //most checkups.. it checks the map to remain active.. inactive = removal
    //if 5 minute interval : do validation/token stuff + LastTick active
    //if Flag for app change -> send msg to tell them to request that stuff
    console.log('hello', prop);

    dal.Get('streamer', prop, function (guys) {
        var member = guys[0];
        var needsToken = true;

        if(member){
            var apps = APP.GetApps();
            var newConnect = member.InActive;
            //testing stuff
            //var twitchToken = args[3];// ? args[3] : member.token;
            //refresh token , or give warning that they need to login to visit site

            //REFRESH TOKENS shouldnt expire.. thats why this works.  4 hour on expire.. then refresh
            //validate that the token works
            //console.log(member.token);
            request({
                url: 'https://id.twitch.tv/oauth2/validate',
                headers: { 'Authorization': 'OAuth ' + member.token },
                dataType: 'json',
            }, function (er, res, info) {
                var parsed = false;
                try{
                    info = JSON.parse(info);
                    parsed = true;
                }catch (e) { }

                console.log('here', info);

                if(member.refresh)
                    needsToken = false;

                if(!parsed || (!info || !info.expires_in) || (info.expires_in && info.expires_in < 10000)){

                    //refresh the token
                    if(!needsToken){
                        //console.log('attempting refresh');
                        request({
                            url: 'https://id.twitch.tv/oauth2/token',
                            method: 'POST',
                            form: {
                                'refresh_token': member.refresh,
                                'client_id': APP.cid,
                                'client_secret': APP.secret,
                                'grant_type': 'refresh_token'
                            },
                            //headers: { 'Authorization': 'OAuth ' + member.token },
                            dataType: 'json',
                        }, function (er, res, info) {
                            try{
                                info = JSON.parse(info);
                                member.token = info.access_token;
                                dal.Save('streamer', member, function () { });
                                //console.log('save??');
                            }catch(e){ }
                        });
                    }
                }

                member.InActive = false;
                member.LastTick = Date.now();
                //member.LastActivity = Date.now() moment().format('MMM D YYYY');
                //member.passToken = twitchToken;
                dal.Save('streamer', member, function (data) { });

                APP.appTypes._each(appType=>{
                    if(member['active'+appType.name]){
                        var isGame = appType && !appType.oneInstance;
                        var ap = null;
    
                        if (!isGame)
                            ap = apps._first(x => x.type == appType.name);
                        if (appType && isGame)
                            ap = apps._first(x => x.type == appType.name && x.twitch == member.twitch);
    
                        if (ap) {
                            ap.appType = appType;
                            aps.push(ap);
    
                            if (APP.appIOs[ap.uid] && APP.appIOs[ap.uid].Sock.connected && newConnect) {
                                APP.appIOs[ap.uid].Call('Update', [], function (data) {
                                    console.log('success say streamer joined ' + ap.uid + " " + member.twitch)
                                });
                            }
                        }
                    }
                });
    
    
                var reload = App.VNUM != args[2];
                req.emit('any', key, {member, apps: aps, ready: APP.appsReady, reload, needsToken });
                aps = null;
                apps = null;
                done();
            });


        }else{
            var reload = App.VNUM != args[2];
            req.emit('any', key, {member, apps: aps, ready: APP.appsReady, reload, needsToken });
            aps = null;
            apps = null;
            done();
        }
    });
};

e.GameLogin = function (req, dal, key, args, done) {
    var token = args[0];

    request({
        url: 'https://id.twitch.tv/oauth2/userinfo',
        headers: { 'Authorization': 'Bearer ' + token },
        dataType: 'json',
    }, function (er, res, data) {
        data = JSON.parse(data);
        var rd = {};
        rd.id = data.sub;
        rd.twitch = data.preferred_username.toLowerCase();

        req.emit('any', key, rd);
        done();
    });
};


e.Login = function (req, dal, key, args, done) {
    var code = args[0];

    //get access token + refresh token
    request({
        method: 'POST',
        url: 'https://id.twitch.tv/oauth2/token?client_id=' + APP.cid + 
            '&client_secret=' + APP.secret + '&code='+code+'&grant_type=authorization_code'+
            '&redirect_uri=' + args[1],
        //headers: { 'Authorization': 'Bearer ' + token, 'Client-ID': APP.cid, '' },
        dataType: 'json',
    }, function (er, res, info) {
        try{
            info = JSON.parse(info);
            if(info.refresh_token){
                console.log('recieve tokensss???');
                var accessToken = info.access_token;
                var refreshToken = info.refresh_token;

                request({
                    url: 'https://id.twitch.tv/oauth2/userinfo',
                    headers: { 'Authorization': 'Bearer ' + accessToken },
                    dataType: 'json',
                }, function (er, res, data) {
                    try{
                        data = JSON.parse(data);

                        var rd = null;

                        dal.Get('streamer', { 'id': data.sub }, function (guys) {
                            var member = guys[0];

                            //genereral User Info
                            request({
                                url: 'https://api.twitch.tv/helix/users?id=' + data.sub,
                                headers: { 'Authorization': 'Bearer ' + accessToken, 'Client-ID': APP.cid },
                                dataType: 'json',
                            }, function (er, res, info) {
                                info = JSON.parse(info);
                                if (!info || !info.data) return;
                                var infoGuy = info.data[0];


                                //Followers Count-----------------
                                request({
                                    url: 'https://api.twitch.tv/helix/users/follows?to_id=' + data.sub + '&first=1',
                                    headers: { 'Authorization': 'Bearer ' + accessToken, 'Client-ID': APP.cid },
                                    dataType: 'json',
                                }, function (er, res, info) {
                                    info = JSON.parse(info);
                                    if (!info || !info.data) return;
                                    var followData = info;

                                    if (infoGuy) {
                                        if (!member) {
                                            var allow = followData.total > 40;

                                            if (infoGuy.broadcaster_type == 'affiliate' || infoGuy.broadcaster_type == 'partner') {
                                                allow = true;
                                            }

                                            if (allow) {
                                                var isPartner = infoGuy.broadcaster_type == 'partner';
                                                App.Discord('new user created: ' + infoGuy.login, isPartner, '-');
                                                member = { twitch: infoGuy.login, access: '1' };
                                            } else
                                                App.Discord('new user denied: ' + infoGuy.login + " f: " + followData.total, false, '-');
                                        }

                                        if (member) {
                                            member.loginId = shortId.generate();
                                            member.id = data.sub;
                                            member.token = accessToken;
                                            member.refresh = refreshToken;
                                            member.twitch = infoGuy.login;
                                            member.email = infoGuy.email ? infoGuy.email : null;
                                            member.views = infoGuy.view_count;
                                            member.twitchType = infoGuy.broadcaster_type;
                                            member.followers = followData.total;

                                            if (!member.modId)
                                                member.modId = 'mod' + shortId.generate() + shortId.generate();
                                            if (!member.streamId)
                                                member.streamId = shortId.generate() + shortId.generate();

                                            rd = member;
                                            dal.Save('streamer', member, function () { });
                                        }

                                        req.emit('any', key, rd);
                                        done();
                                    }
                                });
                            });
                        });
                    } catch(e){ }
                });
            }
        }catch(e){ console.log(e); }
    });




};
