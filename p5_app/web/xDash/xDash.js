class Dash extends React.Component {

    constructor() {
        super();
        this.state = {
            users: [{}],
            types: [],
            apps: [],
            activeUsers: {},
        };
    }

    tog(e, u){
        var t = this;
        M.UpdateAppInfo();
        t.state.activeUsers[u.twitch] = t.state.activeUsers[u.twitch] ? false : true;
        t.forceUpdate();
    }

    render() {
        var t = this;
        var adminApps = [];
        var iframeTxt1 = "<iframe style='width:100%;height:100%;' src='";
        var iframeTxt2 = "'></iframe>";

        if(M.user){
            var u = M.user;
            if(t.state.activeUsers[u.twitch] == null)
                t.state.activeUsers[u.twitch] = true;

            t.state.users._each(u => {
                var tapps = [];
                var showLive = u.InActive != null && !u.InActive;

                if(t.state.activeUsers[u.twitch]){
                    t.state.types._each(x => {
                        var showApp = false;

                        if(x.beta && (M.user.access == 'admin' || M.user.access == 'beta'))
                            showApp = true;
                        if(!x.beta)
                            showApp = true;
                        
                        if(showApp){
                            var app = t.state.apps._first(a => a.type == x.name && a.twitch == u.twitch);
                            tapps.push(<div class='div-box div-img'><img src={S3 + '/twelve47/' + x.name + '.png'} /></div>);
                            tapps.push(<App ref={x.name + u.twitch} admin={true} type={x} user={u} app={app} />); 

                        }
                    });
                }

                var userStuff = t.state.activeUsers[u.twitch] ? <div className={'div-user-stuff'}> {tapps}  </div> : null;

                adminApps.push(
                    <div className='div-user'>
                        <div className='div-user-top'>
                            <div className={'div-live ' + (showLive ? 'active':'')}></div>
                            <div className='div-name'>{u.twitch}</div>
                            <div>Last Active: {''}</div>
                            <i class='fas fa-caret-down' onClick={(e)=>{ t.tog(e,u); }}></i>
                        </div>
                        
                        {userStuff}
                        
                    </div>
                );
            });
        }

        return  <div className='dash-page'>
            <div className='div-left'>
                <div className='div-title'>Dashboard</div>
                
                <div className='dash-admin'>
                    {adminApps}
                </div>
            </div>

            <div className='div-right'>
                <div class='div-support'>
                    <div onClick={() => window.open("https://ko-fi.com/twelve47", "_blank")} class='div-promo div-coffee'><i class='fa fa-coffee'></i> Buy Me a Coffee</div>
                    <div onClick={() => window.open("https://patreon.com/skivvy", "_blank")} class='div-promo div-patreon'><i class='fab fa-patreon'></i> Patreon</div>
                </div>

                <div class='div-box div-setup'>
                    <div style={{fontSize:'20px', marginBottom:'10px'}}>How To Setup (OBS)</div>
                    <div>- Turn On an app in your dashboard to the left.</div>
                    <div>- Create new 'Browser' source in OBS w/ these settings.</div>
                    <div>- Width: 1920, Height: 1080 <span style={{fontWeight:600}}>(Important for quality)</span></div>
                    <div>- URL: see below</div>
                    <div>- Move and Resize window in OBS as needed</div>
                    <div class='div-hide-parent'>
                        <div class='div-hide' onClick={(e)=>{$(e.target).hide();}}>Click To Show URL for OBS</div>
                        <div><a href={'https://twelve47.com/?stream=' + t.state.users[0].streamId}>https://twelve47.com/?stream={t.state.users[0].streamId}</a></div>
                    </div>



                </div>
            </div>



        </div>

        /*
                            <div style={{ fontSize: '20px', marginBottom: '10px', marginTop: '30px' }}>How To Setup (StreamElements Custom Overlay)</div>
                    <div>- Turn On an app in your dashboard to the left.</div>
                    <div>- Add Widget -&gt; Static/Custom -&gt; Custom Widget</div>
                    <div>- Position, size and style:  (Width: 1920, Height: 1080)</div>
                    <div>- Settings -&gt; Open Editor -&gt; Delete everything in HTML, CSS, JS, and Fields</div>
                    <div>- Copy and Paste the HTML below into the HTML section, and click DONE.</div>
                    <div class='div-hide-parent'>
                        <div class='div-hide' onClick={(e) => { $(e.target).hide(); }}>Click To Show HTML for StreamElements</div>
                        <div>{"<iframe style='width:100%;height:100%;' src='https://twelve47studios.com/?stream="+ t.state.users[0].streamId + "'></iframe>"}</div>
                    </div>
        */
    }
}