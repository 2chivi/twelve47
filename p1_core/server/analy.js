var e = exports;

e.ServerCalls = 0;
e.IncomingSocketCalls = 0;
e.OutgoingSocketCalls = 0;
e.PageRequests = 0;
e.Tick = Date.now();

e.Info = {
    AvgIncomingSocket: 0,
    AvgOutgoingSocket: 0,
    AvgPageRequests: 0,
    AvgServerCalls: 0,
    TotalSocketConnections: 0,
    rss: 0,
    heapTotal: 0,
    heapUsed: 0
};


e.Init = function(){
    e.loop();
};


//get all global arrays / objects and their lengths
//Memory stuff much more frequently (per minute)
//Memory isnt' leaking.. its just spking super high??

e.loop = function(){
    var interval = 1000 * 60 * 1.5;

    clearInterval(e.ttInt);
    e.ttInt = setInterval(function(){ 
        var minutes = (Date.now() - e.Tick)/(1000*60); //average per minute
        e.Info.AvgIncomingSocket = Math.ceil(e.IncomingSocketCalls / minutes);
        e.Info.AvgOutgoingSocket = Math.ceil(e.OutgoingSocketCalls / minutes);
        e.Info.AvgServerCalls = Math.ceil(e.ServerCalls / minutes);
        e.Info.AvgPageRequests = Math.ceil(e.PageRequests / minutes);

        var mem = process.memoryUsage();
        e.Info.rss = mem.rss;
        e.Info.heapTotal = mem.heapTotal;
        e.Info.heapUsed = mem.heapUsed;

        var triggerGC = 70000000;
        if (e.Info.heapUsed > triggerGC && global.gc){
            console.log('trigger gc');
            var test = global.gc();
            App.Discord('Garbage Collection Trigger: ' + JSON.stringify(mem) + " " + JSON.stringify(test), true, '');
        }

        e.log();

        e.IncomingSocketCalls = 0;
        e.OutgoingSocketCalls = 0;
        e.ServerCalls = 0;
        e.PageRequests = 0;
        e.Tick = Date.now();
    }, interval)
};

e.log = function(){
    cp.exec("landscape-sysinfo --exclude-sysinfo-plugins=Processes,Disk,LoggedInUsers", (error, stdout, stderr) => {
        var out = stdout.split('\n');

        App.Discord('\n\n' + out + '\n\n' + JSON.stringify(e.Info, null, "\t"), false, '');
    });
}

