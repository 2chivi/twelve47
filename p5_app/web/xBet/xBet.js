
class Bet extends React.Component {

    constructor(props) {
        super();
        this.state = {
            type: props.type,
            user: props.user,
            app: props.app
        };
    }

    setLoc(data){
        var t = this;
        if (t.state.app && t.io) {
            t.state.user.betPosition = data;
            t.setState({ user: t.state.user });
            M.SaveUser(t.state.user, t.io);
        }
    }

    render() {
        var t = this;

        if (!t.state.app)
            t.io = null;
        if (t.state.app && !t.io)
            t.io = new API(t.state.app.port, t.state.app.ip, false);

        return <div className={'div-combo div-inner ' + (t.state.app != null ? 'active' : '')}>
            <div className='div-row'>
                <div>Screen Position (click and drag): </div>
                <Position ref='position'
                    data={t.state.user.betPosition ? t.state.user.betPosition : { right: 0.95, bottom: 0.95 }}
                    width={'16'} height='8'
                    OnUpdate={(e) => { t.setLoc(e); }} />
            </div>
            <div className='div-row' >
                <div>
                    <div style={{ marginBottom: '5px', textDecoration: 'underline' }}>Chat Commands</div>

                    <div>!bet 5 title of bet </div>
                    <div>!bet 2 yes</div>
                    <div>!bet 10 shroud title of bet</div>
                    <div>[#subs | yes/no/streamer | title-of-bet]</div>
                </div>
                <div>
                    <div style={{ marginBottom: '5px', textDecoration: 'underline' }}>Mod Commands</div>

                    <div>!betwinner no</div>
                    <div>!betwinner shroud</div>
                    <div>!betclear</div>
                </div>
            </div>

        </div>
    }
}