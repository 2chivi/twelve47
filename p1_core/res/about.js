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
"use strict";

var FR = {
  LeftDistance: [],
  //index:0,
  DoneCount: 0,
  lastSize: $(window).width(),
  Init: function Init() {
    var colors = [];
    $('.div-swatch').each(function (e, e2) {
      colors.push($(e2).css('background-color'));
    });
    $(window).resize(function () {
      if (Math.abs(FR.lastSize - $(window).width()) > 50) {
        FR.lastSize = $(window).width();
        FR.LeftDistance = [];

        for (var i = $('.f-lefter').length - 1; i >= 0; i--) {
          if ($($('.f-lefter')[i]).width() > 5) FR.LeftDistance.push(i * 8);else FR.LeftDistance.push(i * 4);
        }

        clearTimeout(FR.ttChangeBasic);
        FR.ttChangeBasic = setTimeout(function () {
          FR.HandleColorChange(FR.index != null ? FR.index : 0, true);
        }, 200);
      }
    }); //original positions

    $('.f-lefter').each(function (e, e2) {
      FR.LeftDistance.push($(e2).offset().left);
      $(e2).css('opacity', 0);
    });
    FR.SwapAll(-1, -50, function () {
      FR.HandleColorChange(0);
    });
    FR.ColorData(colors);
    $('.div-swatch').on('mouseover', function (e, e2) {
      var targ = $(e.target);
      clearTimeout(FR.ttChangeBasic);
      FR.ttChangeBasic = setTimeout(function () {
        FR.HandleColorChange($(targ).index());
      }, 150);
    });
  },
  HandleColorChange: function HandleColorChange(index, force) {
    if (index == FR.index && force == null) return;
    $('.fas,.fab').css('color', FR.cdata[index].light2);
    $('.div-circle').css('background-color', FR.cdata[index].light);
    $('.div-fbox').css('background-color', FR.cdata[index].dark);
    $('.title2').css('color', FR.cdata[index].light3);
    $('#email').css('color', FR.cdata[index].comp);
    $('.f-pages').css('box-shadow', '0 0 2px 2px ' + FR.cdata[index].dark3);
    $('.f-lefter').each(function (e, e2) {
      $(e2).css('opacity', 0.95);
    });

    if (FR.DoneCount == 0) {
      FR.index = index;
      FR.SwapAll(-1, -50, function () {
        $('.div-test4').css('background-color', FR.cdata[FR.index].left4);
        $('.div-test3').css('background-color', FR.cdata[FR.index].left3);
        $('.div-test2').css('background-color', FR.cdata[FR.index].left2);
        $('.div-test1').css('background-color', FR.cdata[FR.index].left1);
        FR.SwapAll(1, 0, function () {});
      });
    } else {
      clearTimeout(FR.ttTrySwap);
      FR.ttTrySwap = setTimeout(function () {
        FR.HandleColorChange(index);
      }, 100);
    }
  },
  SwapAll: function SwapAll(dir, target, done) {
    var count = dir == 1 ? $('.f-lefter').length - 1 : 0;
    FR.DoneCount = 4;

    for (var i = 0; i < $('.f-lefter').length; i++) {
      setTimeout(function () {
        if (target == 0) FR.Swap($('.f-lefter')[count], 6 * dir, FR.LeftDistance[count], function () {
          FR.DoneCount--;

          if (FR.DoneCount <= 0) {
            FR.stillSwapping = false;
            done();
          }
        });else {
          FR.Swap($('.f-lefter')[count], 6 * dir, target, function () {
            FR.DoneCount--;

            if (FR.DoneCount <= 0) {
              FR.stillSwapping = false;
              done();
            }
          });
        }
        count = dir == 1 ? count - 1 : count + 1;
      }, i * 100);
    }
  },
  Swap: function Swap(e, rate, target, done) {
    var left = $(e).offset().left;
    if ($(e).width() < 6) rate = Math.ceil(rate * 0.75);

    if (rate > 0 && left < target || rate < 0 && left > target) {
      $(e).offset({
        left: left + rate
      });
      setTimeout(function () {
        FR.Swap(e, rate, target, done);
      }, 10);
    } else {
      $(e).offset({
        left: target
      });
      done();
    }
  },
  ColorData: function ColorData(colors) {
    FR.cdata = [];

    for (var i = 0; i < colors.length; i++) {
      var data = {};
      var tc = tinycolor(colors[i]);
      data.color = colors[i];
      data.comp = FR.Contrast(tc.complement().toHexString(), 0.8, 20);
      data.dark = FR.Contrast(data.color, 0.014, 94.4);
      data.dark2 = FR.Contrast(data.color, 0.02, 20);
      data.dark3 = FR.Contrast(data.color, 0.005, 50);
      data.light = FR.Contrast(data.color, 0.5, 50);
      data.light2 = FR.Contrast(data.color, 0.3, 5);
      data.light3 = FR.Contrast(data.color, 0.8, 15);
      data.left4 = FR.Contrast(data.color, 0.65, 70);
      data.left3 = FR.Contrast(data.color, 0.2, 80);
      data.left2 = FR.Contrast(data.color, 0.02, 75);
      data.left1 = FR.Contrast(data.color, 0.005, 70);
      FR.cdata.push(data);
    }
  },
  //pct is 0 dark 1 white?
  Contrast: function Contrast(hash, pct) {
    var desaturate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var tc = tinycolor(hash).desaturate(desaturate);
    var dir = tc.getLuminance() - 1 * pct > 0 ? 1 : -1; //var grey = tinycolor(hash).desaturate(desaturate).greyscale();

    if (dir == 1) {
      while (tc.getLuminance() - 1 * pct > 0) {
        tc = tc.darken(1);
      }
    } else if (dir == -1) {
      while (tc.getLuminance() - 1 * pct < 0) {
        tc = tc.lighten(1);
      }
    }

    return tc.toHexString();
  }
};
$(function () {
  M.Init();
});
var M = {
  Init: function Init() {
    FR.Init();
  }
};