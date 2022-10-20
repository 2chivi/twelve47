

$(function(){
    M.Init();
    M.Body = ReactDOM.render(<Body />, document.getElementById('root'));
});

var ServerLoc = 'https://twelve47.com/';
var S3 = 'https://twelve47.s3.us-east-2.amazonaws.com';

var M = {
    appTypes: [],
    apps: [],

    Init: function(){
        var params = new URLSearchParams(window.location.search);
        var id = params.get('guy');

        ioLogin.Call('Dashboard', [id], function (data) {
            if(data){
                console.log('calling dashboard', M.user);
                M.user = data.user;
                M.users = data.users;
                M.files = data.files;

                M.UpdateAppInfo();
                clearInterval(M.ttAppInfo1);
                M.ttAppInfo1 = setInterval(function(){
                    M.UpdateAppInfo();
                }, 15000);


                $('html')._onoff('touchmove mousemove', function (e) {
                    M.UpdatePointer(e);
                });
                $('html')._onoff('mouseup touchstart', function (e) {
                    UT.trigger('mouseup', {});
                });
            }
            else
                window.location = '/'; //expired login
        });

    },

    UpdatePointer: function (e) {
        var ev = e;
        if (e.type.indexOf('touch') >= 0)
            ev = e.originalEvent.touches[0];

        M.mx = ev.pageX;
        M.my = ev.pageY;
    },

    RemoveUser: function(twitch){
        ioLogin.Call('RemoveUser', [M.user.loginId, twitch], function(){ })
    },

    NewUser: function(twitch, access = '1'){
        M.SaveUser({
            twitch, access,
            cloudPosition:'Bottom_Right',
            cloudTotal: 8,
            cloudLifetime: 30,
            cloudColors: ['#57A9E8', '#0D80D9', '#6565EB', '#6565EB', '#4DEAA7', '#00DD7E'],
            comboPosition:'Bottom_Right'
        });
    },

    SaveUser: function(user, io){
        ioLogin.Call('SaveUser', [M.user.loginId, user], function () {
            if (io) {
                io.Call('Update', [M.user.twitch], function () {
                    console.log('saved & updated');
                });
            }
        });
    },

    SaveAll: function(props){
        M.users._each(u=> {
            Object.keys(props)._each(key=> { u[key] = props[key] });
            M.SaveUser(u);
            console.log('saved');
        });
    },

    UpdateAppInfo: function(){
        ioLogin.Call('DashInfo', [M.user.loginId], function (data) {
            if(!data.appTypes){
                window.location = '/'; //expired login
            }

            M.appTypes = data.appTypes;
            M.apps = data.apps;

            M.Body.refs.dash.setState({ users: M.users, types: M.appTypes, apps: M.apps });

            M.appTypes._each(at=>{
                M.users._each(u=>{
                    var app = M.apps._first(a => a.type == at.name && (a.twitch == null || a.twitch == u.twitch));
                    if (M.Body.refs.dash.refs[at.name + u.twitch])
                        M.Body.refs.dash.refs[at.name + u.twitch].setApp(app, u);
                });
            });
            
        });
    }
}

