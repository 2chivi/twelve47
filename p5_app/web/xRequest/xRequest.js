
class Request extends React.Component {

    constructor(props) {
        super();
        this.state = {
            type: props.type,
            user: props.user,
            app: props.app
        };
    }

    start(e) {
        var t = this;
        if (t.state.app && t.io) {
            t.io.Call('StartGame', [], function () {
                console.log('started game')
            });
        }
    }

    setTime(e) {
        var t = this;
        if (t.state.app && t.io) {
            t.state.user.hangmanTime = $(e.target).val();
            t.setState({ user: t.state.user });
            M.SaveUser(t.state.user, t.io);
        }
    }

    setUser(e) {
        var t = this;
        if (t.state.app && t.io) {
            t.state.user.hangmanUser = $(e.target).val();
            t.setState({ user: t.state.user });
            M.SaveUser(t.state.user, t.io);
        }
    }

    setPhrase(e) {
        var t = this;
        if (t.state.app && t.io) {
            t.state.user.hangmanPhrase = $(e.target).val();
            t.setState({ user: t.state.user });
            M.SaveUser(t.state.user, t.io);
        }
    }

    render() {
        var t = this;
        //var myPos = t.state.user.comboPosition ? t.state.user.comboPosition : 'Bottom_Right';
        var user = t.state.user.hangmanUser ? t.state.user.hangmanUser : t.state.user.twitch;
        var time = t.state.user.hangmanTime ? t.state.user.hangmanTime : 30;
        var phrase = t.state.user.hangmanPhrase ? t.state.user.hangmanPhrase : 'test';

        if (!t.state.app)
            t.io = null;
        if (t.state.app && !t.io)
            t.io = new API(t.state.app.port, t.state.app.ip, false);

        //if (t.refs.ddPosition)
        //t.refs.ddPosition.setState({ val: myPos });
        var link = 'https://twelve47.com/?stream=' + t.state.user.modId;

        return <div className={'div-request div-inner ' + (t.state.app != null ? 'active' : '')}>
            <div className='div-row'>
                <div>Moderation Link (Not for OBS): </div>
                <div style={{overflowWrap: 'break-word'}}>
                    <a href={link}>{link}</a>
                </div>
            </div>
        </div>
    }
}