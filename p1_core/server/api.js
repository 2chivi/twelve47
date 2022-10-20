var IsServer = (typeof exports) !== 'undefined';

class API {
    constructor(port, ip, reconnect = true, serverLoc) {
        var t = this;
        t.reconnect = reconnect;
        t.Unique = 0;
        t.DoneFuncs = {};

        if (serverLoc)
            t.ServerLoc = serverLoc;
        else {
            if (!IsServer && window.location.hostname == 'localhost')
                t.ServerLoc = 'http://localhost:' + port;
            else if (IsServer) {
                t.ServerLoc = 'http://localhost:' + port;
                if (ip)
                    t.ServerLoc = 'http://' + ip + ":" + port;
            }
            else {
                t.ServerLoc = ServerLoc + '?port=' + port;
                if (ip)
                    t.ServerLoc += "&ip=" + ip;
            }
        }
        t.Init();
    }

    Init() {
        var t = this;
        t.Sock = io(t.ServerLoc, { reconnectionDelayMax: 65000, reconnection: t.reconnect, reconnectionDelay: 5000 });
        console.log(t.ServerLoc, 'connecting');

        t.Sock.on('connect_error', (err)=> {
            console.log('error ks: ', err)
        });

        t.Sock.on('any', function (key, args) {
            var df = t.DoneFuncs[key];
            if (df && df.func) {
                t.DoneFuncs[key].func(args);
                delete t.DoneFuncs[key];
            } else {
                console.log(key);
                console.log(t.DoneFuncs);
                console.log('API Sock Failure?')
            }
        });
    }

    RecordServerLog(){
        var t = this;
        t.IncomingCalls++;
    }

    FastCall(method, args, done) {
        this.Call(method, args, done, true);
    }

    Call(method, args, done, fast = false) {
        var t = this;
        var key = (fast ? 'f' : '') + t.Unique;
        var time = Date.now();
        t.Unique++;

        if(IsServer){
            ANALY.OutgoingSocketCalls++;
        }

        if(t.Unique > 999999)
            t.Unique = 0;

        if (done)
            t.DoneFuncs[key] = { func: done, time, key, method };

        t.Sock.emit('any', method, key, args);

        var maxTime = (1000 * 60 * 2);
        var removals = [];
        var inter = 0;

        t.DoneFuncs._each(df => {
            inter++;
            if(inter > 50) maxTime = 3000;
            if ((df.time + maxTime) < time) {
                removals.push(df);
                console.log('API timeout removal--------------- ' + df.method);
            }
        });
        removals._each(r => { delete t.DoneFuncs[r.key] });
    }
};
if (IsServer) module.exports = API;