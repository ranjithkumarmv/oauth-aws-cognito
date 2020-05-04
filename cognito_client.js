'use strict';

/**
 * Define the base object namespace. By convention we use the service name
 * in PascalCase (aka UpperCamelCase). Note that this is defined as a package global (boilerplate).
 */
Cognito = {};

/**
 * Request Cognito credentials for the user (boilerplate).
 * Called from accounts-cognito.
 *
 * @param {Object}    options                             Optional
 * @param {Function}  credentialRequestCompleteCallback   Callback function to call on completion. Takes one argument, credentialToken on success, or Error on error.
 */
Cognito.requestCredential = function (options, credentialRequestCompleteCallback) {
  /**
   * Support both (options, callback) and (callback).
   */
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options;
    options = {};
  } else if (!options) {
    options = {};
  }

  /**
   * Make sure we have a config object for subsequent use (boilerplate)
   */
  const config = ServiceConfiguration.configurations.findOne({
    service: 'cognito'
  });
  if (!config) {
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(
      new ServiceConfiguration.ConfigError()
    );
    return;
  }

  /**
   * Boilerplate
   */
  const credentialToken = Random.secret();
  const loginStyle = OAuth._loginStyle('cognito', config, options);
  const redirectUri = 'https://' + config.redirectUri + '/_oauth/cognito';

  console.log(redirectUri);
  

  /**
   * Cognito requires response_type and client_id
   * We use state to roundtrip a random token to help protect against CSRF (boilerplate)
   */
  const loginUrl = 'https://' + config.domainUrl + '/oauth2/authorize' +
    '?response_type=code' +
    '&redirect_uri=' + redirectUri +
    '&client_id=' + config.clientId +
    '&state=' + OAuth._stateParam(loginStyle, credentialToken);

  /**
   * Client initiates OAuth login request (boilerplate)
  */
  OAuth.launchLogin({
    loginService: 'cognito',
    loginStyle: loginStyle,
    loginUrl: loginUrl,
    credentialRequestCompleteCallback: credentialRequestCompleteCallback,
    credentialToken: credentialToken,
    popupOptions: {
      height: 600
    }
  });
};
