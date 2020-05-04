Template.configureLoginServiceDialogForCognito.helpers({
  siteUrl: function () {
    return Meteor.absoluteUrl();
  }
});

Template.configureLoginServiceDialogForCognito.fields = function () {
  return [
    {property: 'clientId', label: 'Client Id'},
    {property: 'secret', label: 'Client Secret'},
    {property: 'domainUrl', label: 'Aws Cognito Auth Domain'},
    {property: 'redirectUri', label: 'Meteor Service Url'},
  ];
};
