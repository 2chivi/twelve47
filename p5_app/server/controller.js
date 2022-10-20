var e = exports;


e.Dashboard = function (req, dal, key, args, done) {
    var rd = null;

    dal.Get('streamer', { 'loginId': args[0] }, function (guys) {
        var member = guys[0];
        if(!member)
            return req.emit('any', key, rd);
        member.loginId = shortId.generate();

        dal.Get('files', { 'twitch': member.twitch }, function (fd) {
            if (member.access == 'admin') {
                dal.Get('streamer', { }, function (allGuys) {
                    dal.Save('streamer', member, function () {
                        var mem = allGuys._first(x=> x.twitch == member.twitch);
                        if(mem)
                            mem.loginId = member.loginId;

                        rd = { user: member, users: allGuys, files: fd };
                        req.emit('any', key, rd);
                    });
                });
            } else {
                dal.Save('streamer', member, function () {
                    rd = { user: member, users: [member], files: fd };
                    req.emit('any', key, rd);
                });
            }
        });
    });

};

e.Snapshot123 = function (req, dal, key, args, done) {
    var heapdump = require('heapdump');
    console.log(process.memoryUsage());
    heapdump.writeSnapshot('./' + Date.now() + '.heapsnapshot');
    console.log('dump')
    console.log(process.memoryUsage());
};

e.DashInfo = function (req, dal, key, args, done) {
    var rd = {};

    dal.Get('streamer', { 'loginId': args[0] }, function (guys) {
        var member = guys[0];

        if (member) {
            var apps = APP.GetApps();
            rd.appTypes = UT.List(APP.appTypes);

            if(member.access == 'admin')
                rd.apps = apps;
            else
                rd.apps = apps._where(x => x.twitch == null || x.twitch == member.twitch);
        }

        req.emit('any', key, rd);
        done();
    });
};

e.RemoveUser = function (req, dal, key, args, done) {
    var rd = {};

    dal.Get('streamer', { 'loginId': args[0] }, function (guys) {
        var member = guys[0];
        if (member && member.access == 'admin') {
            dal.DeleteAll('streamer', { 'twitch': args[1] }, function () {
                req.emit('any', key, true);
            });
        }
    });
};

e.ClearFiles = function (req, dal, key, args, done){
    dal.Get('streamer', { 'loginId': args[0] }, function (guys) {
        var member = guys[0];
        if(member && member.twitch == args[1]){
            dal.DeleteAll('files', { 'twitch': args[1] }, function () {
                req.emit('any', key, true);
            });
        }
    });
}

e.FileUpload = function (req, dal, key, args, done){

    dal.Get('streamer', { 'loginId': args[0] }, function (guys) {
        var member = guys[0];
        var fileData = args[1];

        if (fileData && member && member.twitch == fileData.user.twitch && member.access != '1') {
            if (fileData && fileData.size < 200000) {

                dal.DeleteAll('files', { 'twitch': fileData.user.twitch, 'fileType': fileData.fileType }, function () {

                    var file = {};
                    file.twitch = fileData.user.twitch;
                    file.fileType = fileData.fileType;
                    file.name = fileData.name;
                    file.size = fileData.size;
                    file.file = fileData.file;

                    dal.Save('files', file, function (data) {
                        dal.Get('files', { 'twitch': fileData.user.twitch }, function (files) {
                            req.emit('any', key, files);
                        })
                    });
                });

            } else {
                req.emit('any', key, false);
            }
        }
    });


};

e.SaveUser = function (req, dal, key, args, done) {
    var rd = {};

    dal.Get('streamer', { 'loginId': args[0] }, function (guys) {
        var member = guys[0];
        

        if (member) {
            var streamer = args[1];
            var adminRights = member.access == 'admin';

            if(member.twitch == streamer.twitch || adminRights){
                if (!streamer.streamId)
                    streamer.streamId = shortId.generate() + shortId.generate();
                if (!streamer.modId)
                    streamer.modId = 'mod' + shortId.generate() + shortId.generate();

                dal.Save('streamer', streamer, function (data) {
                    req.emit('any', key, data ? data._id : null);
                });
            }
            
        } else {
            req.emit('any', key, rd);
        }
    });
};

e.ToggleApp = function (req, dal, key, args, done) {

    dal.Get('streamer', { 'loginId': args[0] }, function (guys) {
        if(!guys[0]) return;
        

        dal.Get('streamer', { 'twitch': args[1].toLowerCase() }, function (guys) {
            var member = guys[0];
            var togglingOn = false;

            if (member) {
                member.InActive = false;
                APP.CreateFlag(member.streamId);


                var appType = APP.appTypes._first(x => x.name == args[2]);
                if(appType){
                    if(appType.beta && (member.access != 'beta' && member.access != 'admin')){
                        //do nothing. no access
                    }else{
                        if (!member['active' + args[2]]) {
                            member['active' + args[2]] = true;
                            togglingOn = true;
                        }
                        else
                            member['active' + args[2]] = null;
                    }
                }

                dal.Save('streamer', member, function (data) { });

                if(appType){
                    var appuid = appType.name + (appType.oneInstance ? '' : member.twitch);
                    var apps = APP.GetApps();
                    var needAppAwake = togglingOn && !apps._any(x => x.uid == appuid);
                    //gets turned off by occosional update

                    if(needAppAwake){
                        APP.UpdateTest(dal, function () {
                            setTimeout(function () {
                                req.emit('any', key, { apps: APP.GetApps(), appTypes: UT.List(APP.appTypes), member });
                                done();
                            }, 2500);
                        });
                    }else{
                        req.emit('any', key, { apps: APP.GetApps(), appTypes: UT.List(APP.appTypes), member });
                        done();
                    }
                }
               
            }
        });

    });
};

