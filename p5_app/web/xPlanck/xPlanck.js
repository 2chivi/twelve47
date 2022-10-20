
class Planck extends React.Component {

    constructor(props) {
        super();
        this.state = {
            type: props.type,
            user: props.user,
            app: props.app
        };
    }

    render() {
        var t = this;

        if (!t.state.app)
            t.io = null;
        if (t.state.app && !t.io)
            t.io = new API(t.state.app.port, t.state.app.ip, false);

        return <div className={'div-planck div-inner ' + (t.state.app != null ? 'active' : '')}>
            <div className='div-row'>
                Game Beta.  Testing
            </div>
        </div>
    }
}