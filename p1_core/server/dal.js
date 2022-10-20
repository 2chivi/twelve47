//DAL v1.0

var e = exports;
//var nodemailer = require('nodemailer');

e.Init = function () {
    e.db.createCollection("game", function (err, db) { });
    console.log("DB Initialized");
};

e.Save = function (table, objs, done) {
    e.OnAnyCall();
    var objects = objs;
    if (!(objs instanceof Array))
        objects = [objs];

    for (var i = 0; i < objects.length; i++) {
        var ogId = objects[i]._id;
        var obj = objects[i];
        delete objects[i]._id; //cannot save over ID

        e.db.collection(table).updateOne({ "_id": e.ObjID(ogId) },
            { $set: objects[i] }, { upsert: true }, (er, data) => {
                if (done && data && data.result.upserted) {
                    var id = data.result.upserted[0]._id;
                    obj._id = id;
                } else
                    obj._id = ogId;
                if (done)
                    done(obj);
                if (er)
                    console.log(er);
            });
        if (!objects[i]._id)
            objects[i]._id = ogId;
        return;
    }
};

e.Select = function (table, search, select, done) {
    e.OnAnyCall();
    e.db.collection(table).find(search, select).toArray(function (er, data) {
        if (done) done(data);
    });
};

e.Get = function (table, search, done) {
    e.OnAnyCall();
    if (search._id)
        search._id = e.ObjID(search._id);
    e.db.collection(table).find(search).toArray(function (er, data) {
        if (er)
            console.log(er);
        if (done) done(data);
    });
};

e.Delete = function (table, obj, done) {
    e.OnAnyCall();
    e.db.collection(table).deleteOne({ "_id": e.ObjID(obj._id) }, function (er, data) {
        if (done) done();
    });
};

e.DeleteAll = function (table, search, done) {
    e.OnAnyCall();
    e.db.collection(table).deleteMany(search, function () {
        if (done) done();
    });
};

e.OnAnyCall = function(){
    ANALY.ServerCalls++;
};

/*
e.SendEmail = function (emailTo, message) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: 'willdo.helper@gmail.com', pass: 'qrpsdTV@0' }
    });

    var mailOptions = {
        from: 'willdo.helper@gmail.com',
        to: emailTo,
        subject: 'WillDo::',
        html: message
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error)
            console.log(error);
        else
            console.log('Email sent: ' + info.response);
    });
};*/

e.Connect = function (mongoc, dbstring, done) {

    if(!e.db || !e.db.topology.isConnected()){
        mongoc.connect(dbstring, function (err, db) {
            e.db = db;
            done(e.db);
        });
    }else{
        done(e.db);
    }
};
