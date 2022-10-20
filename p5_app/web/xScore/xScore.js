
class Score extends React.Component {

    constructor(props) {
        super();
        this.state = {
            type: props.type,
            user: props.user,
            app: props.app
        };
    }

    setColor(e, nme){
        var t = this;
        console.log($(e.target).val());
        clearTimeout(t.ttSave);
        t.state.user[nme] = $(e.target).val();
        t.setState({ user: t.state.user });
        t.ttSave = setTimeout(function () {
            var valid = true;
            var c = t.state.user[nme];
            if (!(/[0-9A-Fa-f]{6}/g).test(c.substring(1)))
                valid = false;
            if(!valid){
                t.state.user[nme] = null;
                t.setState({ user: t.state.user });
                alert('Invalid Entry:  wrong format')
            }
            else
                M.SaveUser(t.state.user, t.io);
        }, 3000);
    }

    setWidth(e) {
        var t = this;
        clearTimeout(t.ttSave);
        t.state.user.scoreWidth = $(e.target).val();
        t.setState({ user: t.state.user });
        t.ttSave = setTimeout(function () {
            M.SaveUser(t.state.user, t.io);
        },3000);
    }


    render() {
        var t = this;
        var total = t.state.user.scoreWidth ? t.state.user.scoreWidth : 500;
        var color1 = t.state.user.scoreColor1 ? t.state.user.scoreColor1 : '#1e1630';//, '#eee1c9'];
        var color2 = t.state.user.scoreColor2 ? t.state.user.scoreColor2 : '#000000';//, '#eee1c9'];
        var color3 = t.state.user.scoreFontColor ? t.state.user.scoreFontColor : '#fffaf0';//, '#eee1c9'];
        var slink = 'https://twelve47.com/?stream=' + t.state.user.streamId + '&app=' + t.state.type.name;


        var divColor1 = <div className='div-color' style={{ backgroundColor: color1 }}></div>;
        var divColor2 = <div className='div-color' style={{ backgroundColor: color2 }}></div>;
        var divColor3 = <div className='div-color' style={{ backgroundColor: color3 }}></div>;

        if (!t.state.app)
            t.io = null;
        if (t.state.app && !t.io)
            t.io = new API(t.state.app.port, t.state.app.ip, false);

        return <div className={'div-planck div-inner ' + (t.state.app != null ? 'active' : '')}>
            <div className='div-row'>
                <div>Fixed Width: </div>
                <input value={total} onChange={(e) => { t.setWidth(e); }}
                    type="number" min="0" max="2000" step="1"></input>
            </div>
            <div className='div-row'>
                <div>
                    <span>Color 1</span>
                    {divColor1}
                </div>
                <input value={color1} onChange={(e) => { t.setColor(e,'scoreColor1'); }} ></input>
            </div>
            <div className='div-row'>
                <div>
                    <span>Color 2</span>
                    {divColor2}
                </div>
                <input value={color2} onChange={(e) => { t.setColor(e, 'scoreColor2'); }} ></input>
            </div>
            <div className='div-row'>
                <div>
                    <span>Font Color</span>
                    {divColor3}
                </div>
                <input value={color3} onChange={(e) => { t.setColor(e, 'scoreFontColor'); }} ></input>
            </div>
            <div className='div-row'>
                <div>!scoreboard Zain, Mang0, Winners Finals </div>
                <div>(player, player, title)</div>
            </div>
            <div className='div-row'>
                <div>!scoreboard 1,0 </div>
                <div>(p1 score, p2 score)</div>
            </div>
            <div className='div-row'>
                <div>!scoreboard 0,0,2,2 </div>
                <div>(p1 score, p2 score, p1 sets, p2 sets)</div>
            </div>
            <div className='div-row'>
                <div>!scoreboard -,- </div>
                <div>(no scores / friendlies)</div>
            </div>
            <div className='div-row'>
                <div>!scoreboard clear</div>
                <div>(removes the overlay)</div>
            </div>
            <div className='div-row single'>
                <div className='hider' onClick={(e)=>{  $(e.target).hide(); $(e.target).parent().find('a').css('display', 'inline-block') }}>- Click to Show App specific Link -</div>
                <a href={slink}>{slink}</a>
            </div>
        </div>
    }
}