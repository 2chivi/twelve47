
class Train extends React.Component {

    constructor(props) {
        super();
        this.state = {
            type: props.type,
            user: props.user,
            app: props.app
        };
    }

    setColor(e, nme) {
        var t = this;
        clearTimeout(t.ttSave);
        
        t.state.user[nme] = $(e.target).val();
        t.setState({ user: t.state.user });
        t.ttSave = setTimeout(function () {
            var valid = true;
            var c = t.state.user[nme];
            if (!(/[0-9A-Fa-f]{6}/g).test(c.substring(1)))
                valid = false;
            if (!valid) {
                t.state.user[nme] = null;
                t.setState({ user: t.state.user });
                alert('Invalid Entry:  wrong format')
            }
            else
                M.SaveUser(t.state.user, t.io);
        }, 3000);
    }

    setEmote(e){
        var t = this;
        var nme = 'trainEmote';
        clearTimeout(t.ttSave);
        t.state.user[nme] = $(e.target).val();
        t.setState({ user: t.state.user });

        t.ttSave = setTimeout(function () {
            var valid = true;
            M.SaveUser(t.state.user, t.io);
        }, 3000);
    }

    test() {
        var t = this;
        if (t.state.app && t.io && t.state.user) {
            t.io.Call('Test', t.state.user.twitch, function () {
                alert('Test Train should show up in a few seconds.');
                console.log('tested');
            });
        }
    }

    setFile(fileData){
        var t = this;
        if (t.state.user) {
            fileData.loginId = M.user.loginId;
            fileData.user = t.state.user;

            ioLogin.Call('FileUpload', [M.user.loginId, fileData], function(files){
                M.files = files;
                t.forceUpdate();

                if(t.io){ //causes refresh of page
                    t.io.Call('NeedsReset', [M.user.twitch], function () {
                        console.log('saved & updated');
                    });
                }
            });
        }
    }

    setOffset(e, type){
        var t = this;
        console.log($(e.target).val());
        t.state.user[type] = $(e.target).val();
        t.setState({ user: t.state.user });

        if (!isNaN($(e.target).val()) && $(e.target).val().length > 0){
            console.log('helo');

            clearTimeout(t.ttSave);
            t.state.user[type] = Number($(e.target).val());
            t.setState({ user: t.state.user });

            t.ttSave = setTimeout(function () {
                M.SaveUser(t.state.user, t.io);
            }, 3000);
        }
    }

    resetToDefault(){
        var t= this;
        
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
        
        t.setState({ user: t.state.user });
        clearTimeout(t.ttSave);

        ioLogin.Call('ClearFiles', [M.user.loginId, t.state.user.twitch], function(){  
            t.forceUpdate();
            M.files = [];
        });

        t.ttSave = setTimeout(function () {
            M.SaveUser(t.state.user, t.io);
        }, 3000);
    }

    render() {
        var t = this;
        var restricted = M.user.access == '1' ? 'restricted' : null;
        var color = t.state.user.trainColor ? t.state.user.trainColor : '#ff0000';//, '#eee1c9'];
        var emote = t.state.user.trainEmote ? t.state.user.trainEmote : 'random';//, '#eee1c9'];
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

        if (!t.state.app)
            t.io = null;
        if (t.state.app && !t.io)
            t.io = new API(t.state.app.port, t.state.app.ip, false);

        return <div className={'div-planck div-inner ' + (t.state.app != null ? 'active' : '')}>
            <div className='div-row'>
                <div>Color: </div>
                <input value={color} onChange={(e) => { t.setColor(e, 'trainColor'); }} ></input>
            </div>
            <div className='div-row'>
                <div>Conductor Twitch Emote: </div>
                <input value={emote} onChange={(e) => { t.setEmote(e); }} ></input>
            </div>
            <div className='div-row'>
                <div>Test Train: </div>
                <div class='btn' onClick={() => { t.test(); }}>Test</div>
            </div>

            <div className={'div-row single'}>
                <div className={'div-restricted ' + (M.user.access == '1' ? 'restricted': '')}>
                    <div className='div-promo div-coffee' onClick={() => { window.open('https://ko-fi.com/s/91a2e79f05', '_blank').focus(); }}><i class="fa fa-coffee"></i> Use Custom Images</div>
                </div>
                <FileSelect ref='fileSelect' OnFile={(e)=> { t.setFile(e); }} />
            </div>
            <div className={'div-row offsets single'}>
                <div className={'div-restricted ' + (M.user.access == '1' ? 'restricted' : '')}></div>
                <div className='div-offsets'>
                    <div style={{ display: 'inline-block', marginRight: '10px' }}>
                        <div>conductor x offset</div>
                        <input value={trainConductorX} onChange={(e) => { t.setOffset(e, 'trainConductorX'); }} ></input>
                    </div>
                    <div style={{ display: 'inline-block', marginRight: '10px' }}>
                        <div>conductor y offset</div>
                        <input value={trainConductorY} onChange={(e) => { t.setOffset(e, 'trainConductorY'); }} ></input>
                    </div>
                    <div></div>

                    <div style={{display:'inline-block', marginRight:'10px'}}>
                        <div>emote horiz. separation</div>
                        <input value={trainEmoteH} onChange={(e) => { t.setOffset(e, 'trainEmoteH'); }} ></input>
                    </div>
                    <div style={{ display: 'inline-block', marginRight: '10px' }}>
                        <div>emote x offset</div>
                        <input value={trainEmoteX} onChange={(e) => { t.setOffset(e, 'trainEmoteX'); }} ></input>
                    </div>
                    <div style={{ display: 'inline-block', marginRight: '10px' }}>
                        <div>emote y offset</div>
                        <input value={trainEmoteY} onChange={(e) => { t.setOffset(e, 'trainEmoteY'); }} ></input>
                    </div>
                    <div style={{ display: 'inline-block', marginRight: '10px' }}>
                        <div>wheel horiz. separation</div>
                        <input value={trainWheelH} onChange={(e) => { t.setOffset(e, 'trainWheelH'); }} ></input>
                    </div>
                    <div style={{ display: 'inline-block', marginRight: '10px' }}>
                        <div>wheel x offset</div>
                        <input value={trainWheelX} onChange={(e) => { t.setOffset(e, 'trainWheelX'); }} ></input>
                    </div>
                    <div style={{ display: 'inline-block', marginRight: '10px' }}>
                        <div>wheel y offset</div>
                        <input value={trainWheelY} onChange={(e) => { t.setOffset(e, 'trainWheelY'); }} ></input>
                    </div>

                    <div style={{ display: 'inline-block', marginRight: '10px' }}>
                        <div>smoke x offset</div>
                        <input value={trainSmokeX} onChange={(e) => { t.setOffset(e, 'trainSmokeX'); }}></input>
                    </div>
                    <div style={{ display: 'inline-block', marginRight: '10px' }}>
                        <div>smoke y offset</div>
                        <input value={trainSmokeY} onChange={(e) => { t.setOffset(e, 'trainSmokeY'); }} ></input>
                    </div>
                </div>
            </div>
            <div className={'div-row'}>
                <div>Reset Defaults: </div>
                <div class='btn' onClick={() => { t.resetToDefault(); }}>Reset</div>
            </div>
            <div className='div-row single'>
                <div className='hider' onClick={(e) => { $(e.target).hide(); $(e.target).parent().find('a').css('display', 'inline-block') }}>- Click to Show App specific Link -</div>
                <a href={slink}>{slink}</a>
            </div>
        </div>
    }
}