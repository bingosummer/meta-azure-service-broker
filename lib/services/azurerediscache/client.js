/* jshint camelcase: false */
/* jshint newcap: false */

var uuid = require('node-uuid');
var msRestAzure = require('ms-rest-azure');
var AzureMgmtRedisCache = require('azure-arm-rediscache');

var common = require('../../common/');

var redis;

var log;

exports.instantiate = function(azure, logger) {

    log = logger;
    
    var environment = common.getEnvironment(azure.environment);
    var options = {
        environment: environment
    };

    var appTokenCreds = new msRestAzure.ApplicationTokenCredentials(azure.client_id, azure.tenant_id, azure.client_secret, options);

    var rc = new AzureMgmtRedisCache(appTokenCreds, azure.subscription_id, environment.resourceManagerEndpointUrl);
    redis = rc.redis;    
};

exports.provision = function(resourceGroup, cacheName, parameters, next) {
    var clientRequestId = uuid.v4();
    var options = {
        customHeaders: {
            'x-ms-client-request-id': clientRequestId,
            'x-ms-return-client-request-id': true
        }
    };
    log.debug('Create or update Redis Cache: x-ms-client-request-id: %s', clientRequestId);
    redis.createOrUpdate(resourceGroup, cacheName, parameters, options,
        function(err, result, request, response) {
            common.logHttpResponse(log, response, 'Create or update Redis Cache', true);
            next(err, result);
        }
    );
};

exports.poll = function(resourceGroup, cacheName, next) {
    redis.get(resourceGroup, cacheName, function(err, result, request, response) {
        common.logHttpResponse(log, response, 'Get Redis Cache', true);
        next(err, result);
    });
};

exports.deprovision = function(resourceGroup, cacheName, next) {
    redis.deleteMethod(resourceGroup, cacheName, function(err, result, request, response) {
        common.logHttpResponse(log, response, 'Delete Redis Cache', true);
        next(err, result);
    });
};

// exports.bind = function(next) {
// there is nothing to do for 'bind' with redisCache
// }

// exports.unbind = function(next) {
// there is nothing to do for 'unbind' with redisCache
// }
