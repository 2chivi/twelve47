//LINQ 1.3 : Fix inherit != null

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

