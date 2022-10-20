
class DD extends React.Component {

    constructor(props) {
        super();
        var t = this;
        t.state = {};
        t.state.data = props.data;
        t.state.style = {};
    }

    OnChange(e){
        var t = this;
        var i = $(e.target).find('option:selected').attr('index');
        t.state.val = $(e.target).val();
        t.props.OnChange(t.state.data[i]);
    }

    render() {
        var t = this;
        var ops = [];

        for(var i = 0; i < t.state.data.length; i++){
            var x = t.state.data[i];
            var select = t.state.val == x[t.props.val];

            if(select)
                ops.push(<option selected='true' index={i} value={x[t.props.val]}>{x[t.props.name]}</option>);
            else
                ops.push(<option index={i} value={x[t.props.val]}>{x[t.props.name]}</option>);
        }

        return <select style={t.state.style} onChange={(e)=> t.OnChange(e)}>{ops}</select>;
    }
}