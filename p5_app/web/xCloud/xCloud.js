
class Cloud extends React.Component {

    constructor(props) {
        super();
        this.state = {
            type: props.type,
            user: props.user,
            app: props.app
        };
    }

    connect(){
        var t = this;
        if (t.state.app) {
            if (!t.io)
                t.io = new API(t.state.app.port, t.state.app.ip, false);
        }
    }

    setColors(e) {
        var t = this;
        var colors = t.state.user.cloudColors ? t.state.user.cloudColors : ['#57A9E8', '#0D80D9', '#6565EB', '#6565EB', '#4DEAA7', '#00DD7E'];
        var oldColors = colors.slice();
        var colors = $(e.target).val().split(',');
        clearTimeout(t.ttSave);

        t.state.user.cloudColors = colors;
        t.setState({ user: t.state.user });

        t.ttSave = setTimeout(function(){
            var valid = true;
            colors._each(c => {
                if (!(/[0-9A-Fa-f]{6}/g).test(c.substring(1)))
                    valid = false;
            });

            if(!valid || colors.length > 10){
                t.state.user.cloudColors = oldColors;
                alert('Invalid Entry: (#4DEAA7,#00DD7E)  (< 10 colors)')
            }
            else if(t.io)
                M.SaveUser(t.state.user, t.io);

            t.setState({ user: t.state.user });
        },5000);    
    }

    /*
    setPos(e){
        var t = this;
        if (t.state.app && t.io) {
            t.state.user.cloudPosition = e.name;
            t.setState({ user: t.state.user });
            M.SaveUser(t.state.user, t.io);
        }
    }*/

    setLoc(e) {
        var t = this;
        if (t.state.app && t.io) {
            t.state.user.cloudPosition = e;
            t.setState({ user: t.state.user });
            M.SaveUser(t.state.user, t.io);
        }
    }

    setLife(e) {
        var t = this;
        if (t.state.app && t.io) {
            t.state.user.cloudLifetime = $(e.target).val();
            t.setState({ user: t.state.user });
            M.SaveUser(t.state.user, t.io);
        }
    }

    setTotal(e) {
        var t = this;
        if (t.state.app && t.io) {
            t.state.user.cloudTotal = $(e.target).val();
            t.setState({ user: t.state.user });
            M.SaveUser(t.state.user, t.io);
        }
    }

    setMinWord(e) {
        var t = this;
        if (t.state.app && t.io) {
            t.state.user.cloudMinWord = $(e.target).val();
            t.setState({ user: t.state.user });
            M.SaveUser(t.state.user, t.io);
        }
    }

    setMinEmote(e) {
        var t = this;
        if (t.state.app && t.io) {
            t.state.user.cloudMinEmote = $(e.target).val();
            t.setState({ user: t.state.user });
            M.SaveUser(t.state.user, t.io);
        }
    }

    clear(){
        var t = this;
        if(t.state.app && t.io && t.state.user){
            t.io.Call('Clear',[t.state.user.twitch],function(){
                console.log('clear');
            });
        }
    }

    render() {
        var t = this;

        var lifetime = t.state.user.cloudLifetime ? t.state.user.cloudLifetime : 30;
        var total = t.state.user.cloudTotal ? t.state.user.cloudTotal : 10;
        var colors = t.state.user.cloudColors ? t.state.user.cloudColors : ['#57A9E8', '#0D80D9', '#6565EB', '#6565EB', '#4DEAA7', '#00DD7E'];
        var minWord = t.state.user.cloudMinWord ? t.state.user.cloudMinWord : 2;
        var minEmote = t.state.user.cloudMinEmote ? t.state.user.cloudMinEmote : 1;
        var divColors = [];
        var slink = 'https://twelve47.com/?stream=' + t.state.user.streamId + '&app=' + t.state.type.name;


        colors._each(x=>{
            divColors.push(<div className='div-color' style={{backgroundColor: x}}></div>)
        });

        
        if(!t.state.app)
            t.io = null;
        if(t.state.app && !t.io)
            t.io = new API(t.state.app.port, t.state.app.ip, false);



        return <div className={'div-cloud div-inner ' + (t.state.app != null ? 'active' : '')}>
            <div className='div-row'>
                <div>Clear all words/emotes: </div>
                <div class='btn' onClick={()=>{ t.clear(); }}>Clear</div>
            </div>
            <div className='div-row'>
                <div>Screen Position (click and drag): </div>
                <Position ref='position'
                    data={t.state.user.cloudPosition ? t.state.user.cloudPosition : { right: 0.95, bottom: 0.95 }}
                    width={'14'} height='14'
                    OnUpdate={(e) => { t.setLoc(e); }} />
            </div>
            <div className='div-row'>
                <div>
                    <span>Colors </span>
                   {divColors}
                </div>
                <input value={colors} onChange={(e) => { t.setColors(e); }} ></input>
            </div>
            <div className='div-row'>
                <div>Max Emotes/Words on screen: </div>
                <input value={total} onChange={(e) => { t.setTotal(e); }} 
                    type="number" min="0" max="100" step="1"></input>
            </div>
            <div className='div-row'>
                <div>Chat Message Lifetime (sec): </div>
                <input value={lifetime} onChange={(e) => { t.setLife(e); }}
                    type="number" min="5" max="500" step="1"></input>
            </div>
            <div className='div-row'>
                <div>Word Trigger Count: </div>
                <input value={minWord} onChange={(e) => { t.setMinWord(e); }}
                    type="number" min="1" max="100" step="1"></input>
            </div>
            <div className='div-row'>
                <div>Emote Trigger Count: </div>
                <input value={minEmote} onChange={(e) => { t.setMinEmote(e); }}
                    type="number" min="1" max="100" step="1"></input>
            </div>
            <div className='div-row single'>
                <div className='hider' onClick={(e)=>{  $(e.target).hide(); $(e.target).parent().find('a').css('display', 'inline-block') }}>- Click to Show App specific Link -</div>
                <a href={slink}>{slink}</a>
            </div>
        </div>
    }
}