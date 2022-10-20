
class FileSelect extends React.Component {

    constructor(props) {
        super();
        this.state = { 
        };
    }

    UploadFile(file, type){
        var t = this;
        console.log(file);

        if (file.size > 200000)
            alert('File Size Too Large.  Keep it less than 200kb.  Image gets auto-resized.');
        else{

            var reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = function(){
                console.log('load worked');
                var fileData = {
                    file: reader.result, name: file.name, size: file.size,
                    fileType: type
                };

                if (t.props.OnFile) {
                    t.props.OnFile(fileData);
                }
            }
        }
    }

    render() {
        var t = this;
        var files = ['Engine', 'Car', 'Engine_Wheel', 'Car_Wheel'];
        var linkDivs = [];

        files._each(f=>{
            var file = M.files._first(x=> x.fileType == f);
            var activeName = file != null ? file.name : 'Default';

            var div = <div style={{display:'inline-block', marginRight: '5px', marginBottom: '2px'}}>
                <div>{activeName}</div>
                <div className='btn' onClick={(e)=>{ $(e.target).next().click() }}>{'Choose ' + f + ' Img'}</div>
                <input style={{display:'none'}} onChange={(e) => { t.UploadFile($(e.target)[0].files[0], f); }} className='inp-file' name='file' type='file'></input>
            </div>
            linkDivs.push(div);
        });


        return <div className={'div-file'}>

            <div>
                {linkDivs}
            </div>
        </div>
    }
}