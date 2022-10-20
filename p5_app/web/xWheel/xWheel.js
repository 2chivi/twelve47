
class Wheel extends React.Component {

    constructor(props) {
        super();
        this.state = {
            type: props.type,
            user: props.user,
            app: props.app
        };
    }

    setTimer(e, nme){
        var t = this;
        clearTimeout(t.ttSave);


        t.state.user[nme] = $(e.target).val();
        t.setState({ user: t.state.user });

        t.ttSave = setTimeout(function () {

            M.SaveUser(t.state.user, t.io);
        }, 3000);
    }

    setPoints(e, nme){
        var t = this;
        clearTimeout(t.ttSave);


        t.state.user[nme] = $(e.target).val();
        t.setState({ user: t.state.user });

        t.ttSave = setTimeout(function () {

            M.SaveUser(t.state.user, t.io);
        }, 3000);
    }

    render() {
        var t = this;
        var isRestricted = M.user.access != 'admin' && M.user.access != 'beta';
        var restricted = M.user.access == '1' ? 'restricted' : null;
        var slink = 'https://twelve47.com/?stream=' + t.state.user.streamId + '&app=' + t.state.type.name;

        var timer = t.state.user.wheelTimer ? t.state.user.wheelTimer : 120;//, '#eee1c9'];
        var points = t.state.user.wheelPointsToSpin ? t.state.user.wheelPointsToSpin : 20000;


        if (!t.state.app)
            t.io = null;
        if (t.state.app && !t.io)
            t.io = new API(t.state.app.port, t.state.app.ip, false);

        return <div className={'div-planck div-inner ' + (t.state.app != null ? 'active' : '')}>
            
            <div className={'div-row'}>
                <div>Countdown Timer (seconds): </div>
                <input value={timer} onChange={(e) => { t.setTimer(e, 'wheelTimer'); }} ></input>
            </div>
            <div className={'div-row'}>
                <div>Channel Points To Spin: </div>
                <input type='number' min='5' max='99000000' value={points} onChange={(e) => { t.setPoints(e, 'wheelPointsToSpin'); }} ></input>
            </div>
            <div className='div-row'>
                <div>!wheel spin </div>
                <div>Test Spins the Wheel</div>
            </div>
            <div className='div-row'>
                <div>!wheel add Your Text Here </div>
                <div>Adds a new Wedge</div>
            </div>
            <div className='div-row'>
                <div>!wheel 0 0.1 </div>
                <div>Edits Percentage of Wedge 0</div>
            </div>
            <div className='div-row'>
                <div>!wheel 1 New Text Here </div>
                <div>Edits Text of Wedge 1</div>
            </div>
            <div className='div-row'>
                <div>!wheel remove 2 </div>
                <div>Removes Wedge 2</div>
            </div>
            <div className='div-row'>
                <div>!wheel swap </div>
                <div>Swaps between Wheel 1 & 2</div>
            </div>
            <div className='div-row single'>
                <div className='hider' onClick={(e) => { $(e.target).hide(); $(e.target).parent().find('a').css('display', 'inline-block') }}>- Click to Show App specific Link -</div>
                <a href={slink}>{slink}</a>
            </div>
        </div>
    }
}