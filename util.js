var util = {};
var fs = require('fs');
/*
 * Sync Deletes a folder recursively
 * @path: folder path
 * @exclude: exclude a certain folder's name
 * @doNotDeleteRoot: do not delete root folder
 */
util.deleteFolderRecursive = function(path, exclude, doNotDeleteRoot) {
    
    if( fs.existsSync(path) ) {
      fs.readdirSync(path).forEach(function(file,index){
        var curPath = path + "/" + file;
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
          if(!exclude || file != exclude){
            util.deleteFolderRecursive(curPath, exclude);
          }
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      if(!doNotDeleteRoot) fs.rmdirSync(path);
    }
};
module.exports = util;