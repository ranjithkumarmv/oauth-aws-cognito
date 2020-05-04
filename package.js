Package.describe({
  name: 'ranjithkumarmv:oauth-aws-cognito',
  version: '0.0.1',
  summary: 'OAuth handler for Cognito',
  git: 'https://github.com/ranjithkumarmv/oauth-aws-cognito',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.use('accounts-ui', ['client', 'server']);
  api.use('oauth2', ['client', 'server']);
  api.use('oauth', ['client', 'server']);
  api.use('http', ['server']);
  api.use(['underscore', 'service-configuration'], ['client', 'server']);
  api.use(['random', 'templating'], 'client');

  api.export('Cognito');

  api.addFiles(
    ['cognito_configure.html', 'cognito_configure.js'],
    'client');

  api.addFiles('cognito_server.js', 'server');
  api.addFiles('cognito_client.js', 'client');
});
