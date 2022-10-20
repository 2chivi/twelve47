
class App extends React.Component {

    constructor(props) {
        super();
        this.state = {
            type: props.type,
            user: props.user,
            app: props.app,
            waiting: false,
            hide: false //props.admin
        };

        this.components = {
            cloud: Cloud,
            combo: Combo,
            hangman: Hangman,
            planck: Planck,
            score: Score,
            train: Train,
            wheel: Wheel,
        }
    }

    setApp(app, u){
        var t= this;
        t.setState({app: app, user: u});
        t.refs.details.setState({app: app});
    }

    togg(){
        var t = this;
        t.setState({waiting: true});
        console.log(t.state.user.twitch);
        
        ioLogin.Call('ToggleApp', [M.user.loginId, t.state.user.twitch, t.state.type.name], function (data) {
            for(var i = 0; i < M.users.length; i++){
                if(M.users[i].twitch == data.member.twitch){
                    M.users[i] = data.member;
                    t.setState({user: data.member});
                }
            }

            setTimeout(function(){  
                t.setState({ waiting: false });
            }, 4000);
            M.UpdateAppInfo();
            t.forceUpdate();
        });
    }

    render() {
        var t = this;
        var isActive = t.state.app != null && t.state.user['active'+t.state.type.name];
        var btnText = isActive ? 'Turn Off' : 'Turn On';
        var btn = <div className='btn' onClick={() => { t.togg(); }}>{btnText}</div>;
        var think = t.state.waiting;

        var betaAccess = M.user.access == 'admin' || M.user.access == 'beta';

        if(t.state.waiting || (t.state.type.beta && !betaAccess))
            btn = null;


        var Comp = t.components[t.state.type.name];
        if(!Comp)
            alert('update components in app.js')

        return <div className={'div-app div-box ' + (isActive ? 'active ' : '') + (think ? 'think ' : '')}>
            <div className='div-header'>
                <div className='div-swatch'><i class='fa fa-cog fa-spin'></i></div>
                <div>{t.state.type.display}</div>
                {btn}
            </div>
            <div className={'div-body ' + (t.state.hide ? 'hide' : '')}>
                <Comp ref='details' app={t.state.app} user={t.state.user} type={t.state.type} />
            </div>
        </div>
    }
}