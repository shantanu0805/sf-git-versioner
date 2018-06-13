var dbhelper = {};
const pg = require('pg');

//var connectionString = process.env.DATABASE_URL || "postgres://postgres:localhost:5432/SfGitVersionerPgDb";//postgresql://localhost

const config = {
    user: 'sfmetadata',
    database: 'SfGitVersionerPgDb',
    password: 't1992107',
    port: 5432
};

// pool takes the object above -config- as parameter
const pool = new pg.Pool(config);
var sfUserExists = false;
var gitUserExists = false;
dbhelper.insertUpdateSfUserDetails = function(sfUserObj){
    console.log('>> sfUserObj in dbhelper.insertSfUserDetails : ' + sfUserObj);
    pool.connect(function (err, client, done) {
        if (err) {
            console.log("Can not connect to the DB" + err);
        }
        //const data = {text: req.body.text, complete: false};
        var tokenId = sfUserObj.userId + '/' + sfUserObj.userOrgId;
        client.query('SELECT * FROM public."SF_DTL" WHERE tokenid = $1', [tokenId], function (err, result) {
            //done();
            if (err) {
                console.log(err);
            }
            else{
                console.log(result.rows);
                if(result.rowCount > 0){
                    var dt = new Date();
                    var utcDate = dt.toUTCString();
                    client.query('UPDATE public."SF_DTL" SET accesstoken=$1, refreshtoken=$2, latestlogintime=$3 WHERE tokenId = $4', [sfUserObj.sfConnTokens.accessToken, sfUserObj.sfConnTokens.refreshToken, utcDate, tokenId], function (err, result) {
                        //done();
                        if (err) {
                            console.log(err);
                        }
                        else{
                            console.log('>> Salesforce User Updated');
                        }
                    })
                }
                else{
                    if(!sfUserExists){
                        //client.query('INSERT INTO items(text, complete) values($1, $2)',[data.text, data.complete]);
                        var dt = new Date();
                        var utcDate = dt.toUTCString();
                        client.query('INSERT INTO public."SF_DTL"( userid, orgid, tokenid, accesstoken, refreshtoken, instanceurl, latestlogintime) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
                        [sfUserObj.userId, sfUserObj.userOrgId, sfUserObj.userId + '/' + sfUserObj.userOrgId, sfUser.sfConnTokens.accessToken, sfUser.sfConnTokens.refreshToken, sfUser.instanceUrl, utcDate], function (err, result) {
                            //done();
                            if (err) {
                                console.log(err);
                            }
                            else{
                                //res.status(200).send(result.rows);
                            }
                        })
                    }
                }
            }
        })
    })
}

dbhelper.updateSfUserDetails = function(tokenId, sfUserObj){

    console.log('>> sfUserObj in dbhelper.insertSfUserDetails : ' + sfUserObj);
    pool.connect(function (err, client, done) {
        if (err) {
            console.log("Can not connect to the DB" + err);
        }
        else{
            var dt = new Date();
            var utcDate = dt.toUTCString();
            client.query('UPDATE public."SF_DTL" SET displayname=$1, username=$2, email=$3, idurl=$4 WHERE tokenId = $5', [sfUserObj.display_name, sfUserObj.username, sfUserObj.email, sfUserObj.id, tokenId], function (err, result) {
                //done();
                if (err) {
                    console.log(err);
                }
                else{
                    console.log('>> Salesforce User Updated');
                }
                done();
            })
        }
    })
}

dbhelper.updateSfMetadataSelection = function(tokenId, sfExcludedMtDt){

    //console.log('>> sfUserObj in dbhelper.insertSfUserDetails : ' + sfUserObj);
    pool.connect(function (err, client, done) {
        if (err) {
            console.log("Can not connect to the DB" + err);
        }
        else{
            var dt = new Date();
            var utcDate = dt.toUTCString();
            client.query('UPDATE public."SF_DTL" SET excludedmetadata=$1 WHERE tokenId = $2', [sfExcludedMtDt, tokenId], function (err, result) {
                //done();
                if (err) {
                    console.log(err);
                }
                else{
                    console.log('>> Salesforce User Updated');
                }
            })
        }
    })
}

dbhelper.insertUpdateGitUserDetails = function(gitUser){
    console.log('>> gitUser in dbhelper.insertSfUserDetails : ' + gitUser);
    pool.connect(function (err, client, done) {
        if (err) {
            console.log("Can not connect to the DB" + err);
        }
        
        client.query('SELECT * FROM public."GIT_DTL" WHERE "gitId" = $1', [gitUser.id], function (err, result) {
            //done();
            if (err) {
                console.log(err);
            }
            else{
                console.log(result.rows);
                if(result.rowCount > 0){
                    var dt = new Date();
                    var utcDate = dt.toUTCString();
                    client.query('UPDATE public."GIT_DTL" SET lastlogindate=$1 WHERE "gitId" = $2', [utcDate, gitUser.id], function (err, result) {
                        //done();
                        if (err) {
                            console.log(err);
                        }
                        else{
                            console.log('>> Github User Updated');
                        }
                    })
                }
                else{
                    if(!gitUserExists){
                        //client.query('INSERT INTO items(text, complete) values($1, $2)',[data.text, data.complete]);
                        var dt = new Date();
                        var utcDate = dt.toUTCString();
                        client.query('INSERT INTO public."GIT_DTL"( username, "gitId", url, type, email, reponame, sftoken, lastlogindate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', 
                        [gitUser.username, gitUser.id, gitUser.url, gitUser.type, gitUser.email, 'test0805', sfUser.tokenId, utcDate], function (err, result) {
                            //done();
                            if (err) {
                                console.log(err);
                            }
                            else{
                                //res.status(200).send(result.rows);
                            }
                        })
                    }
                }
            }
        })
    })
}

module.exports = dbhelper;