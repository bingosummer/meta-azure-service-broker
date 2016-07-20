/*jshint camelcase: false */
/*jshint newcap: false */

'use strict';

var request = require('request');
var common = require('../../common');

var API_VERSION_FOR_TOKEN;
var API_VERSION_FOR_RESOURCE_GROUP;
var API_VERSION_FOR_NAMESPACE;

var environment;
var azure_properties;
var azure_config;

String.prototype.format = function() {
    var formatted = this;
    for (var arg = 0; arg < arguments.length; arg++) {
        formatted = formatted.replace('{' + arg + '}', arguments[arg]);
    }
    return formatted;
};

exports.init = function(properties, config) {
  azure_properties = properties;
  azure_config = config;

  var environmentName = azure_properties.environment;
  environment = common.getEnvironment(environmentName);

  API_VERSION_FOR_TOKEN = common.API_VERSION[environmentName].TOKEN;
  API_VERSION_FOR_RESOURCE_GROUP = common.API_VERSION[environmentName].RESOURCE_GROUP;
  API_VERSION_FOR_NAMESPACE = common.API_VERSION[environmentName].NAMESPACE;
};

exports.getToken = function(callback) {
  request({
    url: '{0}/{1}/oauth2/token'.format(environment.activeDirectoryEndpointUrl, azure_properties.tenant_id),
    qs: {'api-version' : API_VERSION_FOR_TOKEN},
    method: 'POST',
    headers: {
       'Content-Type': 'application/x-www-form-urlencoded',
    },
    form: {
        'grant_type': 'client_credentials',
        'client_id': azure_properties.client_id,
        'client_secret': azure_properties.client_secret,
        'resource': environment.resourceManagerEndpointUrl + '/',
        'scope': 'user_impersonation'
    }
  }, function(err, response, body){
    if(err) {
        callback(err);
    } else {
        if (response.statusCode == 200) {
          var b = JSON.parse(body);
          callback(null, b.access_token);
        } else {
          callback(new Error(body));
        }
    }
  });
};

exports.createResourceGroup = function(accessToken, callback){
  request({
    url: '{0}/subscriptions/{1}/resourceGroups/{2}'.format(environment.resourceManagerEndpointUrl, azure_properties.subscription_id, azure_config.resourceGroupName),
    qs: {'api-version' : API_VERSION_FOR_RESOURCE_GROUP},
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken 
    },
    json: {
        'location': azure_config.location
    }
}, function(err, response, body){
     if(err) {
         callback(err);
     } else {
         if (body.properties.provisioningState === 'Succeeded')
             callback(null, accessToken);
         else
             callback(new Error(body));
     }
  });
};

exports.createNamespace = function(accessToken, callback) {
  request({
    url: '{0}/subscriptions/{1}/resourceGroups/{2}/providers/Microsoft.ServiceBus/namespaces/{3}'.format(environment.resourceManagerEndpointUrl, azure_properties.subscription_id, azure_config.resourceGroupName, azure_config.namespaceName),
    qs: {'api-version' : API_VERSION_FOR_NAMESPACE},
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
    },
    json: {
        'location': azure_config.location,
        'kind': azure_config.sbType,
        'sku': {
            'name': 'StandardSku',
            'tier': azure_config.sbTier
        },
        'properties': {
        }
    }
  }, function(err, response, body){
       if(err) {
           callback(err);
       } else {
           if (response.statusCode == 200)
               callback(null, azure_config.resourceGroupName, azure_config.NamespaceName);
           else
               callback(new Error(body));
       }
  });
};

exports.getNamespace = function(accessToken, callback) {
  request({
    url: '{0}/subscriptions/{1}/resourceGroups/{2}/providers/Microsoft.ServiceBus/namespaces/{3}'.format(environment.resourceManagerEndpointUrl, azure_properties.subscription_id, azure_config.resourceGroupName, azure_config.namespaceName),
    qs: {'api-version' : API_VERSION_FOR_NAMESPACE},
    method: 'GET',
    headers: {
        'Authorization': 'Bearer ' + accessToken
    }
  }, function(err, response, body){
       if(err) {
           callback(err);
       } else {
           if (response.statusCode == 200) {
               var b = JSON.parse(body);
               callback(null, b.properties.provisioningState);
           }
           else {
               var e = new Error(body);
               e.statusCode = response.statusCode;
               callback(e);
           }
       }
  });
};

exports.listNamespaceKeys = function(accessToken, callback) {
  request({
    url: '{0}/subscriptions/{1}/resourceGroups/{2}/providers/Microsoft.ServiceBus/namespaces/{3}/authorizationRules/RootManageSharedAccessKey/ListKeys'.format(environment.resourceManagerEndpointUrl, azure_properties.subscription_id, azure_config.resourceGroupName, azure_config.namespaceName),
    qs: {'api-version' : API_VERSION_FOR_NAMESPACE},
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + accessToken
    }
  }, function(err, response, body){
       if(err) {
           callback(err);
       } else {
           if (response.statusCode == 200) {
               var b = JSON.parse(body);
               callback(null, 'RootManageSharedAccessKey', b.primaryKey);
           }
           else
               callback(new Error(body));
       }
  });
};

exports.delNamespace = function(accessToken, callback) {
  request({
    url: '{0}/subscriptions/{1}/resourceGroups/{2}/providers/Microsoft.ServiceBus/namespaces/{3}'.format(environment.resourceManagerEndpointUrl, azure_properties.subscription_id, azure_config.resourceGroupName, azure_config.namespaceName),
    qs: {'api-version' : API_VERSION_FOR_NAMESPACE},
    method: 'DELETE',
    headers: {
        'Authorization': 'Bearer ' + accessToken
    }
  }, function(err, response, body){
       callback(err);
  });
};
