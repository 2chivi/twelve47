//UTIL v1.0

//Various Utility Functions
$(function () {
    ioLogin = new API(loadData.PORT);
    UT.Extensions();
});

//#region Control Creation

var UX = {

    Toggle: function(comp, val){
        if (!comp.state.style)
            comp.state.style = {};

        val = val != null ? val : comp.state.style.display == 'none';

        if (val)
            comp.setState({ style: { } });
        else
            comp.setState({ style: { display: 'none' }});
    }

};

//#endregion
