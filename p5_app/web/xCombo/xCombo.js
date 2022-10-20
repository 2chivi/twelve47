
class Combo extends React.Component {

    constructor(props) {
        super();
        this.state = {
            type: props.type,
            user: props.user,
            app: props.app
        };
    }

    connect() {
        var t = this;
        if (t.state.app) {
            if (!t.io)
                t.io = new API(t.state.app.port);
        }
    }

    setLoc(e){
        var t = this;
        if (t.state.app && t.io) {
            t.state.user.comboPosition = e;
            t.setState({ user: t.state.user });
            M.SaveUser(t.state.user, t.io);
        }
    }

    setSize(e) {
        var t = this;
        if (t.state.app && t.io) {
            t.state.user.comboSize = e.value;
            t.setState({ user: t.state.user });
            M.SaveUser(t.state.user, t.io);
        }
    }

    render() {
        var t = this;
        var mySize = t.state.user.comboSize != null ? t.state.user.comboSize : 1;
        var slink = 'https://twelve47.com/?stream=' + t.state.user.streamId + '&app=' + t.state.type.name;

        if (!t.state.app)
            t.io = null;
        if (t.state.app && !t.io)
            t.io = new API(t.state.app.port, t.state.app.ip, false);

        if (t.refs.ddSize)
            t.refs.ddSize.setState({ val: mySize });

        return <div className={'div-combo div-inner ' + (t.state.app != null ? 'active' : '')}>
            <div className='div-row'>
                <div>Screen Position (click and drag): </div>
                <Position ref='position'
                    data={t.state.user.comboPosition ? t.state.user.comboPosition : { right:0.95,bottom:0.95}}
                    width={'16'} height='8'
                    OnUpdate={(e) => { t.setLoc(e); }} />
            </div>

            <div className='div-row'>
                <div>Size: </div>
                <DD ref='ddSize' data={[{ name: 'small', value: 0.75 }, { name: 'medium', value: 1 }, { name: 'large', value: 1.25 }]}
                    val='value' name='name' OnChange={(e) => { t.setSize(e); }} />
            </div>
            <div className='div-row single'>
                <div className='hider' onClick={(e)=>{  $(e.target).hide(); $(e.target).parent().find('a').css('display', 'inline-block') }}>- Click to Show App specific Link -</div>
                <a href={slink}>{slink}</a>
            </div>
        </div>
    }
}