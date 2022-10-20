
var FR = {

    LeftDistance: [],
    //index:0,
    DoneCount: 0,
    lastSize: $(window).width(),


    Init: function () {

        var colors = [];
        $('.div-swatch').each((e, e2) => {
            colors.push($(e2).css('background-color'));
        });

        $(window).resize(function () {
            if (Math.abs(FR.lastSize - $(window).width()) > 50) {
                FR.lastSize = $(window).width();
                FR.LeftDistance = [];

                for (var i = $('.f-lefter').length - 1; i >= 0; i--) {
                    if ($($('.f-lefter')[i]).width() > 5)
                        FR.LeftDistance.push(i * 8);
                    else
                        FR.LeftDistance.push(i * 4);
                }

                clearTimeout(FR.ttChangeBasic);
                FR.ttChangeBasic = setTimeout(function () {
                    FR.HandleColorChange(FR.index != null ? FR.index : 0, true);
                }, 200);
            }
        });

        //original positions
        $('.f-lefter').each((e, e2) => {
            FR.LeftDistance.push($(e2).offset().left);
            $(e2).css('opacity', 0);
        })

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

        })
    },

    HandleColorChange: function (index, force) {
        if (index == FR.index && force == null) return;


        $('.fas,.fab').css('color', FR.cdata[index].light2);
        $('.div-circle').css('background-color', FR.cdata[index].light);

        $('.div-fbox').css('background-color', FR.cdata[index].dark);
        $('.title2').css('color', FR.cdata[index].light3);
        $('#email').css('color', FR.cdata[index].comp);
        $('.f-pages').css('box-shadow', '0 0 2px 2px ' + FR.cdata[index].dark3)

        $('.f-lefter').each((e, e2) => {
            $(e2).css('opacity', 0.95)
        })

        if (FR.DoneCount == 0) {
            FR.index = index;

            FR.SwapAll(-1, -50, function () {

                $('.div-test4').css('background-color', FR.cdata[FR.index].left4);
                $('.div-test3').css('background-color', FR.cdata[FR.index].left3);
                $('.div-test2').css('background-color', FR.cdata[FR.index].left2);
                $('.div-test1').css('background-color', FR.cdata[FR.index].left1);
                FR.SwapAll(1, 0, function () { });
            });
        } else {
            clearTimeout(FR.ttTrySwap);

            FR.ttTrySwap = setTimeout(function () {
                FR.HandleColorChange(index);
            }, 100)
        }

    },

    SwapAll: function (dir, target, done) {
        var count = dir == 1 ? $('.f-lefter').length - 1 : 0;
        FR.DoneCount = 4;


        for (var i = 0; i < $('.f-lefter').length; i++) {

            setTimeout(function () {
                if (target == 0)
                    FR.Swap($('.f-lefter')[count], 6 * dir, FR.LeftDistance[count], function () {
                        FR.DoneCount--;
                        if (FR.DoneCount <= 0) { FR.stillSwapping = false; done(); }
                    });
                else {
                    FR.Swap($('.f-lefter')[count], 6 * dir, target, function () {
                        FR.DoneCount--;
                        if (FR.DoneCount <= 0) { FR.stillSwapping = false; done(); }
                    });
                }

                count = dir == 1 ? (count - 1) : (count + 1);
            }, i * 100)
        }
    },

    Swap: function (e, rate, target, done) {
        var left = $(e).offset().left;

        if ($(e).width() < 6)
            rate = Math.ceil(rate * 0.75);

        if ((rate > 0 && left < target) || (rate < 0 && left > target)) {
            $(e).offset({ left: left + rate });
            setTimeout(function () { FR.Swap(e, rate, target, done) }, 10);

        } else {
            $(e).offset({ left: target });
            done();
        }
    },

    ColorData: function (colors) {
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
    Contrast: function (hash, pct, desaturate = 0) {
        var tc = tinycolor(hash).desaturate(desaturate);
        var dir = (tc.getLuminance() - (1 * pct)) > 0 ? 1 : -1;
        //var grey = tinycolor(hash).desaturate(desaturate).greyscale();

        if (dir == 1) {
            while ((tc.getLuminance() - (1 * pct)) > 0) {
                tc = tc.darken(1);
            }
        } else if (dir == -1) {
            while ((tc.getLuminance() - (1 * pct)) < 0) {
                tc = tc.lighten(1);
            }
        }

        return tc.toHexString();
    },
};