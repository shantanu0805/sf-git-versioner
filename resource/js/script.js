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
        $('#successMsg').text('We have successfully fetched the metadata files you selected, from Salesforce');
    }
    /* 
    if(gitOpSuccess == 'true'){
        $("[href='#step4']").tab('show');
        $('#successMsg').text('We have successfully pushed the salesforce metadata files to your github repo');
    } */
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

function hideSnackBar() {
    var x = document.getElementById("snackbar");
    x.className = "hide";
}

function createAndShowGitLog() {
    $('#gitOpLogs').html($.cookie('gitOpLogs'));$('#gitOpLogs').show();
}

function createAndShowCommitTable(commitObj) {
    
    //$('#step4').hide();
    $('#gitBtn').hide();
    for (var key in commitObj) {
        commitObj[key].author = commitObj[key].author.name;
        commitObj[key].committer = commitObj[key].committer.name;
    }
    if($('#gitCommitSection').html().length < 5){
        $('#gitCommitSection').createTable(commitObj, {});
        $("#gitCommitSection").show();
        $('#snackbarTxt').hide();
        $('#gitOpStatusMsg').hide();
        $('#gitLogo').hide();
        //var elem = $('.json-to-table')["0"].children[1].children["0"].children[1];elem.innerText;
        hideSnackBar();
        var $target = $('html,body'); 
        $target.animate({scrollTop: $target.height()}, 2000);
        for(i=0; i<3; i++){
            var elem = $('.json-to-table')["0"].children[1].children[i].children[1];
            var commitId = elem.innerText;
            var shortId = commitId.substring(0, 7);
            var commitHtml = "<code><a target='_blank' href='https://github.com/shantanu107/test0805/commit/" + commitId + "'>" + shortId + "</a></code>";
            $(elem).html(commitHtml);
            $(elem).css('text-align', 'center');
        }
    }
}

var login, getSfFiles, getSfFilesCookie;
$(document).ready(function(){
    
    $('[data-toggle="tooltip"]').tooltip();   
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
        $('#name').val(jsonobj.display_name);
        $('#email').val(jsonobj.email);
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
    /* 
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
     */
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
        /* 
        $.cookie('sfUserLoggedIn', null);
        $.cookie('sfUserFullDetails', null);
        $.cookie('sfFilesExtracted', null);
        $.cookie('gitOperationSuccess', null);
        $.cookie('gitUserLoginSuccess', null); 
        */
        var cookies = $.cookie();
        for(var cookie in cookies) {
           $.removeCookie(cookie);
        }
        window.open('/');
        self.close();
    });

    $('.next').click(function () {
        
        var nextId = $(this).parents('.tab-pane').next().attr("id");
        //$("[href='#step3']").tab('show')
        $("[href=" + "'#" + nextId + "'" + "]").tab('show');
        return false;
    
    })
    
    $('#selectAllBtn').click(function () {
        //Select all
        $('.sfMetaSelectList').selectpicker('selectAll');
        $('#nextBtn').prop('disabled', false);
    })
    
    
    $('#clearBtn').click(function () {
        //Clear the selections
        $(".sfMetaSelectList").val('default');
        $(".sfMetaSelectList").selectpicker("refresh");
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
    $( "ul.dropdown-menu.inner.selectpicker > li" ).click(function () {
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
      console.log(data.gitStatus);
      var gitOpLogsHtml = $('#gitOpLogs').html();
      $.cookie('gitOpLogs', gitOpLogsHtml);
      if($('#gitOpLogs').text().indexOf(data.gitStatus) < 0){
        gitOpLogsHtml += '<br /><code> >> ' + new Date().toISOString() + ' : ' + data.gitStatus + ' </code>';
        $('#gitOpLogs').html(gitOpLogsHtml);
        $.cookie('gitOpLogs', gitOpLogsHtml);
      }
      
      if(data.gitStatus == 'success'){

        clearInterval(pollServer);
        $.cookie('gitOperationSuccess', true);
        console.log('>> git commits : ' + data.gitCommits); 
        var commitObj =  JSON.stringify(data.gitCommits);
        $.cookie('gitCommitInfo', commitObj);
        //create git commit html here
        var commitObj = data.gitCommits;
        for (var key in commitObj) {
            commitObj[key].author = commitObj[key].author.name;
            commitObj[key].committer = commitObj[key].committer.name;
        }
        if($('#gitCommitSection').html().length < 5){
            $('#gitCommitSection').createTable(commitObj, {});
            $("#gitCommitSection").show();
            $('#snackbarTxt').hide();
            $('#gitOpStatusMsg').hide();
            $('#gitLogo').hide();
            //$('#gitOpLogs').hide();
            //var elem = $('.json-to-table')["0"].children[1].children["0"].children[1];elem.innerText;
            hideSnackBar();
            var $target = $('html,body'); 
            $target.animate({scrollTop: $target.height()}, 3000);
            for(i=0; i<3; i++){
                var elem = $('.json-to-table')["0"].children[1].children[i].children[1];
                var commitId = elem.innerText;
                var shortId = commitId.substring(0, 7);
                var commitHtml = "<code><a target='_blank' href='https://github.com/shantanu107/test0805/commit/" + commitId + "'>" + shortId + "</a></code>";
                $(elem).html(commitHtml);
                $(elem).css('text-align', 'center');
            }
            $( "#gitCommitSection" ).prepend( "<p>Last 3 commit details : </p>" );
        }
      }
      $('#snackbarTxt').text(data.gitStatus);
      $('#gitOpStatusMsg').text(data.gitStatus);
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

    var gitLoginSuccess = $.cookie("gitUserLoginSuccess");    
    var gitOpStatus = $.cookie("gitOperationSuccess");    
    
    if(gitLoginSuccess == 'true' && gitOpStatus != 'true'){
        $("[href='#step3']").tab('show');
        $('#successMsg').text('Git Login successfull. Proceeding with code push');
        $('#gitBtn').hide();
        var pollServer = setInterval(getCurrentOpStatus, 100);
        $('#snackbarTxt').text('Proceeding with git code push...');
        //$('#gitOpLogs').html('<code> ' + new Date().toISOString() + ' >> Proceeding with git code push... ' + ' </code>');
        $('#gitOpLogs').html('Logs<br /><code> >> ' + new Date().toISOString() + ' : Proceeding with git code push... </code>');
        $('#gitOpLogs').show();
        //$('#gitOpStatusMsg').attr('style', 'padding: 2%;border: 1px dashed darkred;');
        displaySnackBar();
    }
    
    if(gitLoginSuccess == 'true' && gitOpStatus == 'true'){
        $("[href='#step3']").tab('show');
        var commitObj = $.parseJSON($.cookie('gitCommitInfo'));
        createAndShowCommitTable(commitObj);
        createAndShowGitLog();
    }
    $(function(){

        function after_form_submitted(data) {
            if(data.result == 'success'){
                $('form#reused_form').hide();
                $('#success_message').show();
                $('#error_message').hide();
            }
            
            else{
                $('#error_message').append('<ul></ul>');
    
                jQuery.each(data.errors,function(key,val){
                    $('#error_message ul').append('<li>'+key+':'+val+'</li>');
                });

                $('#success_message').hide();
                $('#error_message').show();
    
                //reverse the response on the button
                $('button[type="button"]', $form).each(function(){

                    $btn = $(this);
                    label = $btn.prop('orig_label');
                    if(label){
                        $btn.prop('type','submit' ); 
                        $btn.text(label);
                        $btn.prop('orig_label','');
                    }
                });
                
            }//else
        }
    
        $('#reused_form').submit(function(e){
            e.preventDefault();
    
            $form = $(this);
            var formData = $form.serialize();
            var formDataJson = JSON.stringify(formData);

            var data = $('#reused_form').serializeArray().reduce(function(obj, item) {
                obj[item.name] = item.value;
                return obj;
            }, {});
            console.log('>> data : ' + data);

            console.log('>> formData : ' + formData);
            console.log('>> formDataJson : ' + formDataJson);
            //show some response on the button
            $('button[type="submit"]', $form).each(function()
            {
                $btn = $(this);
                $btn.prop('type','button' ); 
                $btn.prop('orig_label',$btn.text());
                $btn.text('Sending ...');
            });
            
            
            $.ajax({
                type: "POST",
                url: '/feedback',
                data: data,
                dataType: "json",
                success: after_form_submitted
            });
            
          });	
    });
});