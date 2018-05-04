require('dotenv').config();
/* var express = require('express'),
    http = require('http'),
    request = require('request'),
    bodyParser = require('body-parser'),
    app = express(); */
var request = require('request');
var jsforce = require('jsforce');
var async = require('async');
var fs = require('fs');
var AdmZip = require('adm-zip');
var git = require('gift');
var path = require('path');
var fse = require("fs-extra");
var cookieParser = require('cookie-parser');
//var session = require('express-session');
var config = require(path.join(__dirname + '/config.js'));

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require("socket.io")(http);


//app.set('port', process.env.PORT || 3000);
app.use(cookieParser());
app.use(function (req, res, next) {
    next(); // <-- important!
});

app.use(express.static(__dirname + '/resource'));

//Heroku Url - https://sf-git-versioner.herokuapp.com/
//Replace localhost with this url for Production run
var environment = process.env.NODE_ENV || 'development';
console.log('process.env.NODE_ENV : ' + process.env.NODE_ENV);
console.log('environment : ' + environment);
const callbackUrl = environment == 'production' ? config.app_prod_url : config.app_local_url;
console.log('CALLBACK_URL : ' + callbackUrl);

var conn2 = {}; sfConnTokens = {}; sfUser = {}; gitUser = {};
var sfUserFullDetails = {};

var oauth2 = new jsforce.OAuth2({
    // change loginUrl to connect to sandbox
    //loginUrl : 'https://login.salesforce.com',
    clientId: '3MVG9HxRZv05HarStJl4amZCrNBqElkmxu712ds3H7h77BVraWr7Rl4aFhIU8oNMmKDXDBDYlP8y6_Hs39R7H',
    clientSecret: '5522323617141747048',
    //redirectUri: 'http://localhost:3000/oauth2/callback'
    redirectUri: callbackUrl + '/oauth2/callback'
});
//status object
var status = {
    tempPath: '/tmp/',
    zipPath: "zips/",
    sfExtract: "sfExtract/",
    zipFile: "_MyPackage" + Math.random() + ".zip",
    unZipPath: "unZip/"
    //zipFile : "MyPackage.zip"    
};
var sfMetadataDescribe = {};
var sfMetadataTypes = [{}];
var gitRepoExists = false;

app.get('/', function (req, res) {
    console.log('Current Directory : ' + __dirname);
    /*
    var reqPath = path.join(__dirname, '../../');
    fs.mkdirSync(reqPath + '/tmpfldr');
    folderPath = reqPath + '/tmpfldr';
    */
    res.sendFile(path.join(__dirname + '/index.html'));
    //res.redirect('/oauth2/auth');
});

io.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
      //console.log(data);
    });
    socket.on('get git status', function (data) {
      //console.log(data);
      socket.emit('gitStatus', { gitStatus: gitUser.gitStatus });
    });
    socket.on('get sf status', function (data) {
      //console.log(data);
      socket.emit('sfOpStatus', { sfOpStatus: sfUser.sfOpStatus });
    });
});

http.listen(3000,function(){
    console.log("Listening on 3000");
});

app.get('/index', function (req, res) {
    var passedVariable = req.query.login;
    var getSfFiles = req.query.getSfFiles;
    var sfFilesExtracted = req.cookies.sfFilesExtracted;
    if (getSfFiles == 'true' && sfFilesExtracted != 'true') {
        sfUser.sfOpStatus = 'Starting Salesforce Metadata Extraction';
        stratSfMtDtFileExtract(req, res, function (err, success) {
            if (!err) {
                console.log('stratSfMtDtFileExtract Process Success');
                sfUser.sfOpStatus = 'Salesforce File Extraction Process Complete';
                res.cookie('sfFilesExtracted', true).sendFile(path.join(__dirname + '/index.html'));
            }
            else {
                console.log('stratSfMtDtFileExtract Process Error : ' + err);
                res.cookie('sfFilesExtracted', false).sendFile(path.join(__dirname + '/index.html'));
            }
        });
    }
    else {
        res.sendFile(path.join(__dirname + '/index.html'));
    }
});

app.get('/success', function (req, res) {
    var passedVariable = req.query.sfLogin;
    res.sendFile(path.join(__dirname + '/success.html'));
    // Do something with variable
});

app.get('/gitStart', function (req, res) {
    console.log('Starting GitHub Authentication');
    res.redirect('https://github.com/login/oauth/authorize?client_id=2d1f7b29b3cc06d52979&scope=public_repo&redirect_uri=' + callbackUrl + '/git/oauth&state=12345');
});
app.get('/git/oauth', function (req, response) {

    var code = req.param('code');
    var access_token = '';
    console.log('code received from Step 1 of Git Authentication : ' + code);
    if (code) {
        var postData = {
            code: code,
            client_id: '2d1f7b29b3cc06d52979',
            client_secret: '4881ea1e3619c0f286fc756b2bde83e3044c3d74',
            //redirect_uri: 'http://localhost:3000/git/oauth',
            redirect_uri: callbackUrl + '/git/oauth',
            state: '12345'
        }

        var url = 'https://github.com/login/oauth/access_token'
        var options = {
            method: 'post',
            body: postData,
            json: true,
            url: url
        }
        request(options, function (err, res, body) {
            if (err) {
                console.error('error posting json: ', err)
                throw err
            }
            var headers = res.headers
            var statusCode = res.statusCode
            console.log('Github access_token call statusCode: ', statusCode);
            access_token = (body.access_token != null && body.access_token != access_token) ? body.access_token : access_token;
            console.log('Github access_token call access_token : ', access_token);
            getGitUser(access_token, response);
        })
    }
});
function getGitUser(access_token, response) {

    var url = 'https://api.github.com/user';
    var token = 'token ' + access_token;
    var options = {
        method: 'GET',
        url: url,
        headers: { 'User-Agent': 'node.js', 'Authorization': token }
    }
    request(options, function (err, res, body) {
        if (err) {
            console.error('error posting json: ', err)
            throw err
        }
        var headers = res.headers;
        var statusCode = res.statusCode;
        console.log('getGitUser call statusCode: ', statusCode);
        console.log('getGitUser call res: ', res);
        console.log('getGitUser call body: ', body);
        //Create user specific git object
        gitUser.username = body.login;
        gitUser.id = body.id;
        gitUser.url = body.url;
        gitUser.html_url = body.html_url;
        gitUser.repos_url = body.repos_url;
        gitUser.type = body.type;
        gitUser.email = body.email;
        gitUser.gitStatus = 'Github Login Successfull. Checking if Repository already exists';
        //response.cookie('gitOperationSuccess', true).redirect('/index?gitOpSuccess=true');
        getGitRepo(access_token, function (err, success) {
            console.log("getGitRepo err : " + err);
            console.log("getGitRepo success : " + success);

            if (!err) {
                gitRepoExists = true;
                gitUser.gitRepoExists = true;
                gitUser.gitStatus = 'Github Repository already exists!';
            }
            if (err == 'git repo not found') {
                gitRepoExists = false;
                gitUser.gitRepoExists = false;
                err = null;
                gitUser.gitStatus = 'sf-git-versioner Github Repository not found';
            }
            if (!err) {
                //gitRepoExists = true;
                //gitUser.gitRepoExists = true;
                createRepo(access_token, 'shantanu107', function (err, success) {
                    console.log("createRepo err : " + err);
                    console.log("createRepo success : " + success);
                    if (!err) {
                        gitClone(access_token, function (err, success) {
                            console.log("gitClone err : " + err);
                            console.log("gitClone success : " + success);
                            if (!err) {
                                gitUser.gitStatus = 'Cloning sf-git-versioner Github Repository';
                                //reqPath + status.unZipPath + '_' + sfUser.userOrgId
                                //folderPath = __dirname + status.tempPath + 'gitRepo/' + '_' + sfUser.userOrgId;
                                var source = __dirname + status.tempPath + status.sfExtract + 'unpackaged/';
                                var reqPath = path.join(__dirname, '../');
                                //var destination = reqPath + status.unZipPath + '_'  + sfUser.userOrgId;
                                var destination = __dirname + status.tempPath + 'gitRepo/' + '_' + sfUser.userOrgId;
                                // copy source folder to destination
                                fse.copy(source, destination, function (err) {
                                    if (err) {
                                        console.log('An error occured while copying the folder.');
                                        return console.error(err);
                                    }
                                    console.log('Copy completed!');
                                    gitUser.gitStatus = 'Copying Salesforce files into sf-git-versioner Github Repository';
                                    gitAdd(access_token, function (err, success) {
                                        console.log("gitAdd err : " + err);
                                        console.log("gitAdd success : " + success);
                                        if (!err) {
                                            gitUser.gitStatus = 'Running git Add command for sf-git-versioner Github Repository';
                                            gitCommit(access_token, function (err, success) {
                                                console.log("gitCommit err : " + err);
                                                console.log("gitCommit success : " + success);
                                                if (!err) {
                                                    gitUser.gitStatus = 'Commiting files on sf-git-versioner Github Repository';
                                                    gitPush(access_token, function (err, success) {
                                                        console.log("gitPush err : " + err);
                                                        console.log("gitPush success : " + success);
                                                        if (!err) {
                                                            console.log('Full Process Success');
                                                            gitUser.gitStatus = 'Files successfully pushed to sf-git-versioner Github Repository Origin';
                                                            gitUser.gitStatus = 'success';
                                                            response.cookie('gitOperationSuccess', true).redirect('/index?gitOpSuccess=true');
                                                        }
                                                        else {
                                                            console.log('Full Process Error : ' + err);
                                                            response.cookie('gitOperationSuccess', false).redirect('/index?gitOpSuccess=false');
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
            }
        });
    })
}

app.get('/oauth2/auth', function (req, res) {
    var endpoint = req.query.sfEndpointUrl;
    if (endpoint) {
        oauth2.loginUrl = 'https://' + endpoint + '.salesforce.com';
        oauth2.tokenServiceUrl = "https://" + endpoint + ".salesforce.com/services/oauth2/token";
        oauth2.revokeServiceUrl = "https://" + endpoint + ".salesforce.com/services/oauth2/revoke";
        oauth2.authzServiceUrl = "https://" + endpoint + ".salesforce.com/services/oauth2/authorize";
        sfConnTokens.endpoint = endpoint;
    }
    res.redirect(oauth2.getAuthorizationUrl({ scope: 'api id web refresh_token' }));
});
app.get('/oauth2/logout', function (req, res) {
    var conn = new jsforce.Connection({
        //sessionId : conn.sessionId,
        //serverUrl : conn.instanceUrl
    });
    conn.logout(function (err) {
        if (err) { return console.error(err); }
        console.log('Session Logged Out Successfully');
    });
});

app.get('/oauth2/callback', function (req, res) {

    var conn = new jsforce.Connection({ oauth2: oauth2 });
    conn.metadata.pollTimeout = process.env.SF_METADATA_POLL_TIMEOUT || 120000;
    //creates all the main folders (temp folder, zip folder and git clone folder)
    try {
        console.log(__dirname);
        if (!fs.existsSync(__dirname + status.tempPath)) {
            fs.mkdirSync(__dirname + status.tempPath);
        }
        if (!fs.existsSync(__dirname + status.tempPath + status.zipPath)) {
            fs.mkdirSync(__dirname + status.tempPath + status.zipPath);
        }
        if (!fs.existsSync(__dirname + status.tempPath + status.sfExtract)) {
            fs.mkdirSync(__dirname + status.tempPath + status.sfExtract);
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

        //res.send('success'); // or your desired response
        sfConnTokens.accessToken = conn.accessToken;
        sfConnTokens.refreshToken = conn.refreshToken;
        sfConnTokens.instanceUrl = conn.instanceUrl;

        res.cookie('sfUserLoggedIn', true);
        //req.session.sfUserData = sfConnTokens;

        sfUser.sfConnTokens = sfConnTokens;
        sfUser.instanceUrl = conn.instanceUrl;
        sfUser.userId = userInfo.id;
        sfUser.userOrgId = userInfo.organizationId;
        sfUser.sfOpStatus = 'Salesforce Login Successfull';
        status.zipFile = "Metadata_" + sfUser.userOrgId + ".zip";

        getSFUserDetails(sfConnTokens.endpoint, sfUser.userId, sfUser.userOrgId, function (err, success) {
            console.log("getSFUserDetails err : " + err);
            console.log("getSFUserDetails success : " + success);
            if (!err) {
                sfUser.sfOpStatus = 'Salesforce User Details Fetched';
                sfUserFullDetails = success;
                res.cookie('sfUserFullDetails', sfUserFullDetails);
                //res.redirect('/success?sfLogin=' + encodeURIComponent('true'));
                getSFMetaData(res, conn2, function (err, success) {
                    if (err) {
                        return callback(err, null);
                    }
                    else {
                        sfUser.sfOpStatus = 'Salesforce Metadata Details Fetched';
                        res.redirect('/success?sfLogin=' + encodeURIComponent('true'));
                    }
                });
            }
            else {
                console.log('Error while getting sf user identitiy details : ' + err);
            }
        });

        conn2 = new jsforce.Connection({
            oauth2: oauth2,
            instanceUrl: sfConnTokens.instanceUrl,
            accessToken: sfConnTokens.accessToken,
            refreshToken: sfConnTokens.refreshToken
        });
        conn2.metadata.pollTimeout = process.env.SF_METADATA_POLL_TIMEOUT || 120000;
        conn2.on("refresh", function (accessToken, res) {
            // Refresh event will be fired when renewed access token
            // to store it in your storage for next request
            sfConnTokens.accessToken = accessToken;
            console.log('Salesforce accessToken :' + accessToken);
            console.log('Salesforce res :' + res);
        });

        /* conn2.metadata.describe('39.0', function (err, metadata) {
            if (err) { return console.error('err', err); }
            sfMetadataDescribe = metadata;
            sfListMetadata(conn2, function (err, success) {
                //call zipper here
                console.log("sfMetadataTypes err : " + err);
                console.log("sfMetadataTypes success : " + success);

                sfRetrieveZip(conn2, function (err, success) {
                    console.log("sfRetrieveZip err : " + err);
                    console.log("sfRetrieveZip success : " + success);

                    unzipFile(function (err, success) {
                        console.log("unzipFile err : " + err);
                        console.log("unzipFile success : " + success);
                        if (!err)
                            res.redirect('/gitStart');
                    });
                });
            });
        }); */
    });
});
/* 
app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
 */
function stratSfMtDtFileExtract(req, res, callback) {

    console.log("Cookies :  ", req.cookies);

    conn2 = new jsforce.Connection({
        oauth2: oauth2,
        instanceUrl: sfConnTokens.instanceUrl,
        accessToken: sfConnTokens.accessToken,
        refreshToken: sfConnTokens.refreshToken
    });
    conn2.metadata.pollTimeout = process.env.SF_METADATA_POLL_TIMEOUT || 120000;
    sfUser.sfOpStatus = 'Checking Salesforce Connection Status';

    sfListMetadata(req.cookies.sfExcludedMtDt, conn2, function (err, success) {
        //call zipper here
        console.log("sfMetadataTypes err : " + err);
        console.log("sfMetadataTypes success : " + success);

        sfUser.sfOpStatus = 'Preparing to fetch Selected Metadata Type Files';

        sfRetrieveZip(conn2, function (err, success) {
            console.log("sfRetrieveZip err : " + err);
            console.log("sfRetrieveZip success : " + success);
            sfUser.sfOpStatus = 'Preparing to unzip the fetched zip of Selected Salesforce files';

            unzipFile(function (err, success) {
                console.log("unzipFile err : " + err);
                console.log("unzipFile success : " + success);
                if (!err) {
                    //res.redirect('/gitStart');
                    //res.cookie('sfFilesExtracted', true);
                    callback(null, success);
                }
            });
        });
    });
}
function getSFUserDetails(sfEndpoint, sfUserId, sfOrgId, callback) {

    var sf_access_token = 'Bearer ' + sfConnTokens.accessToken;
    sfUser.sfOpStatus = 'Getting Salesforce User Details';
    var url = 'https://' + sfEndpoint + '.salesforce.com/id/' + sfOrgId + '/' + sfUserId;
    var options = {
        method: 'GET',
        json: true,
        headers: { 'Authorization': sf_access_token, 'X-PrettyPrint': 1, 'Accept': 'application/json' },
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

function getSFMetaData(res, conn2, callback) {

    sfUser.sfOpStatus = 'Getting Salesforce Metadata Details';
    conn2.metadata.describe('39.0', function (err, metadata) {
        if (err) { callback(err, null); }
        console.log('Salesforce metadata :' + metadata);
        sfMetadataDescribe = metadata;
        var mtdtarray = [];
        //Create metaDataNameArray here so that we can use the excluded elements here itself
        for (i = 0; i < sfMetadataDescribe.metadataObjects.length; i++) {
            var mtdtName = sfMetadataDescribe.metadataObjects[i].xmlName;
            mtdtarray.push(mtdtName);
        }
        res.cookie('sfMetaDataList', mtdtarray);
        callback(null, mtdtarray);
    });
}

function sfListMetadata(excludeMetadata, conn, callback) {
    sfUser.sfOpStatus = 'Preparing a list of Selected Metadata Types';
    var iterations = parseInt(Math.ceil(sfMetadataDescribe.metadataObjects.length / 3.0));
    //var excludeMetadata = process.env.EXCLUDE_METADATA || '';
    var excludeMetadata = excludeMetadata || process.env.EXCLUDE_METADATA || '';
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
        console.log("sfMetadataTypes err : " + err);
        console.log("sfMetadataTypes results : " + results);
        if (err)
            return callback(err, null);
        else
            return callback(null, results);
    });
}
function sfRetrieveZip(conn, callback) {
    //should use describe
    //retrieve xml

    var _types = [];
    for (var t in sfMetadataTypes) {
        _types.push({
            members: sfMetadataTypes[t],
            name: t,
        });
    }
    var package = { types: _types, version: '39.0' };

    /* 
    package = {
        'types': {
            'members': '*',
            'name': 'ApexPage'
        },
        'version': '39.0'
    };
    */
    var stream = conn.metadata.retrieve({
        unpackaged: package
    }).stream();
    stream.on('end', function () {
        sfUser.sfOpStatus = 'Successfully Retreived Selected Metadata Type Files';
        return callback(null, 'success retreiving zip');
    });
    stream.on('error', function (err) {
        //return callback((err)?createReturnObject(err, 'SF Retrieving metadata ZIP file failed'):null);
        console.log("sfMetadataTypes err : " + err);
        callback(err, null);
    });
    //stream.pipe(fs.createWriteStream(status.tempPath+status.zipPath+status.zipFile));
    stream.pipe(fs.createWriteStream(__dirname + status.tempPath + status.zipPath + status.zipFile));
}

//Unzip metadata zip file
function unzipFile(callback) {

    var gitIgnoreBody = '#ignore files';
    if (process.env.GIT_IGNORE) {
        var spl = process.env.GIT_IGNORE.split(',');
        for (var i in spl) {
            if (spl[i]) {
                gitIgnoreBody += '\n' + spl[i];
            }
        }
    }

    var readmeBody = process.env.REPO_README || "";
    /*
    fs.writeFile(__dirname + status.tempPath+status.sfExtract+status.zipFile+'/README.md', readmeBody, function(err) {
        if(err){
            return callback('README.md file creation failed', null);
        }
        fs.writeFile(__dirname + status.tempPath+status.sfExtract+status.zipFile+'/.gitignore', gitIgnoreBody, function(err) {
            if(err){
                return callback('.gitignore file creation failed', null);
            }
            try{
                var zip = new AdmZip(__dirname + status.tempPath+status.zipPath+status.zipFile);
                zip.extractAllTo(__dirname + status.tempPath+status.sfExtract+status.zipFile+'/', true);
                return callback(null);
            }catch(ex){
                return callback(ex, null);
            }
        }); 
    }); 
    */
    try {
        var zip = new AdmZip(__dirname + status.tempPath + status.zipPath + status.zipFile);
        zip.extractAllTo(__dirname + status.tempPath + status.sfExtract + '/', true);
        sfUser.sfOpStatus = 'Zip of Selected Salesforce files extracted succesfully';
        return callback(null, 'Zip extracted succesfully');
    } catch (ex) {
        return callback(ex, null);
    }
}

function createRepo(access_token, username, callback) {

    if (gitRepoExists) {
        return callback(null, 'git repo already exists');
    }
    else {
        var url = 'https://api.github.com/user/repos';
        var token = 'token ' + access_token;
        var postData = {
            name: 'test0805',
            description: 'Repository for Salesforce Versioner',
            homepage: 'https://github.com',
            private: false,
            has_issues: false,
            has_projects: false,
            auto_init: true
        }

        var options = {
            method: 'POST',
            body: postData,
            url: url,
            headers: { 'User-Agent': username, 'Authorization': token, 'X-OAuth-Scopes': 'public_repo, repo, user' },
            json: true
        }
        request(options, function (err, res, resbody) {
            if (err) {
                console.error('error posting json: ', err)
                return callback(err, null);
            }
            var headers = res.headers;
            var statusCode = res.statusCode;
            console.log('createRepo call statusCode: ', statusCode);
            console.log('createRepo call res: ', res);
            console.log('createRepo call body: ', resbody);
            gitUser.gitStatus = 'sf-git-versioner Github Repository created';
            return callback(null, resbody);
        })
    }
}

//Clones original repo
var gitRepo;
function gitClone(access_token, callback) {
    var folderPath = __dirname + status.tempPath + status.sfExtract;
    //https://x-access-token:[TOKEN REMOVED]@github.com/scoutapp/[REPO]

    var reqPath = path.join(__dirname, '../');
    /* if (!fs.existsSync(reqPath + status.unZipPath)) {
        fs.mkdirSync(reqPath + status.unZipPath);
    }
    if (!fs.existsSync(reqPath + status.unZipPath + '_' + sfUser.userOrgId)) {
        fs.mkdirSync(reqPath + status.unZipPath + '_' + sfUser.userOrgId);
    } */

    //var source = __dirname + status.tempPath + status.sfExtract + 'unpackaged/';
    if (!fs.existsSync(__dirname + status.tempPath + 'gitRepo/')) {
        fs.mkdirSync(__dirname + status.tempPath + 'gitRepo/');
    }
    if (!fs.existsSync(__dirname + status.tempPath + 'gitRepo/' + '_' + sfUser.userOrgId)) {
        fs.mkdirSync(__dirname + status.tempPath + 'gitRepo/' + '_' + sfUser.userOrgId);
    }
    //folderPath = reqPath + status.unZipPath + '_' + sfUser.userOrgId;
    folderPath = __dirname + status.tempPath + 'gitRepo/' + '_' + sfUser.userOrgId;
    /* var status = {
        tempPath: '/tmp/',
        zipPath: "zips/",
        sfExtract: "repos/",
        zipFile: "_MyPackage" + Math.random() + ".zip",
        unZipPath: "unZip/"
        //zipFile : "MyPackage.zip"    
    }; */
    process.env.REPO_URL = process.env.REPO_URL || 'https://x-access-token:' + access_token + '@github.com/shantanu107/test0805'
    git.clone(process.env.REPO_URL, folderPath,
        function (err, _repo) {
            gitRepo = _repo;
            console.log(_repo);
            gitUser.gitRepo = _repo;
            //deletes all cloned files except the .git folder (the ZIP file will be the master)
            //deleteFolderRecursive(folderPath, '.git', true);
            return callback(err, _repo);
        });
}
//Git add new resources
function gitAdd(access_token, callback) {

    console.log('cwd : ' + __dirname);
    var gitRepoPath = __dirname + status.tempPath + 'gitRepo/' + '_' + sfUser.userOrgId;
    process.chdir(gitRepoPath);
    /* var cwd = process.cwd();

    var reqPath = path.join(__dirname, '../');

    process.chdir(path.join(__dirname, '../' + status.unZipPath + '_'  + sfUser.userOrgId));
    process.chdir(cwd);
    console.log('new cwd : ' + __dirname);
 */

    gitRepo.add("-A", function (err) {
        console.log(err);
        if (!err)
            return callback(null, 'successfully added files');
        else
            return
        callback(err, null);
    });
}
function gitCommit(access_token, callback) {
    var userName = process.env.REPO_USER_NAME || "Shantanu";
    var userEmail = process.env.REPO_USER_EMAIL || "shantanu0805@gmail.com";

    gitRepo.identify({ "name": userName, "email": userEmail }, function (err, oth) {
        var commitMessage = process.env.REPO_COMMIT_MESSAGE || 'Automatic commit (sfgit)';
        gitRepo.commit(commitMessage, function (err, oth) {
            if (err) {
                err.details = oth;
                return callback(err.details, null);
            }
            return callback(null, 'git successfully commited files');
        });
    });
}
function gitPush(access_token, callback) {
    gitUser.gitStatus = 'Pushing files to sf-git-versioner Github Repository Origin';
    gitRepo.remote_push("origin", "master", function (err, oth) {
        if (err) {
            err.details = oth;
            return callback(err, null);
        }
        return callback(null, 'git successfully pushed files');
    });
}
function getGitRepo(access_token, callback) {

    var url = 'https://api.github.com/repos/shantanu107/test0805';
    var token = 'token ' + access_token;
    var options = {
        method: 'GET',
        url: url,
        headers: { 'User-Agent': 'node.js', 'Authorization': token }
    }
    request(options, function (err, res, body) {
        if (err) {
            return callback('git repo get failed', null);
        }
        var gitGetRepoResp = JSON.parse(body);
        if (gitGetRepoResp.message == 'Not Found') {
            return callback('git repo not found', null);
        }
        else {
            return callback(null, 'git successfully get repo');
        }
    });
}