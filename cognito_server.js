'use strict';

/**
 * Define the base object namespace. By convention we use the service name
 * in PascalCase (aka UpperCamelCase). Note that this is defined as a package global.
 */
Cognito = {};

/**
 * Boilerplate hook for use by underlying Meteor code
 */
Cognito.retrieveCredential = (credentialToken, credentialSecret) => {
  return OAuth.retrieveCredential(credentialToken, credentialSecret);
};

/**
 * Define the fields we want. Note that they come from various places...
 *  id, reputation, created: from https://api.cognito.com/3/account/{username}
 *  email: from https://api.cognito.com/3/account/{username}/settings
 * Note that we *must* have an id. Also, this array is referenced in the
 * accounts-cognito package, so we should probably keep this name and structure.
 */
Cognito.whitelistedFields = ['id', 'email', 'reputation', 'created'];

/**
 * Register this service with the underlying OAuth handler
 * (name, oauthVersion, urls, handleOauthRequest):
 *  name = 'cognito'
 *  oauthVersion = 2
 *  urls = null for OAuth 2
 *  handleOauthRequest = function(query) returns {serviceData, options} where options is optional
 * serviceData will end up in the user's services.cognito
 */
OAuth.registerService('cognito', 2, null, function (query) {

  /**
   * Make sure we have a config object for subsequent use (boilerplate)
   */
  const config = ServiceConfiguration.configurations.findOne({
    service: 'cognito'
  });
  if (!config) {
    throw new ServiceConfiguration.ConfigError();
  }

  /**
   * Get the token and username (Meteor handles the underlying authorization flow).
   * Note that the username comes from from this request in Cognito.
   */
  const response = getTokens(config, query);
  const accessToken = response.accessToken;
  const username = response.username;

  /**
   * If we got here, we can now request data from the account endpoints
   * to complete our serviceData request.
   * The identity object will contain the username plus *all* properties
   * retrieved from the account and settings methods.
  */
  const identity = _.extend(
    { username },
    getUserInfo(config, username, accessToken)
  );

  /**
   * Build our serviceData object. This needs to contain
   *  accessToken
   *  expiresAt, as a ms epochtime
   *  refreshToken, if there is one
   *  id - note that there *must* be an id property for Meteor to work with
   *  email
   *  reputation
   *  created
   * We'll put the username into the user's profile
   */
  const serviceData = {
    accessToken,
    expiresAt: (+new Date) + (1000 * response.expiresIn)
  };
  if (response.refreshToken) {
    serviceData.refreshToken = response.refreshToken;
  }
  _.extend(serviceData, _.pick(identity, Cognito.whitelistedFields));

  /**
   * Return the serviceData object along with an options object containing
   * the initial profile object with the username.
   */
  return {
    serviceData: serviceData,
    options: {
      profile: {
        name: response.username // comes from the token request
      }
    }
  };
});

/**
 * The following three utility functions are called in the above code to get
 *  the access_token, refresh_token and username (getTokens)
 *  account data (getAccount)
 *  settings data (getSettings)
 * repectively.
 */

/** getTokens exchanges a code for a token in line with Cognito's documentation
 *
 *  returns an object containing:
 *   accessToken        {String}
 *   expiresIn          {Integer}   Lifetime of token in seconds
 *   refreshToken       {String}    If this is the first authorization request
 *   account_username   {String}    User name of the current user
 *   token_type         {String}    Set to 'Bearer'
 *
 * @param   {Object} config       The OAuth configuration object
 * @param   {Object} query        The OAuth query object
 * @return  {Object}              The response from the token request (see above)
 */
const getTokens = function (config, query) {

  const endpoint = 'https://farmmart.auth.us-east-2.amazoncognito.com/oauth2/token';

  /**
   * Attempt the exchange of code for token
   */
  let response;
  try {
    response = HTTP.post(
      endpoint, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: {
        code: query.code,
        client_id: config.clientId,
        client_secret: OAuth.openSecret(config.secret),
        grant_type: 'authorization_code',
        redirect_uri: 'https://67123039.ngrok.io/_oauth/cognito'
      }
    });

  } catch (err) {
    throw _.extend(new Error(`Failed to complete OAuth handshake with Cognito. ${err.message}`), {
      response: err.response
    });
  }

  if (response.data.error) {

    /**
     * The http response was a json object with an error attribute
     */
    throw new Error(`Failed to complete OAuth handshake with Cognito. ${response.data.error}`);

  } else {

    /** The exchange worked. We have an object containing
     *   access_token
     *   refresh_token
     *   expires_in
     *   token_type
     *   account_username
     *
     * Return an appropriately constructed object
     */

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      username: response.data.account_username
    };
  }
};

/**
 * getAccount gets the basic Cognito account data
 *
 *  returns an object containing:
 *   id             {Integer}         The user's Cognito id
 *   url            {String}          The account username as requested in the URI
 *   bio            {String}          A basic description the user has filled out
 *   reputation     {Float}           The reputation for the account.
 *   created        {Integer}         The epoch time of account creation
 *   pro_expiration {Integer/Boolean} False if not a pro user, their expiration date if they are.
 *
 * @param   {Object} config       The OAuth configuration object
 * @param   {String} username     The Cognito username
 * @param   {String} accessToken  The OAuth access token
 * @return  {Object}              The response from the account request (see above)
 */
const getUserInfo = function (config, username, accessToken) {

  const endpoint = 'https://' + config.domainUrl + `/oauth2/userInfo`;
  let accountObject;

  /**
   * Note the strange .data.data - the HTTP.get returns the object in the response's data
   * property. Also, Cognito returns the data we want in a data property of the response data
   * Hence (response).data.data
   */
  try {
    accountObject = HTTP.get(
      endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
    ).data;

    accountObject.id = accountObject.sub
    return accountObject;

  } catch (err) {
    throw _.extend(new Error(`Failed to fetch account data from Cognito. ${err.message}`), {
      response: err.response
    });
  }
};
