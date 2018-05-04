//Use this to change
//$(".progress-bar").css("width", "90%");

/* 
//Disabled button look
$('.btn').prop('disabled',true);

color: #999;
background: #DDD;
border: 1px solid #CCC; 
*/

/* 
//Instead of reloading the page for routing we can make direct Ajax calls as well -
$.ajax({url: "/index?getSfFiles=true", success: function(result){
    console.log(result);
}});
*/

function prodLogin() {

    $(".container").faLoading({
        // undefined or true will add loading other can be "add", "remove" or "up<a href="https://www.jqueryscript.net/time-clock/">date</a>"
        type: undefined,
        // creates an title bar
        title: 'Loading..',
        //  fa icon
        icon: "fa-refresh",
        // icon sppining
        spin: true,
        // text message ( undefined or false for empty )
        status: "loading",
        // text message ( undefined or false for empty )
        text: 'Waiting for Salesforce OAuth Login',
        // timeout to close msg
        timeout: undefined,
        // call back for when the message is closed (by timeout or x button(in case it ever gets one))
        closeCallback: undefined,
        // adds and close button
        closeButton: false
    });
    //loginUrl = 'https://login.salesforce.com/'; 
    login('prod');
}

function createMetaDataSelectlist() {
    var sfMetadataCookie = $.cookie('sfMetaDataList');
    sfMetadataCookie = sfMetadataCookie.substring(2, sfMetadataCookie.length);
    var jsonobj = $.parseJSON(sfMetadataCookie);
    /* $.each(jsonobj, function(key,val){
        console.log("key : "+key+" ; value : "+val);
        //create html here
        //.sfMetaSelectList
        $('.sfMetaSelectList').children('option:not(:first)').remove();
        
    }); */
    $('.sfMetaSelectList').children('option').remove();
    $.each(jsonobj, function (key, value) {
        $('.sfMtDtSelectpicker')
            .append($("<option>" + value + "</option>"));
    });
    //$('.sfMetaSelectList').children('option:first').remove();
    //$('.selectpicker').selectpicker();
    /* $('.selectpicker').selectpicker({
        style: 'btn-info',
        size: 5
    }); */
    $('.sfMtDtSelectpicker').selectpicker({
        style: 'btn-info',
        size: 5,
    });
    $('#myWizard').show();   
    var getSfFilesCookie = $.cookie("sfFilesExtracted");    
    var gitOpSuccess = $.cookie("gitOperationSuccess");    
    if(getSfFilesCookie == 'true' && gitOpSuccess != 'true'){
        $("[href='#step3']").tab('show');
        $('#successMsg').text('We have successfully fetched the metadata files from Salesforce you selected');
    }
    if(gitOpSuccess == 'true'){
        $("[href='#step4']").tab('show');
        $('#successMsg').text('We have successfully pushed the salesforce metadata files to your github repo');
    }
    if(getSfFilesCookie != 'true' && gitOpSuccess != 'true'){
        $("[href='#step2']").tab('show');
    }
}
//To be used later

function sandLogin() {
    //loginUrl = 'https://test.salesforce.com/';
    login('test');
}

function login(env) {

    var rootOauthUrl = '/oauth2/auth?sfEndpointUrl=';
    if (env == 'test')
        window.open(rootOauthUrl + 'test');
    if (env == 'prod')
        window.open(rootOauthUrl + 'login');

}

function diff(A, B) {
    return A.filter(function (a) {
        return B.indexOf(a) == -1;
    });
}

function displaySnackBar() {
    // Get the snackbar DIV
    var x = document.getElementById("snackbar");

    // Add the "show" class to DIV
    x.className = "show";

    // After final processing or error remove the snackbar
    //setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}

var login, getSfFiles, getSfFilesCookie;
$(document).ready(function(){
    
    var url = window.location.href;
    if (url.searchParams) {
        login = url.searchParams.get("login");
        getSfFiles = url.searchParams.get("getSfFiles");
        console.log('>> login : ' + login);
        if (login == 'success') {
            opener.location.reload(true);
            self.close();
        }
    }
    var loggedInSfUser = $.cookie("sfUserLoggedIn");
    var loggedInSfUserDetails = $.cookie("sfUserFullDetails");
    var gitOperationSuccess = $.cookie("gitOperationSuccess");
    /* var getSfFilesCookie = $.cookie("sfFilesExtracted");    
    if(getSfFilesCookie == 'true'){
        $("[href='#step3']").tab('show');
    } */
    if (loggedInSfUser === undefined || loggedInSfUser === "null") {
        
        $('.alert-success').hide();
        $('.alert-danger').hide();
        $('#jumbo1').show();
        $('.jumbo2').hide();
        $('.lg-btn').hide();
        $('#myWizard').hide();
        $('.progressBarDiv').hide();
    }
    if (loggedInSfUser == 'true') {
        
        $('#jumbo1').hide();
        $('.alert-success').show();
        $('.alert-danger').hide(); 
        $('.lg-btn').show();
        var user = $.cookie('sfUserFullDetails');
        user = user.substring(2, user.length);
        var jsonobj = $.parseJSON(user);
        //console.log(jsonobj);
        //console.log(jsonobj.urls.profile);
        $('.sfUserName').html('Hello! ' + '<a target="_blank" href="' + jsonobj.urls.profile + '" >' + jsonobj.display_name + "</a>");
        $('.sfUserName').show();
        //$('.selectpicker').selectpicker();
        createMetaDataSelectlist();
    }
    if (loggedInSfUser == 'false') {
        
        $('.alert-danger').show();
        $('#jumbo1').show();
        $('.alert-success').hide();
        $('.lg-btn').hide();
        $('#myWizard').hide();
    }
    
    if (gitOperationSuccess == 'true') {
        
        $('#jumbo1').hide();
        $('.alert-success').show();
        $('.alert-danger').hide(); 
        $('.lg-btn').show();
        //$("[href='#step3']").tab('hide');
        //$("[href='#step3']").tab('show');
        //Hide tab 3 here
        $("[href='#step4']").tab('show');
    }
    
    $("#prodBtn").click(prodLogin);
    $("#sandBtn").click(sandLogin);

    //Select all to be used along with a checkbox
    //$('.selectpicker').selectpicker('selectAll');
    //Disable once the user has selected
    $('.ex-disable').click(function () {
        $('.disable-example').prop('disabled', true);
        $('.disable-example').selectpicker('refresh');
    });
    //Enable if the user wants to after the user has selected
    $('.ex-enable').click(function () {
        $('.disable-example').prop('disabled', false);
        $('.disable-example').selectpicker('refresh');
    });

    //Enable if the user wants to after the user has selected
    $('#startBtn').click(function () {
        //$('#myWizard').show();
        //$('#jumbo1').hide();
        $('#jumbo1').toggle(600);
        $('#myWizard').toggle(600);
    });
    
    $('#nextBtn').click(function (event) {

        displaySnackBar();        
        var selectedValues = $('.sfMetaSelectList').val();
        if(selectedValues.length < 1){
            $('#nextBtn').prop('disabled', true);   
            $('#snackbarTxt').text('Please select metadata types before proceeding');
            event.preventDefault();
        }
        else{

            var pollServerSf = setInterval(getCurrentSfOpStatus, 100);
            $('#snackbarTxt').text('Starting Salesforce Metadata Extraction...');

            var sfMetadataCookie = $.cookie('sfMetaDataList');
            sfMetadataCookie = sfMetadataCookie.substring(2, sfMetadataCookie.length);
            var allValues = $.parseJSON(sfMetadataCookie);

            var selectedArray = [];
            var allValuesArray = [];

            $.each(selectedValues, function (i, v) {
                console.log(i, v);
                selectedArray.push(v);
            });

            $.each(allValues, function (i, v) {
                console.log(i, v);
                allValuesArray.push(v);
            });
            var excludedMtDt = diff(allValuesArray, selectedArray);
            $.cookie('sfExcludedMtDt', excludedMtDt);
            //window.open('/index?getSfFiles=true');
            var url = window.location.href;
            var params = window.location.search;
            var path = window.location.pathname;
            url += 'index';
            if (url.indexOf('?') > -1) {
                url += '&getSfFiles=true';
            } else {
                url += '?getSfFiles=true';
            }
            window.location.href = url;
        }
    });
    //Logout Button Click
    $(".lg-btn").click(function () {
        $.cookie('sfUserLoggedIn', null);
        $.cookie('sfUserFullDetails', null);
        $.cookie('sfFilesExtracted', null);
        $.cookie('gitOperationSuccess', null);
        window.open('/');
        self.close();
    });

    $('.next').click(function () {
        
        var nextId = $(this).parents('.tab-pane').next().attr("id");
        //$("[href='#step3']").tab('show')
        $("[href=" + "'#" + nextId + "'" + "]").tab('show');
        return false;
    
    })
    
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    
        //update progress
        var step = $(e.target).data('step');
        var percent = (parseInt(step) / 4) * 100;
    
        $('.progress-bar').css({ width: percent + '%' });
        $('.progress-bar').text("Step " + step + " of 4");
        //e.relatedTarget // previous tab
    })
    
    $('.first').click(function () {
        //$('#myWizard a:second').tab('show');
        $("[href='#step2']").tab('show');
    })
    
    $('#gitBtn').click(function () {
        var pollServer = setInterval(getCurrentOpStatus, 100);
        $('#snackbarTxt').text('Waiting for Github Login...');
        displaySnackBar();
        
        //http://localhost:3000/index?getSfFiles=true
        var gitLoginUrl = window.location.protocol + '//' + window.location.host + '/gitStart';
        window.location.replace(gitLoginUrl);
        //window.location.href = gitLoginUrl;
    })
    $( "ul.selectpicker > li" ).click(function () {
        $('#nextBtn').prop('disabled', false);        
    })

    $('.btn.selectpicker.btn-info').click(function () {
        var $target = $('html,body'); 
        $target.animate({scrollTop: $target.height()}, 3000);
    })

    //var socket = io.connect('http://localhost:3000');
    var socket = io.connect(window.location.protocol + "//" +window.location.host);
    socket.on('gitStatus', function (data) {
      //console.log(data);
      if(data.gitStatus == 'success'){
        clearInterval(pollServer);
      }
      $('#snackbarTxt').text(data.gitStatus);
      //socket.emit('my other event', { my: 'data' });
    });
    var getCurrentOpStatus = function(){
        socket.emit('get git status', { my: 'data' });
    };

    socket.on('sfOpStatus', function (data) {
      //console.log(data);
      if(data.sfOpStatus == 'Salesforce File Extraction Process Complete'){
        clearInterval(pollServerSf);
      }
      $('#snackbarTxt').text(data.sfOpStatus);
      //socket.emit('my other event', { my: 'data' });
    });
    var getCurrentSfOpStatus = function(){
        socket.emit('get sf status', { my: 'data' });
    };
    //setTimeout(getCurrentOpStatus, 200);
    //var pollServer = setInterval(getCurrentOpStatus, 100);
});