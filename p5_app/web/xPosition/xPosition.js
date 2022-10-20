
class Position extends React.Component {

    constructor(props) {
        super();
        this.state = {
            w: props.width ? Number(props.width) : 10,
            h: props.height ? Number(props.height) : 10,
            xpos: 0,
            ypos: 0,
        };
        if(props.data.right != null)
            this.state.xpos = (Number(props.data.right) * 112) - (this.state.w);
        if(props.data.left != null)
            this.state.xpos = (Number(props.data.left) * 112);  //+ (this.state.w/2);
        if(props.data.top != null)
            this.state.ypos = (Number(props.data.top) * 63);// + (this.state.h / 2);
        if(props.data.bottom != null)
            this.state.ypos = (Number(props.data.bottom) * 63) - (this.state.h);
        
        var t = this;
        console.log(this.state);

        UT.on('mouseup', 'a' + Math.random(), function () {
            t.boxClick();
        });
    }

    boxClick(){
        var t = this;

        if(t.state.grabbed){
            t.setState({grabbed: false});
            clearInterval(t.ttDrag);
            if(t.props.OnUpdate){
                var dxLeft = Math.abs(0 - t.state.xpos);
                var dxRight = Math.abs(0 - (t.state.xpos + t.state.w));
                var dxTop = Math.abs(0 - t.state.ypos);
                var dxBottom = Math.abs(0 - (t.state.ypos+t.state.h));
                var xdir = dxLeft < dxRight ? 'left' : 'right';
                var ydir = dxTop < dxBottom ? 'top' : 'bottom';

                var info = {
                    //x: (t.state.xpos + t.state.w/2)/112,
                    //y: (t.state.ypos + t.state.h/2)/63,
                };
                info[xdir] = dxLeft < dxRight ? ((t.state.xpos)/112) : (112 - (t.state.xpos+t.state.w))/112;
                info[ydir] = dxTop < dxBottom ? (t.state.ypos)/63 : (63-(t.state.ypos+t.state.h))/63;

                t.props.OnUpdate(info);
            }
        }
    }

    grab(e){
        var t = this;
        var box = $(e.target).closest('.div-position');
        t.boxPos = box.offset();

        clearInterval(t.ttDrag);
        
        t.ttDrag = setInterval(()=> {
            t.setState({ grabbed: true });

            var x = Math.ceil(((M.mx - 0) - t.boxPos.left)/2)*2;
            x = Math.min(x, box.width()-t.state.w);
            x = Math.max(x, 0);

            var y = Math.ceil(((M.my - 0) - t.boxPos.top)/2)*2;
            y = Math.min(y, box.height()-t.state.h);
            y = Math.max(y, 0);


            t.setState({
                xpos: x,
                ypos: y
            });
        }, 150);
    }

    render() {
        var t = this;

        return <div className={'div-position ' + (t.state.grabbed ? 'grabbed' : '')} >
            <div className={'div-borders '}
                onMouseDown={(e) => { t.grab(e) }}
                style={{top: t.state.ypos, 
                    left: t.state.xpos,
                    width: t.state.w, 
                    height: t.state.h}}>
                    
                <div className={'div-origin '}></div>
            </div>
        </div>
    }
}