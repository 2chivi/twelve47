
class Hangman extends React.Component {

    constructor(props) {
        super();
        this.state = {
            type: props.type,
            user: props.user,
            app: props.app
        };
    }

    start(e){
        var t = this;
        if (t.state.app && t.io) {
            t.io.Call('StartGame', [t.state.user.twitch], function () {
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


        return <div className={'div-combo div-inner ' + (t.state.app != null ? 'active' : '')}>
            <div className='div-row'>
                <div>Word or Phrase: </div>
                <input value={phrase} onChange={(e) => { t.setPhrase(e); }}></input>
            </div>
            <div className='div-row'>
                <div>Twitch User to be Hung: </div>
                <input value={user} onChange={(e) => { t.setUser(e); }}></input>
            </div>
            <div className='div-row'>
                <div>Voting Time Limit (seconds/round)</div>
                <input value={time} onChange={(e) => { t.setTime(e); }}
                    type="number" min="0" max="999" step="1"></input>
            </div>
            <div className='div-row'>
                <div>Start a New Game: </div>
                <div class='btn' onClick={() => { t.start(); }}>Start Game</div>
            </div>
        </div>
    }
}