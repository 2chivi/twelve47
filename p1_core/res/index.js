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
if (IsServer) module.exports = API;//LINQ 1.3 : Fix inherit != null

var UT = {};
(function (exp) {
    var t = exp;
    t.Events = {};

    t.PushUnique = function (newObject, array) {
        for (var h = 0; h < array.length; h++) {
            if (newObject._id == array[h]._id)
                array.splice(h, 1);
        }
        array.push(newObject);
    };

    t.Dict = function (array) {
        var dict = {};
        for (var i = 0; i < array.length; i++)
            dict[array[i]._id] = array[i];
        return dict;
    };

    t.List = function (obj) {
        if (!obj) return null;
        return Object.keys(obj).map(function (key) {
            return obj[key];
        });
    };

    t.Extensions = function () {
        //LINQ pseudo.. pick == select
        Array.prototype._select = function (func) {
            return t.Select(this, func);
        };
        Array.prototype._each = function (func) {
            return t.Select(this, func);
        };
        Array.prototype._orderBy = function () {
            return t.OrderBy(this, arguments);
        };
        Array.prototype._max = function (func) {
            var arr = this._orderBy(func);
            return arr[arr.length - 1];
        };
        Array.prototype._min = function (func) {
            var arr = this._orderBy(func);
            return arr[0];
        };
        Array.prototype._avg = function () {
            var sum = 0;
            this._each(x=> { sum += x });
            return sum / this.length;
        };
        Array.prototype._mode = function () {
            var max = '';
            var maxi = 0;
            var b = {};
            for (let k of this) {
                if (b[k]) b[k]++; else b[k] = 1;
                if (maxi < b[k]) { max = k; maxi = b[k] }
            }
            return max;
        };
        Array.prototype._where = function (func) {
            return t.Where(this, func);
        };
        Array.prototype._any = function (func) {
            return t.Where(this, func).length > 0;
        };
        Array.prototype._first = function (func) {
            return t.First(this, func);
        };
        Array.prototype._queue = function(item, maxLength){
            this.push(item);
            if (this.length > maxLength)
                this.shift();
        };
        Object.defineProperty(Object.prototype, "_each", {
            value: function (func) { return t.Select(t.List(this), func); },
            enumerable: false, writable: true
        });
        Object.defineProperty(Object.prototype, "_where", {
            value: function (func) { return t.Where(t.List(this), func); },
            enumerable: false, writable: true
        });
        Object.defineProperty(Object.prototype, "_any", {
            value: function (func) { return (t.Where(t.List(this), func).length > 0); },
            enumerable: false, writable: true
        });
        Object.defineProperty(Object.prototype, "_first", {
            value: function (func) { return t.First(t.List(this), func); },
            enumerable: false, writable: true
        });
        Object.defineProperty(Object.prototype, "_orderBy", {
            value: function (func) { return t.OrderBy(t.List(this), arguments); },
            enumerable: false, writable: true
        });
    };

    if (typeof $ != 'undefined') {
        $.prototype._select = function (func) {
            return t.Select(this, func);
        };
        $.prototype._onoff = function (e1, e2, e3) {
            if (e3)
                $(this).off(e1, e2).on(e1, e2, e3);
            else
                $(this).off(e1).on(e1, e2);
            return $(this);
        };
    }

    t.Select = function (objs, func) {
        var filtered = [];
        for (var i = 0; i < objs.length; i++)
            filtered.push(func(objs[i]));
        return filtered;
    };

    t.First = function (objs, func) {
        if (func)
            objs = t.Where(objs, func);
        if (objs.length > 0)
            return objs[0];
        return null;
    };

    t.OrderBy = function (objs, args) {
        var orderedList = objs;
        orderedList.sort(function (a, b) {
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                var a1 = (arg(a) ? arg(a) : null);
                var a2 = (arg(b) ? arg(b) : null);
                if (a1 != a2)
                    return a1 - a2;
            }
        });
        return orderedList;
    };

    t.Where = function (objs, func) {
        var filtered = [];
        for (var i = 0; i < objs.length; i++) {
            if (!func || func(objs[i]))
                filtered.push(objs[i]);
        }
        return filtered;
    };

    t.on = function (ev, uid, done) {
        var evt = {};
        evt.ev = ev;
        evt.done = done;
        t.Events[ev + uid] = evt;
    };

    t.trigger = function (ev, stuff) {
        t.Events._each(e => {
            if (e.ev == ev) {
                e.done(stuff);
            }
        });
    };

}(typeof exports === 'undefined' ? UT : exports));

//UTIL v1.0

//Various Utility Functions
$(function () {
    ioLogin = new API(loadData.PORT);
    UT.Extensions();
});

//#region Control Creation

var UX = {

    Toggle: function(comp, val){
        if (!comp.state.style)
            comp.state.style = {};

        val = val != null ? val : comp.state.style.display == 'none';

        if (val)
            comp.setState({ style: { } });
        else
            comp.setState({ style: { display: 'none' }});
    }

};

//#endregion
/* ======== No Steal (>.>) Twelve47Kevin@gmail.com ======== */ 
"use strict";/* ======== No Steal (>.>) Twelve47Kevin@gmail.com ======== */ 
"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

$(function () {
  M.Init();
  M.Body = ReactDOM.render(React.createElement(Body, null), document.getElementById('root'));
});
var ServerLoc = 'https://twelve47.com/';
var S3 = 'https://twelve47.s3.us-east-2.amazonaws.com';
var M = {
  appTypes: [],
  apps: [],
  Init: function Init() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('guy');
    ioLogin.Call('Dashboard', [id], function (data) {
      if (data) {
        console.log('calling dashboard', M.user);
        M.user = data.user;
        M.users = data.users;
        M.files = data.files;
        M.UpdateAppInfo();
        clearInterval(M.ttAppInfo1);
        M.ttAppInfo1 = setInterval(function () {
          M.UpdateAppInfo();
        }, 15000);

        $('html')._onoff('touchmove mousemove', function (e) {
          M.UpdatePointer(e);
        });

        $('html')._onoff('mouseup touchstart', function (e) {
          UT.trigger('mouseup', {});
        });
      } else window.location = '/'; //expired login

    });
  },
  UpdatePointer: function UpdatePointer(e) {
    var ev = e;
    if (e.type.indexOf('touch') >= 0) ev = e.originalEvent.touches[0];
    M.mx = ev.pageX;
    M.my = ev.pageY;
  },
  RemoveUser: function RemoveUser(twitch) {
    ioLogin.Call('RemoveUser', [M.user.loginId, twitch], function () {});
  },
  NewUser: function NewUser(twitch) {
    var access = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '1';
    M.SaveUser({
      twitch: twitch,
      access: access,
      cloudPosition: 'Bottom_Right',
      cloudTotal: 8,
      cloudLifetime: 30,
      cloudColors: ['#57A9E8', '#0D80D9', '#6565EB', '#6565EB', '#4DEAA7', '#00DD7E'],
      comboPosition: 'Bottom_Right'
    });
  },
  SaveUser: function SaveUser(user, io) {
    ioLogin.Call('SaveUser', [M.user.loginId, user], function () {
      if (io) {
        io.Call('Update', [M.user.twitch], function () {
          console.log('saved & updated');
        });
      }
    });
  },
  SaveAll: function SaveAll(props) {
    M.users._each(function (u) {
      Object.keys(props)._each(function (key) {
        u[key] = props[key];
      });

      M.SaveUser(u);
      console.log('saved');
    });
  },
  UpdateAppInfo: function UpdateAppInfo() {
    ioLogin.Call('DashInfo', [M.user.loginId], function (data) {
      if (!data.appTypes) {
        window.location = '/'; //expired login
      }

      M.appTypes = data.appTypes;
      M.apps = data.apps;
      M.Body.refs.dash.setState({
        users: M.users,
        types: M.appTypes,
        apps: M.apps
      });

      M.appTypes._each(function (at) {
        M.users._each(function (u) {
          var app = M.apps._first(function (a) {
            return a.type == at.name && (a.twitch == null || a.twitch == u.twitch);
          });

          if (M.Body.refs.dash.refs[at.name + u.twitch]) M.Body.refs.dash.refs[at.name + u.twitch].setApp(app, u);
        });
      });
    });
  }
};

var App =
/*#__PURE__*/
function (_React$Component) {
  _inherits(App, _React$Component);

  function App(props) {
    var _this;

    _classCallCheck(this, App);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(App).call(this));
    _this.state = {
      type: props.type,
      user: props.user,
      app: props.app,
      waiting: false,
      hide: false //props.admin

    };
    _this.components = {
      cloud: Cloud,
      combo: Combo,
      hangman: Hangman,
      planck: Planck,
      score: Score,
      train: Train,
      wheel: Wheel
    };
    return _this;
  }

  _createClass(App, [{
    key: "setApp",
    value: function setApp(app, u) {
      var t = this;
      t.setState({
        app: app,
        user: u
      });
      t.refs.details.setState({
        app: app
      });
    }
  }, {
    key: "togg",
    value: function togg() {
      var t = this;
      t.setState({
        waiting: true
      });
      console.log(t.state.user.twitch);
      ioLogin.Call('ToggleApp', [M.user.loginId, t.state.user.twitch, t.state.type.name], function (data) {
        for (var i = 0; i < M.users.length; i++) {
          if (M.users[i].twitch == data.member.twitch) {
            M.users[i] = data.member;
            t.setState({
              user: data.member
            });
          }
        }

        setTimeout(function () {
          t.setState({
            waiting: false
          });
        }, 4000);
        M.UpdateAppInfo();
        t.forceUpdate();
      });
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      var isActive = t.state.app != null && t.state.user['active' + t.state.type.name];
      var btnText = isActive ? 'Turn Off' : 'Turn On';
      var btn = React.createElement("div", {
        className: "btn",
        onClick: function onClick() {
          t.togg();
        }
      }, btnText);
      var think = t.state.waiting;
      var betaAccess = M.user.access == 'admin' || M.user.access == 'beta';
      if (t.state.waiting || t.state.type.beta && !betaAccess) btn = null;
      var Comp = t.components[t.state.type.name];
      if (!Comp) alert('update components in app.js');
      return React.createElement("div", {
        className: 'div-app div-box ' + (isActive ? 'active ' : '') + (think ? 'think ' : '')
      }, React.createElement("div", {
        className: "div-header"
      }, React.createElement("div", {
        className: "div-swatch"
      }, React.createElement("i", {
        "class": "fa fa-cog fa-spin"
      })), React.createElement("div", null, t.state.type.display), btn), React.createElement("div", {
        className: 'div-body ' + (t.state.hide ? 'hide' : '')
      }, React.createElement(Comp, {
        ref: "details",
        app: t.state.app,
        user: t.state.user,
        type: t.state.type
      })));
    }
  }]);

  return App;
}(React.Component);

var Bet =
/*#__PURE__*/
function (_React$Component2) {
  _inherits(Bet, _React$Component2);

  function Bet(props) {
    var _this2;

    _classCallCheck(this, Bet);

    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(Bet).call(this));
    _this2.state = {
      type: props.type,
      user: props.user,
      app: props.app
    };
    return _this2;
  }

  _createClass(Bet, [{
    key: "setLoc",
    value: function setLoc(data) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.betPosition = data;
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      if (!t.state.app) t.io = null;
      if (t.state.app && !t.io) t.io = new API(t.state.app.port, t.state.app.ip, false);
      return React.createElement("div", {
        className: 'div-combo div-inner ' + (t.state.app != null ? 'active' : '')
      }, React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Screen Position (click and drag): "), React.createElement(Position, {
        ref: "position",
        data: t.state.user.betPosition ? t.state.user.betPosition : {
          right: 0.95,
          bottom: 0.95
        },
        width: '16',
        height: "8",
        OnUpdate: function OnUpdate(e) {
          t.setLoc(e);
        }
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, React.createElement("div", {
        style: {
          marginBottom: '5px',
          textDecoration: 'underline'
        }
      }, "Chat Commands"), React.createElement("div", null, "!bet 5 title of bet "), React.createElement("div", null, "!bet 2 yes"), React.createElement("div", null, "!bet 10 shroud title of bet"), React.createElement("div", null, "[#subs | yes/no/streamer | title-of-bet]")), React.createElement("div", null, React.createElement("div", {
        style: {
          marginBottom: '5px',
          textDecoration: 'underline'
        }
      }, "Mod Commands"), React.createElement("div", null, "!betwinner no"), React.createElement("div", null, "!betwinner shroud"), React.createElement("div", null, "!betclear"))));
    }
  }]);

  return Bet;
}(React.Component);

var Body =
/*#__PURE__*/
function (_React$Component3) {
  _inherits(Body, _React$Component3);

  function Body() {
    var _this3;

    _classCallCheck(this, Body);

    _this3 = _possibleConstructorReturn(this, _getPrototypeOf(Body).call(this));
    _this3.state = {};
    return _this3;
  }

  _createClass(Body, [{
    key: "Play",
    value: function Play(app) {
      /*
      var type = M.appTypes._first(x=> x.name = app.name);
      M.Body.setState({ 
          user: M.user,
          loc: type.loc + "?port=" + app.port
      });*/
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      var apps = [];

      M.appTypes._each(function (x) {
        apps.push(React.createElement(App, {
          ref: x.name,
          type: x
        }));
      }); //list of active streamers
      //are the live?  or just server online?

      /*
      var streamers = [];
      t.state.apps._each(a=>{ streamers.push(
          <div onClick={()=>{ t.Play(a); }} class='div-streamer div-box'>{a.twitch}</div>
      )});*/


      return React.createElement("div", {
        className: "body"
      }, React.createElement(Dash, {
        ref: "dash"
      }));
    }
  }]);

  return Body;
}(React.Component);

var Cloud =
/*#__PURE__*/
function (_React$Component4) {
  _inherits(Cloud, _React$Component4);

  function Cloud(props) {
    var _this4;

    _classCallCheck(this, Cloud);

    _this4 = _possibleConstructorReturn(this, _getPrototypeOf(Cloud).call(this));
    _this4.state = {
      type: props.type,
      user: props.user,
      app: props.app
    };
    return _this4;
  }

  _createClass(Cloud, [{
    key: "connect",
    value: function connect() {
      var t = this;

      if (t.state.app) {
        if (!t.io) t.io = new API(t.state.app.port, t.state.app.ip, false);
      }
    }
  }, {
    key: "setColors",
    value: function setColors(e) {
      var t = this;
      var colors = t.state.user.cloudColors ? t.state.user.cloudColors : ['#57A9E8', '#0D80D9', '#6565EB', '#6565EB', '#4DEAA7', '#00DD7E'];
      var oldColors = colors.slice();
      var colors = $(e.target).val().split(',');
      clearTimeout(t.ttSave);
      t.state.user.cloudColors = colors;
      t.setState({
        user: t.state.user
      });
      t.ttSave = setTimeout(function () {
        var valid = true;

        colors._each(function (c) {
          if (!/[0-9A-Fa-f]{6}/g.test(c.substring(1))) valid = false;
        });

        if (!valid || colors.length > 10) {
          t.state.user.cloudColors = oldColors;
          alert('Invalid Entry: (#4DEAA7,#00DD7E)  (< 10 colors)');
        } else if (t.io) M.SaveUser(t.state.user, t.io);

        t.setState({
          user: t.state.user
        });
      }, 5000);
    }
    /*
    setPos(e){
        var t = this;
        if (t.state.app && t.io) {
            t.state.user.cloudPosition = e.name;
            t.setState({ user: t.state.user });
            M.SaveUser(t.state.user, t.io);
        }
    }*/

  }, {
    key: "setLoc",
    value: function setLoc(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.cloudPosition = e;
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "setLife",
    value: function setLife(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.cloudLifetime = $(e.target).val();
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "setTotal",
    value: function setTotal(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.cloudTotal = $(e.target).val();
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "setMinWord",
    value: function setMinWord(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.cloudMinWord = $(e.target).val();
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "setMinEmote",
    value: function setMinEmote(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.cloudMinEmote = $(e.target).val();
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "clear",
    value: function clear() {
      var t = this;

      if (t.state.app && t.io && t.state.user) {
        t.io.Call('Clear', [t.state.user.twitch], function () {
          console.log('clear');
        });
      }
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      var lifetime = t.state.user.cloudLifetime ? t.state.user.cloudLifetime : 30;
      var total = t.state.user.cloudTotal ? t.state.user.cloudTotal : 10;
      var colors = t.state.user.cloudColors ? t.state.user.cloudColors : ['#57A9E8', '#0D80D9', '#6565EB', '#6565EB', '#4DEAA7', '#00DD7E'];
      var minWord = t.state.user.cloudMinWord ? t.state.user.cloudMinWord : 2;
      var minEmote = t.state.user.cloudMinEmote ? t.state.user.cloudMinEmote : 1;
      var divColors = [];
      var slink = 'https://twelve47.com/?stream=' + t.state.user.streamId + '&app=' + t.state.type.name;

      colors._each(function (x) {
        divColors.push(React.createElement("div", {
          className: "div-color",
          style: {
            backgroundColor: x
          }
        }));
      });

      if (!t.state.app) t.io = null;
      if (t.state.app && !t.io) t.io = new API(t.state.app.port, t.state.app.ip, false);
      return React.createElement("div", {
        className: 'div-cloud div-inner ' + (t.state.app != null ? 'active' : '')
      }, React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Clear all words/emotes: "), React.createElement("div", {
        "class": "btn",
        onClick: function onClick() {
          t.clear();
        }
      }, "Clear")), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Screen Position (click and drag): "), React.createElement(Position, {
        ref: "position",
        data: t.state.user.cloudPosition ? t.state.user.cloudPosition : {
          right: 0.95,
          bottom: 0.95
        },
        width: '14',
        height: "14",
        OnUpdate: function OnUpdate(e) {
          t.setLoc(e);
        }
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, React.createElement("span", null, "Colors "), divColors), React.createElement("input", {
        value: colors,
        onChange: function onChange(e) {
          t.setColors(e);
        }
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Max Emotes/Words on screen: "), React.createElement("input", {
        value: total,
        onChange: function onChange(e) {
          t.setTotal(e);
        },
        type: "number",
        min: "0",
        max: "100",
        step: "1"
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Chat Message Lifetime (sec): "), React.createElement("input", {
        value: lifetime,
        onChange: function onChange(e) {
          t.setLife(e);
        },
        type: "number",
        min: "5",
        max: "500",
        step: "1"
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Word Trigger Count: "), React.createElement("input", {
        value: minWord,
        onChange: function onChange(e) {
          t.setMinWord(e);
        },
        type: "number",
        min: "1",
        max: "100",
        step: "1"
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Emote Trigger Count: "), React.createElement("input", {
        value: minEmote,
        onChange: function onChange(e) {
          t.setMinEmote(e);
        },
        type: "number",
        min: "1",
        max: "100",
        step: "1"
      })), React.createElement("div", {
        className: "div-row single"
      }, React.createElement("div", {
        className: "hider",
        onClick: function onClick(e) {
          $(e.target).hide();
          $(e.target).parent().find('a').css('display', 'inline-block');
        }
      }, "- Click to Show App specific Link -"), React.createElement("a", {
        href: slink
      }, slink)));
    }
  }]);

  return Cloud;
}(React.Component);

var Combo =
/*#__PURE__*/
function (_React$Component5) {
  _inherits(Combo, _React$Component5);

  function Combo(props) {
    var _this5;

    _classCallCheck(this, Combo);

    _this5 = _possibleConstructorReturn(this, _getPrototypeOf(Combo).call(this));
    _this5.state = {
      type: props.type,
      user: props.user,
      app: props.app
    };
    return _this5;
  }

  _createClass(Combo, [{
    key: "connect",
    value: function connect() {
      var t = this;

      if (t.state.app) {
        if (!t.io) t.io = new API(t.state.app.port);
      }
    }
  }, {
    key: "setLoc",
    value: function setLoc(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.comboPosition = e;
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "setSize",
    value: function setSize(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.comboSize = e.value;
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      var mySize = t.state.user.comboSize != null ? t.state.user.comboSize : 1;
      var slink = 'https://twelve47.com/?stream=' + t.state.user.streamId + '&app=' + t.state.type.name;
      if (!t.state.app) t.io = null;
      if (t.state.app && !t.io) t.io = new API(t.state.app.port, t.state.app.ip, false);
      if (t.refs.ddSize) t.refs.ddSize.setState({
        val: mySize
      });
      return React.createElement("div", {
        className: 'div-combo div-inner ' + (t.state.app != null ? 'active' : '')
      }, React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Screen Position (click and drag): "), React.createElement(Position, {
        ref: "position",
        data: t.state.user.comboPosition ? t.state.user.comboPosition : {
          right: 0.95,
          bottom: 0.95
        },
        width: '16',
        height: "8",
        OnUpdate: function OnUpdate(e) {
          t.setLoc(e);
        }
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Size: "), React.createElement(DD, {
        ref: "ddSize",
        data: [{
          name: 'small',
          value: 0.75
        }, {
          name: 'medium',
          value: 1
        }, {
          name: 'large',
          value: 1.25
        }],
        val: "value",
        name: "name",
        OnChange: function OnChange(e) {
          t.setSize(e);
        }
      })), React.createElement("div", {
        className: "div-row single"
      }, React.createElement("div", {
        className: "hider",
        onClick: function onClick(e) {
          $(e.target).hide();
          $(e.target).parent().find('a').css('display', 'inline-block');
        }
      }, "- Click to Show App specific Link -"), React.createElement("a", {
        href: slink
      }, slink)));
    }
  }]);

  return Combo;
}(React.Component);

var Dash =
/*#__PURE__*/
function (_React$Component6) {
  _inherits(Dash, _React$Component6);

  function Dash() {
    var _this6;

    _classCallCheck(this, Dash);

    _this6 = _possibleConstructorReturn(this, _getPrototypeOf(Dash).call(this));
    _this6.state = {
      users: [{}],
      types: [],
      apps: [],
      activeUsers: {}
    };
    return _this6;
  }

  _createClass(Dash, [{
    key: "tog",
    value: function tog(e, u) {
      var t = this;
      M.UpdateAppInfo();
      t.state.activeUsers[u.twitch] = t.state.activeUsers[u.twitch] ? false : true;
      t.forceUpdate();
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      var adminApps = [];
      var iframeTxt1 = "<iframe style='width:100%;height:100%;' src='";
      var iframeTxt2 = "'></iframe>";

      if (M.user) {
        var u = M.user;
        if (t.state.activeUsers[u.twitch] == null) t.state.activeUsers[u.twitch] = true;

        t.state.users._each(function (u) {
          var tapps = [];
          var showLive = u.InActive != null && !u.InActive;

          if (t.state.activeUsers[u.twitch]) {
            t.state.types._each(function (x) {
              var showApp = false;
              if (x.beta && (M.user.access == 'admin' || M.user.access == 'beta')) showApp = true;
              if (!x.beta) showApp = true;

              if (showApp) {
                var app = t.state.apps._first(function (a) {
                  return a.type == x.name && a.twitch == u.twitch;
                });

                tapps.push(React.createElement("div", {
                  "class": "div-box div-img"
                }, React.createElement("img", {
                  src: S3 + '/twelve47/' + x.name + '.png'
                })));
                tapps.push(React.createElement(App, {
                  ref: x.name + u.twitch,
                  admin: true,
                  type: x,
                  user: u,
                  app: app
                }));
              }
            });
          }

          var userStuff = t.state.activeUsers[u.twitch] ? React.createElement("div", {
            className: 'div-user-stuff'
          }, " ", tapps, "  ") : null;
          adminApps.push(React.createElement("div", {
            className: "div-user"
          }, React.createElement("div", {
            className: "div-user-top"
          }, React.createElement("div", {
            className: 'div-live ' + (showLive ? 'active' : '')
          }), React.createElement("div", {
            className: "div-name"
          }, u.twitch), React.createElement("div", null, "Last Active: ", ''), React.createElement("i", {
            "class": "fas fa-caret-down",
            onClick: function onClick(e) {
              t.tog(e, u);
            }
          })), userStuff));
        });
      }

      return React.createElement("div", {
        className: "dash-page"
      }, React.createElement("div", {
        className: "div-left"
      }, React.createElement("div", {
        className: "div-title"
      }, "Dashboard"), React.createElement("div", {
        className: "dash-admin"
      }, adminApps)), React.createElement("div", {
        className: "div-right"
      }, React.createElement("div", {
        "class": "div-support"
      }, React.createElement("div", {
        onClick: function onClick() {
          return window.open("https://ko-fi.com/twelve47", "_blank");
        },
        "class": "div-promo div-coffee"
      }, React.createElement("i", {
        "class": "fa fa-coffee"
      }), " Buy Me a Coffee"), React.createElement("div", {
        onClick: function onClick() {
          return window.open("https://patreon.com/skivvy", "_blank");
        },
        "class": "div-promo div-patreon"
      }, React.createElement("i", {
        "class": "fab fa-patreon"
      }), " Patreon")), React.createElement("div", {
        "class": "div-box div-setup"
      }, React.createElement("div", {
        style: {
          fontSize: '20px',
          marginBottom: '10px'
        }
      }, "How To Setup (OBS)"), React.createElement("div", null, "- Turn On an app in your dashboard to the left."), React.createElement("div", null, "- Create new 'Browser' source in OBS w/ these settings."), React.createElement("div", null, "- Width: 1920, Height: 1080 ", React.createElement("span", {
        style: {
          fontWeight: 600
        }
      }, "(Important for quality)")), React.createElement("div", null, "- URL: see below"), React.createElement("div", null, "- Move and Resize window in OBS as needed"), React.createElement("div", {
        "class": "div-hide-parent"
      }, React.createElement("div", {
        "class": "div-hide",
        onClick: function onClick(e) {
          $(e.target).hide();
        }
      }, "Click To Show URL for OBS"), React.createElement("div", null, React.createElement("a", {
        href: 'https://twelve47.com/?stream=' + t.state.users[0].streamId
      }, "https://twelve47.com/?stream=", t.state.users[0].streamId))))));
      /*
                          <div style={{ fontSize: '20px', marginBottom: '10px', marginTop: '30px' }}>How To Setup (StreamElements Custom Overlay)</div>
                  <div>- Turn On an app in your dashboard to the left.</div>
                  <div>- Add Widget -&gt; Static/Custom -&gt; Custom Widget</div>
                  <div>- Position, size and style:  (Width: 1920, Height: 1080)</div>
                  <div>- Settings -&gt; Open Editor -&gt; Delete everything in HTML, CSS, JS, and Fields</div>
                  <div>- Copy and Paste the HTML below into the HTML section, and click DONE.</div>
                  <div class='div-hide-parent'>
                      <div class='div-hide' onClick={(e) => { $(e.target).hide(); }}>Click To Show HTML for StreamElements</div>
                      <div>{"<iframe style='width:100%;height:100%;' src='https://twelve47studios.com/?stream="+ t.state.users[0].streamId + "'></iframe>"}</div>
                  </div>
      */
    }
  }]);

  return Dash;
}(React.Component);

var DD =
/*#__PURE__*/
function (_React$Component7) {
  _inherits(DD, _React$Component7);

  function DD(props) {
    var _this7;

    _classCallCheck(this, DD);

    _this7 = _possibleConstructorReturn(this, _getPrototypeOf(DD).call(this));

    var t = _assertThisInitialized(_this7);

    t.state = {};
    t.state.data = props.data;
    t.state.style = {};
    return _this7;
  }

  _createClass(DD, [{
    key: "OnChange",
    value: function OnChange(e) {
      var t = this;
      var i = $(e.target).find('option:selected').attr('index');
      t.state.val = $(e.target).val();
      t.props.OnChange(t.state.data[i]);
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      var ops = [];

      for (var i = 0; i < t.state.data.length; i++) {
        var x = t.state.data[i];
        var select = t.state.val == x[t.props.val];
        if (select) ops.push(React.createElement("option", {
          selected: "true",
          index: i,
          value: x[t.props.val]
        }, x[t.props.name]));else ops.push(React.createElement("option", {
          index: i,
          value: x[t.props.val]
        }, x[t.props.name]));
      }

      return React.createElement("select", {
        style: t.state.style,
        onChange: function onChange(e) {
          return t.OnChange(e);
        }
      }, ops);
    }
  }]);

  return DD;
}(React.Component);

var FileSelect =
/*#__PURE__*/
function (_React$Component8) {
  _inherits(FileSelect, _React$Component8);

  function FileSelect(props) {
    var _this8;

    _classCallCheck(this, FileSelect);

    _this8 = _possibleConstructorReturn(this, _getPrototypeOf(FileSelect).call(this));
    _this8.state = {};
    return _this8;
  }

  _createClass(FileSelect, [{
    key: "UploadFile",
    value: function UploadFile(file, type) {
      var t = this;
      console.log(file);
      if (file.size > 100000) alert('File Size Too Large.  Keep it less than 1mb.  Image gets auto-resized.');else {
        var reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function () {
          console.log('load worked');
          var fileData = {
            file: reader.result,
            name: file.name,
            size: file.size,
            fileType: type
          };

          if (t.props.OnFile) {
            t.props.OnFile(fileData);
          }
        };
      }
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      var files = ['Engine', 'Car', 'Engine_Wheel', 'Car_Wheel'];
      var linkDivs = [];

      files._each(function (f) {
        var file = M.files._first(function (x) {
          return x.fileType == f;
        });

        var activeName = file != null ? file.name : 'Default';
        var div = React.createElement("div", {
          style: {
            display: 'inline-block',
            marginRight: '5px',
            marginBottom: '2px'
          }
        }, React.createElement("div", null, activeName), React.createElement("div", {
          className: "btn",
          onClick: function onClick(e) {
            $(e.target).next().click();
          }
        }, 'Choose ' + f + ' Img'), React.createElement("input", {
          style: {
            display: 'none'
          },
          onChange: function onChange(e) {
            t.UploadFile($(e.target)[0].files[0], f);
          },
          className: "inp-file",
          name: "file",
          type: "file"
        }));
        linkDivs.push(div);
      });

      return React.createElement("div", {
        className: 'div-file'
      }, React.createElement("div", null, linkDivs));
    }
  }]);

  return FileSelect;
}(React.Component);

var Hangman =
/*#__PURE__*/
function (_React$Component9) {
  _inherits(Hangman, _React$Component9);

  function Hangman(props) {
    var _this9;

    _classCallCheck(this, Hangman);

    _this9 = _possibleConstructorReturn(this, _getPrototypeOf(Hangman).call(this));
    _this9.state = {
      type: props.type,
      user: props.user,
      app: props.app
    };
    return _this9;
  }

  _createClass(Hangman, [{
    key: "start",
    value: function start(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.io.Call('StartGame', [t.state.user.twitch], function () {
          console.log('started game');
        });
      }
    }
  }, {
    key: "setTime",
    value: function setTime(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.hangmanTime = $(e.target).val();
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "setUser",
    value: function setUser(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.hangmanUser = $(e.target).val();
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "setPhrase",
    value: function setPhrase(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.hangmanPhrase = $(e.target).val();
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var t = this; //var myPos = t.state.user.comboPosition ? t.state.user.comboPosition : 'Bottom_Right';

      var user = t.state.user.hangmanUser ? t.state.user.hangmanUser : t.state.user.twitch;
      var time = t.state.user.hangmanTime ? t.state.user.hangmanTime : 30;
      var phrase = t.state.user.hangmanPhrase ? t.state.user.hangmanPhrase : 'test';
      if (!t.state.app) t.io = null;
      if (t.state.app && !t.io) t.io = new API(t.state.app.port, t.state.app.ip, false); //if (t.refs.ddPosition)
      //t.refs.ddPosition.setState({ val: myPos });

      return React.createElement("div", {
        className: 'div-combo div-inner ' + (t.state.app != null ? 'active' : '')
      }, React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Word or Phrase: "), React.createElement("input", {
        value: phrase,
        onChange: function onChange(e) {
          t.setPhrase(e);
        }
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Twitch User to be Hung: "), React.createElement("input", {
        value: user,
        onChange: function onChange(e) {
          t.setUser(e);
        }
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Voting Time Limit (seconds/round)"), React.createElement("input", {
        value: time,
        onChange: function onChange(e) {
          t.setTime(e);
        },
        type: "number",
        min: "0",
        max: "999",
        step: "1"
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Start a New Game: "), React.createElement("div", {
        "class": "btn",
        onClick: function onClick() {
          t.start();
        }
      }, "Start Game")));
    }
  }]);

  return Hangman;
}(React.Component);

var Planck =
/*#__PURE__*/
function (_React$Component10) {
  _inherits(Planck, _React$Component10);

  function Planck(props) {
    var _this10;

    _classCallCheck(this, Planck);

    _this10 = _possibleConstructorReturn(this, _getPrototypeOf(Planck).call(this));
    _this10.state = {
      type: props.type,
      user: props.user,
      app: props.app
    };
    return _this10;
  }

  _createClass(Planck, [{
    key: "render",
    value: function render() {
      var t = this;
      if (!t.state.app) t.io = null;
      if (t.state.app && !t.io) t.io = new API(t.state.app.port, t.state.app.ip, false);
      return React.createElement("div", {
        className: 'div-planck div-inner ' + (t.state.app != null ? 'active' : '')
      }, React.createElement("div", {
        className: "div-row"
      }, "Game Beta.  Testing"));
    }
  }]);

  return Planck;
}(React.Component);

var Position =
/*#__PURE__*/
function (_React$Component11) {
  _inherits(Position, _React$Component11);

  function Position(props) {
    var _this11;

    _classCallCheck(this, Position);

    _this11 = _possibleConstructorReturn(this, _getPrototypeOf(Position).call(this));
    _this11.state = {
      w: props.width ? Number(props.width) : 10,
      h: props.height ? Number(props.height) : 10,
      xpos: 0,
      ypos: 0
    };
    if (props.data.right != null) _this11.state.xpos = Number(props.data.right) * 112 - _this11.state.w;
    if (props.data.left != null) _this11.state.xpos = Number(props.data.left) * 112; //+ (this.state.w/2);

    if (props.data.top != null) _this11.state.ypos = Number(props.data.top) * 63; // + (this.state.h / 2);

    if (props.data.bottom != null) _this11.state.ypos = Number(props.data.bottom) * 63 - _this11.state.h;

    var t = _assertThisInitialized(_this11);

    console.log(_this11.state);
    UT.on('mouseup', 'a' + Math.random(), function () {
      t.boxClick();
    });
    return _this11;
  }

  _createClass(Position, [{
    key: "boxClick",
    value: function boxClick() {
      var t = this;

      if (t.state.grabbed) {
        t.setState({
          grabbed: false
        });
        clearInterval(t.ttDrag);

        if (t.props.OnUpdate) {
          var dxLeft = Math.abs(0 - t.state.xpos);
          var dxRight = Math.abs(0 - (t.state.xpos + t.state.w));
          var dxTop = Math.abs(0 - t.state.ypos);
          var dxBottom = Math.abs(0 - (t.state.ypos + t.state.h));
          var xdir = dxLeft < dxRight ? 'left' : 'right';
          var ydir = dxTop < dxBottom ? 'top' : 'bottom';
          var info = {//x: (t.state.xpos + t.state.w/2)/112,
            //y: (t.state.ypos + t.state.h/2)/63,
          };
          info[xdir] = dxLeft < dxRight ? t.state.xpos / 112 : (112 - (t.state.xpos + t.state.w)) / 112;
          info[ydir] = dxTop < dxBottom ? t.state.ypos / 63 : (63 - (t.state.ypos + t.state.h)) / 63;
          t.props.OnUpdate(info);
        }
      }
    }
  }, {
    key: "grab",
    value: function grab(e) {
      var t = this;
      var box = $(e.target).closest('.div-position');
      t.boxPos = box.offset();
      clearInterval(t.ttDrag);
      t.ttDrag = setInterval(function () {
        t.setState({
          grabbed: true
        });
        var x = Math.ceil((M.mx - 0 - t.boxPos.left) / 2) * 2;
        x = Math.min(x, box.width() - t.state.w);
        x = Math.max(x, 0);
        var y = Math.ceil((M.my - 0 - t.boxPos.top) / 2) * 2;
        y = Math.min(y, box.height() - t.state.h);
        y = Math.max(y, 0);
        t.setState({
          xpos: x,
          ypos: y
        });
      }, 150);
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      return React.createElement("div", {
        className: 'div-position ' + (t.state.grabbed ? 'grabbed' : '')
      }, React.createElement("div", {
        className: 'div-borders ',
        onMouseDown: function onMouseDown(e) {
          t.grab(e);
        },
        style: {
          top: t.state.ypos,
          left: t.state.xpos,
          width: t.state.w,
          height: t.state.h
        }
      }, React.createElement("div", {
        className: 'div-origin '
      })));
    }
  }]);

  return Position;
}(React.Component);

var Request =
/*#__PURE__*/
function (_React$Component12) {
  _inherits(Request, _React$Component12);

  function Request(props) {
    var _this12;

    _classCallCheck(this, Request);

    _this12 = _possibleConstructorReturn(this, _getPrototypeOf(Request).call(this));
    _this12.state = {
      type: props.type,
      user: props.user,
      app: props.app
    };
    return _this12;
  }

  _createClass(Request, [{
    key: "start",
    value: function start(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.io.Call('StartGame', [], function () {
          console.log('started game');
        });
      }
    }
  }, {
    key: "setTime",
    value: function setTime(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.hangmanTime = $(e.target).val();
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "setUser",
    value: function setUser(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.hangmanUser = $(e.target).val();
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "setPhrase",
    value: function setPhrase(e) {
      var t = this;

      if (t.state.app && t.io) {
        t.state.user.hangmanPhrase = $(e.target).val();
        t.setState({
          user: t.state.user
        });
        M.SaveUser(t.state.user, t.io);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var t = this; //var myPos = t.state.user.comboPosition ? t.state.user.comboPosition : 'Bottom_Right';

      var user = t.state.user.hangmanUser ? t.state.user.hangmanUser : t.state.user.twitch;
      var time = t.state.user.hangmanTime ? t.state.user.hangmanTime : 30;
      var phrase = t.state.user.hangmanPhrase ? t.state.user.hangmanPhrase : 'test';
      if (!t.state.app) t.io = null;
      if (t.state.app && !t.io) t.io = new API(t.state.app.port, t.state.app.ip, false); //if (t.refs.ddPosition)
      //t.refs.ddPosition.setState({ val: myPos });

      var link = 'https://twelve47.com/?stream=' + t.state.user.modId;
      return React.createElement("div", {
        className: 'div-request div-inner ' + (t.state.app != null ? 'active' : '')
      }, React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Moderation Link (Not for OBS): "), React.createElement("div", {
        style: {
          overflowWrap: 'break-word'
        }
      }, React.createElement("a", {
        href: link
      }, link))));
    }
  }]);

  return Request;
}(React.Component);

var Score =
/*#__PURE__*/
function (_React$Component13) {
  _inherits(Score, _React$Component13);

  function Score(props) {
    var _this13;

    _classCallCheck(this, Score);

    _this13 = _possibleConstructorReturn(this, _getPrototypeOf(Score).call(this));
    _this13.state = {
      type: props.type,
      user: props.user,
      app: props.app
    };
    return _this13;
  }

  _createClass(Score, [{
    key: "setColor",
    value: function setColor(e, nme) {
      var t = this;
      console.log($(e.target).val());
      clearTimeout(t.ttSave);
      t.state.user[nme] = $(e.target).val();
      t.setState({
        user: t.state.user
      });
      t.ttSave = setTimeout(function () {
        var valid = true;
        var c = t.state.user[nme];
        if (!/[0-9A-Fa-f]{6}/g.test(c.substring(1))) valid = false;

        if (!valid) {
          t.state.user[nme] = null;
          t.setState({
            user: t.state.user
          });
          alert('Invalid Entry:  wrong format');
        } else M.SaveUser(t.state.user, t.io);
      }, 3000);
    }
  }, {
    key: "setWidth",
    value: function setWidth(e) {
      var t = this;
      clearTimeout(t.ttSave);
      t.state.user.scoreWidth = $(e.target).val();
      t.setState({
        user: t.state.user
      });
      t.ttSave = setTimeout(function () {
        M.SaveUser(t.state.user, t.io);
      }, 3000);
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      var total = t.state.user.scoreWidth ? t.state.user.scoreWidth : 500;
      var color1 = t.state.user.scoreColor1 ? t.state.user.scoreColor1 : '#1e1630'; //, '#eee1c9'];

      var color2 = t.state.user.scoreColor2 ? t.state.user.scoreColor2 : '#000000'; //, '#eee1c9'];

      var color3 = t.state.user.scoreFontColor ? t.state.user.scoreFontColor : '#fffaf0'; //, '#eee1c9'];

      var slink = 'https://twelve47.com/?stream=' + t.state.user.streamId + '&app=' + t.state.type.name;
      var divColor1 = React.createElement("div", {
        className: "div-color",
        style: {
          backgroundColor: color1
        }
      });
      var divColor2 = React.createElement("div", {
        className: "div-color",
        style: {
          backgroundColor: color2
        }
      });
      var divColor3 = React.createElement("div", {
        className: "div-color",
        style: {
          backgroundColor: color3
        }
      });
      if (!t.state.app) t.io = null;
      if (t.state.app && !t.io) t.io = new API(t.state.app.port, t.state.app.ip, false);
      return React.createElement("div", {
        className: 'div-planck div-inner ' + (t.state.app != null ? 'active' : '')
      }, React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Fixed Width: "), React.createElement("input", {
        value: total,
        onChange: function onChange(e) {
          t.setWidth(e);
        },
        type: "number",
        min: "0",
        max: "2000",
        step: "1"
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, React.createElement("span", null, "Color 1"), divColor1), React.createElement("input", {
        value: color1,
        onChange: function onChange(e) {
          t.setColor(e, 'scoreColor1');
        }
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, React.createElement("span", null, "Color 2"), divColor2), React.createElement("input", {
        value: color2,
        onChange: function onChange(e) {
          t.setColor(e, 'scoreColor2');
        }
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, React.createElement("span", null, "Font Color"), divColor3), React.createElement("input", {
        value: color3,
        onChange: function onChange(e) {
          t.setColor(e, 'scoreFontColor');
        }
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "!scoreboard Zain, Mang0, Winners Finals "), React.createElement("div", null, "(player, player, title)")), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "!scoreboard 1,0 "), React.createElement("div", null, "(p1 score, p2 score)")), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "!scoreboard 0,0,2,2 "), React.createElement("div", null, "(p1 score, p2 score, p1 sets, p2 sets)")), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "!scoreboard -,- "), React.createElement("div", null, "(no scores / friendlies)")), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "!scoreboard clear"), React.createElement("div", null, "(removes the overlay)")), React.createElement("div", {
        className: "div-row single"
      }, React.createElement("div", {
        className: "hider",
        onClick: function onClick(e) {
          $(e.target).hide();
          $(e.target).parent().find('a').css('display', 'inline-block');
        }
      }, "- Click to Show App specific Link -"), React.createElement("a", {
        href: slink
      }, slink)));
    }
  }]);

  return Score;
}(React.Component);

var Train =
/*#__PURE__*/
function (_React$Component14) {
  _inherits(Train, _React$Component14);

  function Train(props) {
    var _this14;

    _classCallCheck(this, Train);

    _this14 = _possibleConstructorReturn(this, _getPrototypeOf(Train).call(this));
    _this14.state = {
      type: props.type,
      user: props.user,
      app: props.app
    };
    return _this14;
  }

  _createClass(Train, [{
    key: "setColor",
    value: function setColor(e, nme) {
      var t = this;
      clearTimeout(t.ttSave);
      t.state.user[nme] = $(e.target).val();
      t.setState({
        user: t.state.user
      });
      t.ttSave = setTimeout(function () {
        var valid = true;
        var c = t.state.user[nme];
        if (!/[0-9A-Fa-f]{6}/g.test(c.substring(1))) valid = false;

        if (!valid) {
          t.state.user[nme] = null;
          t.setState({
            user: t.state.user
          });
          alert('Invalid Entry:  wrong format');
        } else M.SaveUser(t.state.user, t.io);
      }, 3000);
    }
  }, {
    key: "setEmote",
    value: function setEmote(e) {
      var t = this;
      var nme = 'trainEmote';
      clearTimeout(t.ttSave);
      t.state.user[nme] = $(e.target).val();
      t.setState({
        user: t.state.user
      });
      t.ttSave = setTimeout(function () {
        var valid = true;
        M.SaveUser(t.state.user, t.io);
      }, 3000);
    }
  }, {
    key: "test",
    value: function test() {
      var t = this;

      if (t.state.app && t.io && t.state.user) {
        t.io.Call('Test', t.state.user.twitch, function () {
          alert('Test Train should show up in a few seconds.');
          console.log('tested');
        });
      }
    }
  }, {
    key: "setFile",
    value: function setFile(fileData) {
      var t = this;

      if (t.state.user) {
        fileData.loginId = M.user.loginId;
        fileData.user = t.state.user;
        ioLogin.Call('FileUpload', [M.user.loginId, fileData], function (files) {
          M.files = files;
          t.forceUpdate();

          if (t.io) {
            //causes refresh of page
            t.io.Call('NeedsReset', [M.user.twitch], function () {
              console.log('saved & updated');
            });
          }
        });
      }
    }
  }, {
    key: "setOffset",
    value: function setOffset(e, type) {
      var t = this;
      console.log($(e.target).val());
      t.state.user[type] = $(e.target).val();
      t.setState({
        user: t.state.user
      });

      if (!isNaN($(e.target).val()) && $(e.target).val().length > 0) {
        console.log('helo');
        clearTimeout(t.ttSave);
        t.state.user[type] = Number($(e.target).val());
        t.setState({
          user: t.state.user
        });
        t.ttSave = setTimeout(function () {
          M.SaveUser(t.state.user, t.io);
        }, 3000);
      }
    }
  }, {
    key: "resetToDefault",
    value: function resetToDefault() {
      var t = this;
      t.state.user.trainConductorX = null;
      t.state.user.trainConductorY = null;
      t.state.user.trainEmoteH = null;
      t.state.user.trainEmoteX = null;
      t.state.user.trainEmoteY = null;
      t.state.user.trainWheelH = null;
      t.state.user.trainWheelX = null;
      t.state.user.trainWheelY = null;
      t.state.user.trainSmokeX = null;
      t.state.user.trainSmokeY = null;
      t.setState({
        user: t.state.user
      });
      clearTimeout(t.ttSave);
      ioLogin.Call('ClearFiles', [M.user.loginId, t.state.user.twitch], function () {
        t.forceUpdate();
        M.files = [];
      });
      t.ttSave = setTimeout(function () {
        M.SaveUser(t.state.user, t.io);
      }, 3000);
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      var restricted = M.user.access == '1' ? 'restricted' : null;
      var color = t.state.user.trainColor ? t.state.user.trainColor : '#ff0000'; //, '#eee1c9'];

      var emote = t.state.user.trainEmote ? t.state.user.trainEmote : 'random'; //, '#eee1c9'];

      var slink = 'https://twelve47.com/?stream=' + t.state.user.streamId + '&app=' + t.state.type.name;
      var trainConductorX = t.state.user.trainConductorX != null ? t.state.user.trainConductorX : 0;
      var trainConductorY = t.state.user.trainConductorY != null ? t.state.user.trainConductorY : 0;
      var trainEmoteH = t.state.user.trainEmoteH != null ? t.state.user.trainEmoteH : 40;
      var trainEmoteX = t.state.user.trainEmoteX != null ? t.state.user.trainEmoteX : 0;
      var trainEmoteY = t.state.user.trainEmoteY != null ? t.state.user.trainEmoteY : 0;
      var trainWheelH = t.state.user.trainWheelH != null ? t.state.user.trainWheelH : 60;
      var trainWheelX = t.state.user.trainWheelX != null ? t.state.user.trainWheelX : 0;
      var trainWheelY = t.state.user.trainWheelY != null ? t.state.user.trainWheelY : 0;
      var trainSmokeX = t.state.user.trainSmokeX != null ? t.state.user.trainSmokeX : 0;
      var trainSmokeY = t.state.user.trainSmokeY != null ? t.state.user.trainSmokeY : 0;
      if (!t.state.app) t.io = null;
      if (t.state.app && !t.io) t.io = new API(t.state.app.port, t.state.app.ip, false);
      return React.createElement("div", {
        className: 'div-planck div-inner ' + (t.state.app != null ? 'active' : '')
      }, React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Color: "), React.createElement("input", {
        value: color,
        onChange: function onChange(e) {
          t.setColor(e, 'trainColor');
        }
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Conductor Twitch Emote: "), React.createElement("input", {
        value: emote,
        onChange: function onChange(e) {
          t.setEmote(e);
        }
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "Test Train: "), React.createElement("div", {
        "class": "btn",
        onClick: function onClick() {
          t.test();
        }
      }, "Test")), React.createElement("div", {
        className: 'div-row single'
      }, React.createElement("div", {
        className: 'div-restricted ' + (M.user.access == '1' ? 'restricted' : '')
      }, React.createElement("div", {
        className: "div-promo div-coffee",
        onClick: function onClick() {
          window.open('https://ko-fi.com/s/91a2e79f05', '_blank').focus();
        }
      }, React.createElement("i", {
        "class": "fa fa-coffee"
      }), " Use Custom Images")), React.createElement(FileSelect, {
        ref: "fileSelect",
        OnFile: function OnFile(e) {
          t.setFile(e);
        }
      })), React.createElement("div", {
        className: 'div-row offsets single'
      }, React.createElement("div", {
        className: 'div-restricted ' + (M.user.access == '1' ? 'restricted' : '')
      }), React.createElement("div", {
        className: "div-offsets"
      }, React.createElement("div", {
        style: {
          display: 'inline-block',
          marginRight: '10px'
        }
      }, React.createElement("div", null, "conductor x offset"), React.createElement("input", {
        value: trainConductorX,
        onChange: function onChange(e) {
          t.setOffset(e, 'trainConductorX');
        }
      })), React.createElement("div", {
        style: {
          display: 'inline-block',
          marginRight: '10px'
        }
      }, React.createElement("div", null, "conductor y offset"), React.createElement("input", {
        value: trainConductorY,
        onChange: function onChange(e) {
          t.setOffset(e, 'trainConductorY');
        }
      })), React.createElement("div", null), React.createElement("div", {
        style: {
          display: 'inline-block',
          marginRight: '10px'
        }
      }, React.createElement("div", null, "emote horiz. separation"), React.createElement("input", {
        value: trainEmoteH,
        onChange: function onChange(e) {
          t.setOffset(e, 'trainEmoteH');
        }
      })), React.createElement("div", {
        style: {
          display: 'inline-block',
          marginRight: '10px'
        }
      }, React.createElement("div", null, "emote x offset"), React.createElement("input", {
        value: trainEmoteX,
        onChange: function onChange(e) {
          t.setOffset(e, 'trainEmoteX');
        }
      })), React.createElement("div", {
        style: {
          display: 'inline-block',
          marginRight: '10px'
        }
      }, React.createElement("div", null, "emote y offset"), React.createElement("input", {
        value: trainEmoteY,
        onChange: function onChange(e) {
          t.setOffset(e, 'trainEmoteY');
        }
      })), React.createElement("div", {
        style: {
          display: 'inline-block',
          marginRight: '10px'
        }
      }, React.createElement("div", null, "wheel horiz. separation"), React.createElement("input", {
        value: trainWheelH,
        onChange: function onChange(e) {
          t.setOffset(e, 'trainWheelH');
        }
      })), React.createElement("div", {
        style: {
          display: 'inline-block',
          marginRight: '10px'
        }
      }, React.createElement("div", null, "wheel x offset"), React.createElement("input", {
        value: trainWheelX,
        onChange: function onChange(e) {
          t.setOffset(e, 'trainWheelX');
        }
      })), React.createElement("div", {
        style: {
          display: 'inline-block',
          marginRight: '10px'
        }
      }, React.createElement("div", null, "wheel y offset"), React.createElement("input", {
        value: trainWheelY,
        onChange: function onChange(e) {
          t.setOffset(e, 'trainWheelY');
        }
      })), React.createElement("div", {
        style: {
          display: 'inline-block',
          marginRight: '10px'
        }
      }, React.createElement("div", null, "smoke x offset"), React.createElement("input", {
        value: trainSmokeX,
        onChange: function onChange(e) {
          t.setOffset(e, 'trainSmokeX');
        }
      })), React.createElement("div", {
        style: {
          display: 'inline-block',
          marginRight: '10px'
        }
      }, React.createElement("div", null, "smoke y offset"), React.createElement("input", {
        value: trainSmokeY,
        onChange: function onChange(e) {
          t.setOffset(e, 'trainSmokeY');
        }
      })))), React.createElement("div", {
        className: 'div-row'
      }, React.createElement("div", null, "Reset Defaults: "), React.createElement("div", {
        "class": "btn",
        onClick: function onClick() {
          t.resetToDefault();
        }
      }, "Reset")), React.createElement("div", {
        className: "div-row single"
      }, React.createElement("div", {
        className: "hider",
        onClick: function onClick(e) {
          $(e.target).hide();
          $(e.target).parent().find('a').css('display', 'inline-block');
        }
      }, "- Click to Show App specific Link -"), React.createElement("a", {
        href: slink
      }, slink)));
    }
  }]);

  return Train;
}(React.Component);

var Wheel =
/*#__PURE__*/
function (_React$Component15) {
  _inherits(Wheel, _React$Component15);

  function Wheel(props) {
    var _this15;

    _classCallCheck(this, Wheel);

    _this15 = _possibleConstructorReturn(this, _getPrototypeOf(Wheel).call(this));
    _this15.state = {
      type: props.type,
      user: props.user,
      app: props.app
    };
    return _this15;
  }

  _createClass(Wheel, [{
    key: "setTimer",
    value: function setTimer(e, nme) {
      var t = this;
      clearTimeout(t.ttSave);
      t.state.user[nme] = $(e.target).val();
      t.setState({
        user: t.state.user
      });
      t.ttSave = setTimeout(function () {
        M.SaveUser(t.state.user, t.io);
      }, 3000);
    }
  }, {
    key: "setPoints",
    value: function setPoints(e, nme) {
      var t = this;
      clearTimeout(t.ttSave);
      t.state.user[nme] = $(e.target).val();
      t.setState({
        user: t.state.user
      });
      t.ttSave = setTimeout(function () {
        M.SaveUser(t.state.user, t.io);
      }, 3000);
    }
  }, {
    key: "render",
    value: function render() {
      var t = this;
      var isRestricted = M.user.access != 'admin' && M.user.access != 'beta';
      var restricted = M.user.access == '1' ? 'restricted' : null;
      var slink = 'https://twelve47.com/?stream=' + t.state.user.streamId + '&app=' + t.state.type.name;
      var timer = t.state.user.wheelTimer ? t.state.user.wheelTimer : 120; //, '#eee1c9'];

      var points = t.state.user.wheelPointsToSpin ? t.state.user.wheelPointsToSpin : 20000;
      if (!t.state.app) t.io = null;
      if (t.state.app && !t.io) t.io = new API(t.state.app.port, t.state.app.ip, false);
      return React.createElement("div", {
        className: 'div-planck div-inner ' + (t.state.app != null ? 'active' : '')
      }, React.createElement("div", {
        className: 'div-row'
      }, React.createElement("div", null, "Countdown Timer (seconds): "), React.createElement("input", {
        value: timer,
        onChange: function onChange(e) {
          t.setTimer(e, 'wheelTimer');
        }
      })), React.createElement("div", {
        className: 'div-row'
      }, React.createElement("div", null, "Channel Points To Spin: "), React.createElement("input", {
        type: "number",
        min: "5",
        max: "99000000",
        value: points,
        onChange: function onChange(e) {
          t.setPoints(e, 'wheelPointsToSpin');
        }
      })), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "!wheel spin "), React.createElement("div", null, "Test Spins the Wheel")), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "!wheel add Your Text Here "), React.createElement("div", null, "Adds a new Wedge")), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "!wheel 0 0.1 "), React.createElement("div", null, "Edits Percentage of Wedge 0")), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "!wheel 1 New Text Here "), React.createElement("div", null, "Edits Text of Wedge 1")), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "!wheel remove 2 "), React.createElement("div", null, "Removes Wedge 2")), React.createElement("div", {
        className: "div-row"
      }, React.createElement("div", null, "!wheel swap "), React.createElement("div", null, "Swaps between Wheel 1 & 2")), React.createElement("div", {
        className: "div-row single"
      }, React.createElement("div", {
        className: "hider",
        onClick: function onClick(e) {
          $(e.target).hide();
          $(e.target).parent().find('a').css('display', 'inline-block');
        }
      }, "- Click to Show App specific Link -"), React.createElement("a", {
        href: slink
      }, slink)));
    }
  }]);

  return Wheel;
}(React.Component);