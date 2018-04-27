$( ".lg-btn" ).click(function() {
    $.cookie('sfUserLoggedIn', null);
    $.cookie('sfUserFullDetails', null);
    window.open('/');
    self.close();
});
$('.alert-success').hide();
$('.alert-danger').hide();
$('.progressBarDiv').hide();
$('.jumbo2').hide();
$('.jumbo1').show();

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

var url = window.location.href;
if(url.searchParams){
    var login = url.searchParams.get("login");
    console.log('>> login : ' + login);
    if(login=='success'){
        opener.location.reload(true);
        self.close();
    }
    /* 
    var getSfFiles = url.searchParams.get("getSfFiles");
    console.log('>> getSfFiles : ' + getSfFiles);
    if(getSfFiles=='true'){
        $(".step2").faLoading({
            type: undefined, 
            title: 'Loading..' , 
            icon: "fa-refresh",
            spin: true,
            status : "loading", 
            text : 'Fetching Salesforce Metadat Files',
            timeout : undefined, 
            closeCallback: undefined, 
            closeButton: false 
      });
    }
    */
}
var loggedInSfUser = $.cookie("sfUserLoggedIn");
var loggedInSfUserDetails = $.cookie("sfUserFullDetails");
if(loggedInSfUser === undefined){
    $('.alert-success').hide();
    $('.alert-danger').hide();
    $('.jumbo1').show();
    $('.jumbo2').hide();
    $('.lg-btn').hide();
}
if(loggedInSfUser == 'true'){
    $(".progress-bar").css("width", "10%");
    $('.alert-success').show();
    $('.alert-danger').hide();
    $('.progressBarDiv').show();
    $('.jumbo2').show();
    $('.lg-btn').show();
    $('.jumbo1').hide();
    var user = $.cookie('sfUserFullDetails');
    user = user.substring(2, user.length);
    var jsonobj = $.parseJSON(user);
    console.log(jsonobj);
    $('.sfUserName').text(jsonobj.display_name);
    $('.sfUserName').show();
    //$('.selectpicker').selectpicker();
    createMetaDataSelectlist();
}
if(loggedInSfUser == 'false'){
    $('.alert-success').hide();
    $('.alert-danger').show();
    $('.jumbo1').show();
    $('.jumbo2').hide();
    $('.lg-btn').hide();
}

$("#prodBtn").click(prodLogin);
$("#sandBtn").click(sandLogin);
function prodLogin(){
    
    $(".container").faLoading({
          // undefined or true will add loading other can be "add", "remove" or "up<a href="https://www.jqueryscript.net/time-clock/">date</a>"
          type: undefined, 
          // creates an title bar
          title: 'Loading..' , 
          //  fa icon
          icon: "fa-refresh",
          // icon sppining
          spin: true,
          // text message ( undefined or false for empty )
          status : "loading", 
          // text message ( undefined or false for empty )
          text : 'Waiting for Salesforce OAuth Login',
          // timeout to close msg
          timeout : undefined, 
          // call back for when the message is closed (by timeout or x button(in case it ever gets one))
          closeCallback: undefined, 
          // adds and close button
          closeButton: false 
    });
    //loginUrl = 'https://login.salesforce.com/'; 
    login('prod');
}
function createMetaDataSelectlist(){
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
    $.each(jsonobj, function(key, value) {
        $('.selectpicker')
            .append($("<option>" + value +"</option>"));
   });
   $('.sfMetaSelectList').children('option:first').remove();
   //$('.selectpicker').selectpicker();
   $('.selectpicker').selectpicker({
    style: 'btn-info',
    size: 5    
  });  
}
//To be used later

//Select all to be used along with a checkbox
$('.selectpicker').selectpicker('selectAll');
//Disable once the user has selected
$('.ex-disable').click(function() {
    $('.disable-example').prop('disabled',true);
    $('.disable-example').selectpicker('refresh');
});
//Enable if the user wants to after the user has selected
$('.ex-enable').click(function() {
    $('.disable-example').prop('disabled',false);
    $('.disable-example').selectpicker('refresh');
});
function sandLogin(){
    //loginUrl = 'https://test.salesforce.com/';
    login('test');
}
function login(env){
    
    var rootOauthUrl = '/oauth2/auth?sfEndpointUrl=';
    if(env == 'test')
        window.open(rootOauthUrl + 'test');
    if(env == 'prod')
        window.open(rootOauthUrl + 'login');

}
$('#nextBtn').click(function() {
    var selectedValues = $('.sfMetaSelectList').val();
    var sfMetadataCookie = $.cookie('sfMetaDataList'); 
    sfMetadataCookie = sfMetadataCookie.substring(2, sfMetadataCookie.length);
    var allValues = $.parseJSON(sfMetadataCookie);
    
    var selectedArray = [];
    var allValuesArray = [];

    $.each(selectedValues, function (i,v){
        console.log(i,v);
        selectedArray.push(v);
    });

    $.each(allValues, function (i,v){
        console.log(i,v);
        allValuesArray.push(v);
    });
    var excludedMtDt = diff(allValuesArray, selectedArray);
    $.cookie('sfExcludedMtDt', excludedMtDt);
    //window.open('/index?getSfFiles=true');
    var url = window.location.href;    
    var params = window.location.search;
    var path = window.location.pathname;
    url += 'index';
    if (url.indexOf('?') > -1){
       url += '&getSfFiles=true';
    }else{
       url += '?getSfFiles=true';
    }
    window.location.href = url;
});

function diff(A, B) {
     return A.filter(function (a) {
         return B.indexOf(a) == -1;
     });
 }