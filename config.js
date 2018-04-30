var config = {};

config.app_local_url ='http://localhost:3000';
config.app_prod_url = 'https://sf-git-versioner.herokuapp.com';
//CALLBACK_URL = 'http://localhost:3000';
config.sf_client_id = '3MVG9HxRZv05HarStJl4amZCrNBqElkmxu712ds3H7h77BVraWr7Rl4aFhIU8oNMmKDXDBDYlP8y6_Hs39R7H';
config.sf_client_secret = '5522323617141747048';
config.redirect_url ='/oauth2/callback';
config.git_client_id = '2d1f7b29b3cc06d52979';
config.git_redirect_url = '/git/oauth';
config.git_client_secret = '4881ea1e3619c0f286fc756b2bde83e3044c3d74';
config.git_login_url = 'https://github.com/login/oauth/';
config.git_api_url = 'https://api.github.com/user';
config.git_sf_repo_name = 'sf-git-versioner';
config.git_sf_repo_readme =' SALESFORCE VERSIONER'
config.git_sf_repo_url = 'https://x-access-token:'
//SF_METADATA_POLL_TIMEOUT=120000

module.exports = config;