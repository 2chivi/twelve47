
class Body extends React.Component {

    constructor(){ 
        super();
        this.state = { 
        };
    }

    Play(app){
        /*
        var type = M.appTypes._first(x=> x.name = app.name);
        M.Body.setState({ 
            user: M.user,
            loc: type.loc + "?port=" + app.port
        });*/
    }

    render(){
        var t= this;
        var apps = [];

        M.appTypes._each(x=>{
            apps.push(<App ref={x.name} type={x} />);
        });

        //list of active streamers
        //are the live?  or just server online?

        /*
        var streamers = [];
        t.state.apps._each(a=>{ streamers.push(
            <div onClick={()=>{ t.Play(a); }} class='div-streamer div-box'>{a.twitch}</div>
        )});*/


        return <div className='body'>

            <Dash ref='dash' />

        </div>
    }
}