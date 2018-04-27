require('dotenv').config();
var express = require('express'),
    http = require('http'),
    request = require('request'),
    bodyParser = require('body-parser'),
    app = express();
var jsforce = require('jsforce');
var async = require('async');
var fs = require('fs');
var AdmZip = require('adm-zip');
var git = require('gift');
var path = require('path');
var fse = require("fs-extra");
var cookieParser = require('cookie-parser')

var CronJob = require('cron').CronJob;
/* new CronJob('* * * * * *', function() {
  console.log('You will see this message every second');
}, null, true, 'America/Los_Angeles');
 */
app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/resource')); 
app.use(cookieParser());

var conn2, sfConnTokens = {};
var sfUserFullDetails = {};

var oauth2 = new jsforce.OAuth2({
    // change loginUrl to connect to sandbox
    // loginUrl : 'https://test.salesforce.com',
    clientId: '3MVG9HxRZv05HarStJl4amZCrNBqElkmxu712ds3H7h77BVraWr7Rl4aFhIU8oNMmKDXDBDYlP8y6_Hs39R7H',
    clientSecret: '5522323617141747048',
    redirectUri: 'http://localhost:3000/oauth2/callback'
});
//status object
var status = {
    tempPath: '/tmp/',
    zipPath: "zips/",
    repoPath: "repos/",
    zipFile: "_MyPackage" + Math.random() + ".zip"
};
var sfMetadataDescribe = {};
var sfMetadataTypes = [{}];
var gitRepoExists = false;

app.get('/', function (req, res) {
    console.log('Current Directory : ' + __dirname);
    res.sendFile(path.join(__dirname + '/index.html'));
    console.log('Starting Salesforce Authentication');
    //res.redirect('/oauth2/auth');
});
app.get('/index', function(req, res) {
    var passedVariable = req.query.login;
    res.sendFile(path.join(__dirname + '/index.html'));
    // Do something with variable
});

app.get('/success', function(req, res) {
    var passedVariable = req.query.sfLogin;
    res.sendFile(path.join(__dirname + '/success.html'));
    // Do something with variable
});

app.get('/oauth2/auth', function (req, res) {
    res.redirect(oauth2.getAuthorizationUrl({ scope: 'api id web refresh_token' }));
});

app.get('/fetchSfMtDT', function (req, res) {
    
    //set process.env.EXCLUDE_METADATA here from the user selection
    var passedVariable = req.query.fetchSfMtDt;
    res.sendFile(path.join(__dirname + '/index.html'));
    sfListMetadata(conn2, function (err, success) {
        //call zipper here
        console.log("sfMetadataTypes err : " + err);
        console.log("sfMetadataTypes success : " + success);
        var metaDataNameArray = [];
        if (err){
            return callback(err, null);
        }
        else{
            for (var t in sfMetadataTypes) {
                console.log(t);
                metaDataNameArray.push(t);
            }
            //res.cookie('sfMetaDataList', metaDataNameArray);
            return callback(null, metaDataNameArray);
        }
    });
});

app.get('/oauth2/callback', function (req, res) {
    
    var conn = new jsforce.Connection({ oauth2: oauth2 });
    conn.metadata.pollTimeout = process.env.SF_METADATA_POLL_TIMEOUT || 120000;

    try {
        if (!fs.existsSync(__dirname + status.tempPath)) {
            fs.mkdirSync(__dirname + status.tempPath);
        }
        if (!fs.existsSync(__dirname + status.tempPath + status.zipPath)) {
            fs.mkdirSync(__dirname + status.tempPath + status.zipPath);
        }
        if (!fs.existsSync(__dirname + status.tempPath + status.repoPath)) {
            fs.mkdirSync(__dirname + status.tempPath + status.repoPath);
        }
    } catch (ex) {
        console.log('Exception while creating folders :' + ex);
    }

    var code = req.param('code');
    conn.authorize(code, function (err, userInfo) {
        if (err) { return console.error(err); }
        // Now you can get the access token, refresh token, and instance URL information.
        // Save them to establish connection next time.
        //console.log(conn);
        
        console.log('Salesforce accessToken :' + conn.accessToken);
        console.log('Salesforce refreshToken :' + conn.refreshToken);
        console.log('Salesforce instanceUrl :' + conn.instanceUrl);
        console.log("Salesforce User ID: " + userInfo.id);
        console.log("Salesforce Org ID: " + userInfo.organizationId);
        sfConnTokens.accessToken = conn.accessToken;
        sfConnTokens.refreshToken = conn.refreshToken;
        sfConnTokens.instanceUrl = conn.instanceUrl;
        res.cookie('sfUserLoggedIn', true);

        getSFUserDetails(userInfo.id, userInfo.organizationId, function (err, success) {
            console.log("getSFUserDetails err : " + err);
            console.log("getSFUserDetails success : " + success);
            if (!err) {
                sfUserFullDetails = success;
                res.cookie('sfUserFullDetails', sfUserFullDetails);
                //res.redirect('/success?sfLogin=' + encodeURIComponent('true'));
            }
            else {
                console.log('Full Process Error : ' + err);
            }
        });

        conn2 = new jsforce.Connection({
            oauth2 : oauth2,
            instanceUrl : sfConnTokens.instanceUrl,
            accessToken : sfConnTokens.accessToken,
            refreshToken : sfConnTokens.refreshToken
        });
        conn2.metadata.pollTimeout = process.env.SF_METADATA_POLL_TIMEOUT || 120000;
        conn2.on("refresh", function(accessToken, res) {
            // Refresh event will be fired when renewed access token
            // to store it in your storage for next request
            sfConnTokens.accessToken = accessToken;
            console.log('Salesforce accessToken :' + accessToken);
            console.log('Salesforce res :' + res);
        });
        getSFMetaData(res, conn2, function(err, success) {

            if (err){
                return callback(err, null);
            }
            else{
                res.redirect('/success?sfLogin=' + encodeURIComponent('true'));
            }
        });
        // ...
        //res.send('success'); // or your desired response
    });
});

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

function getSFMetaData(res, conn2, callback){
    conn2.metadata.describe('39.0', function (err, metadata) {
        if (err) { callback(err, null); }
        console.log('Salesforce metadata :' + metadata);
        sfMetadataDescribe = metadata;
        var mtdtarray = [];
        //Create metaDataNameArray here so that we can use the excluded elements here itself
        for(i=0;i<sfMetadataDescribe.metadataObjects.length;i++){
            var mtdtName = sfMetadataDescribe.metadataObjects[i].xmlName;
            mtdtarray.push(mtdtName);
        }
        res.cookie('sfMetaDataList', mtdtarray);
        callback(null, mtdtarray);
        /* sfListMetadata(conn2, function (err, success) {
            //call zipper here
            console.log("sfMetadataTypes err : " + err);
            console.log("sfMetadataTypes success : " + success);
            var metaDataNameArray = [];
            if (err){
                return callback(err, null);
            }
            else{
                for (var t in sfMetadataTypes) {
                    console.log(t);
                    metaDataNameArray.push(t);
                }
                //res.cookie('sfMetaDataList', metaDataNameArray);
                return callback(null, metaDataNameArray);
            }
        }); */
    });
}
function sfListMetadata(conn, callback) {
    var iterations = parseInt(Math.ceil(sfMetadataDescribe.metadataObjects.length / 3.0));
    var excludeMetadata = process.env.EXCLUDE_METADATA || '';
    var excludeMetadataList = excludeMetadata.toLowerCase().split(',');

    var asyncObj = {};

    function listMetadataBatch(qr) {
        return function (cback) {
            conn.metadata.list(qr, '39.0', function (err, fileProperties) {
                if (!err && fileProperties) {
                    for (var ft = 0; ft < fileProperties.length; ft++) {
                        if (!sfMetadataTypes[fileProperties[ft].type]) {
                            sfMetadataTypes[fileProperties[ft].type] = [];
                        }
                        sfMetadataTypes[fileProperties[ft].type].push(fileProperties[ft].fullName);
                    }
                }
                return cback(err);
            });
        }
    }

    for (var it = 0; it < iterations; it++) {
        var query = [];
        for (var i = 0; i < 3; i++) {
            var index = it * 3 + i;

            if (sfMetadataDescribe.metadataObjects.length > index) {
                var metadata = sfMetadataDescribe.metadataObjects[index];
                if (excludeMetadataList.indexOf((metadata.xmlName || '').toLowerCase()) < 0) {
                    query.push({ type: metadata.xmlName, folder: metadata.folderName });
                }
            }
        }
        if (query.length > 0) {
            asyncObj['fn' + it] = listMetadataBatch(query);
        }
    }
    async.series(asyncObj, function (err, results) {
        if (err)
            return callback(err, null);
        else
            return callback(null, results);
    });
}

function getSFUserDetails(sfUserId, sfOrgId, callback) {
    
    var sf_access_token = 'Bearer ' +  sfConnTokens.accessToken;

    var url = 'https://login.salesforce.com/id/' + sfOrgId + '/' + sfUserId;
    var options = {
        method: 'GET',
        json: true,
        headers: {'Authorization': sf_access_token, 'X-PrettyPrint': 1, 'Accept': 'application/json' },
        url: url
    }
    request(options, function (err, res, body) {
        if (err) {
            console.error('error posting json: ', err);
            callback(err, null);
        }
        var headers = res.headers
        var statusCode = res.statusCode
        console.log('getSFUserDetails call statusCode: ', statusCode);
        console.log('getSFUserDetails call body : ', body);
        callback(null, body);
    })
}
