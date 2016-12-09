/* jshint camelcase: false */
/* jshint newcap: false */

var _ = require('underscore');
var async = require('async');
var HttpStatus = require('http-status-codes');
var Config = require('./service');
var util = require('util');
var validCollations = require('./validCollations.json');

var sqldbProvision = function (log, params) {

    var instanceId = params.instance_id;
    var reqParams = params.parameters || {};

    var resourceGroupName = reqParams.resourceGroup || '';
    var sqldbName = reqParams.sqldbName || '';
    var sqlServerName = reqParams.sqlServerName || '';
    var location = reqParams.location || '';
    var sqlServerFQDN;

    log.info(util.format('sqldb cmd-provision: resourceGroupName: %s, sqldbName: %s, sqlServerName: %s', resourceGroupName, sqldbName, sqlServerName));

    var firewallRules = null;

    if (!_.isUndefined(reqParams.sqlServerParameters)) {
        if (!_.isUndefined(reqParams.sqlServerParameters.allowSqlServerFirewallRules)) {
            firewallRules = reqParams.sqlServerParameters.allowSqlServerFirewallRules;
        }
    }

    // this is to minimize the amount of static data 
    // that must be included in the developer's parameters file
    this.fixupParameters = function () {

        // patch up the sqlServerParameters
        if (_.isUndefined(params.parameters.sqlServerParameters)) {
            params.parameters.sqlServerParameters = {};
        }
        if (_.isUndefined(params.parameters.sqlServerParameters.properties)) {
            params.parameters.sqlServerParameters.properties = {};
        }
        if ((params.parameters.sqlServerCreateIfNotExist || false) === false) {
            params.parameters.sqlServerCreateIfNotExist = false;
            params.parameters.sqlServerParameters.properties.administratorLogin = null;
            params.parameters.sqlServerParameters.properties.administratorLoginPassword = null;
        }
        params.parameters.sqlServerParameters.properties.version = '12.0';

        // figure out what plan they selected and fill in some properties
        var planId = params.plan_id;
        log.info('SqlDb/cmd-provision/fixup parameters/planid: %j', planId);
        Config.plans.forEach(function (item) {
            if (planId === item.id) {
                log.info('SqlDb/cmd-provision/fixup parameters/plan name: %j', item.name);
                params.parameters.sqldbParameters.properties.maxSizeBytes = item.metadata.details.maxSizeBytes;
                params.parameters.sqldbParameters.properties.createMode = item.metadata.details.createMode;
                params.parameters.sqldbParameters.properties.edition = item.metadata.details.edition;
                params.parameters.sqldbParameters.properties.requestedServiceObjectiveName = item.metadata.details.requestedServiceObjectiveName;
                //params.parameters.sqldbParameters.properties.requestedServiceObjectiveId = item.metadata.details.requestedServiceObjectiveId;
            }
        });

    };

    this.provision = function (sqldbOperations, resourceGroup, next) {

        var groupParameters = {
            location: location
        };

        async.waterfall([
            function (callback) {
                sqldbOperations.getToken(function (err, accessToken) {
                    if (err) {
                        log.error('sqldb cmd-provision: getToken: err: %j', err);
                        return callback(err);
                    } else {
                        log.info('sqldb cmd-provision: getToken: succeeded');
                        sqldbOperations.setParameters(accessToken, resourceGroupName, sqlServerName, sqldbName);
                        callback(null);
                    }
                });
            },
            function (callback) {
                resourceGroup.checkExistence(resourceGroupName, function (err, checkExistenceResult, req, res) {
                    if (err) {
                        log.error('sqldb cmd-provision: check the existence of the resource group %s, err: %j', resourceGroupName, err);
                        return callback(err);
                    } else {
                        log.info('sqldb cmd-provision: check the existence of the resource group %s: %j', resourceGroupName, checkExistenceResult);
                        callback(null, checkExistenceResult);
                    }
                });
            },
            function (checkExistenceResult, callback) {
                if (checkExistenceResult === false) {
                    resourceGroup.createOrUpdate(resourceGroupName, groupParameters, function (err, createRGResult, req, res) {
                        if (err) {
                            log.error('sqldb cmd-provision: create the resource group %s err: %j', resourceGroupName, err);
                            return callback(err);
                        } else {
                            log.info('sqldb cmd-provision: create the resource group: %s is created', resourceGroupName);
                            callback(null, createRGResult);
                        }
                    });
                } else {
                    callback(null, true);
                }
            },
            function (createRGResult, callback) {  // get sql server status (existence check)
                sqldbOperations.getServer(reqParams, function (err, result) {
                    if (err) {
                        log.error('sqldb cmd-provision: get the sql server: err: %j', err);
                        return callback(err);
                    } else {
                        log.info('sqldb cmd-provision: get the sql server: %j', result);
                        callback(null, result);
                    }
                });
            },
            function (result, callback) {   // create sql server if not exist
                var provisionServerIfNotExist = reqParams.sqlServerCreateIfNotExist || false;
                if (result.statusCode === HttpStatus.NOT_FOUND) {
                    if (provisionServerIfNotExist) {
                        sqldbOperations.createServer(reqParams, function (err, result) {
                            if (err) {
                                log.error('sqldb cmd-provision: create the sql server: err: %j', err);
                                callback(err);
                            } else {    // sql server created, go on to create the database
                                log.info('sqldb cmd-provision: create the sql server: succeeded');
                                sqlServerFQDN = result.body.properties.fullyQualifiedDomainName;
                                callback(null);
                            }
                        });
                    } else {
                        callback(Error('SQL DB Server not found and no directive to create it.'));
                    }
                } else {  // sql server exists, go see if the sql server username and password are valid 
                    log.info('sqldb cmd-provision: create the sql server: ignored because the sql server already exists');
                    sqlServerFQDN = result.body.properties.fullyQualifiedDomainName;
                    callback(null);
                }
            },
            function (callback) {  // open firewall IP if requested
                if (firewallRules !== null) {
                    var n = firewallRules.length;
                    var i = 0;
                    async.whilst(
                        function() {
                            return i < n;
                        },
                        function(cb) {
                            var firewallRuleName = firewallRules[i]['ruleName'];
                            var firewallRuleStartIp = firewallRules[i]['startIpAddress'];
                            var firewallRuleEndIp = firewallRules[i]['endIpAddress'];
                            log.info('sqldb cmd-provision: create the server-level firewall rules, index: %s, rule name: %s, start IP address: %s, end IP address: %s', i, firewallRuleName, firewallRuleStartIp, firewallRuleEndIp);
                            sqldbOperations.createFirewallRule(firewallRuleName, firewallRuleStartIp, firewallRuleEndIp, function (err, result) {
                                if (err) {
                                    log.error('sqldb cmd-provision: create firewall rule: err: %j', err);
                                    return cb(err);
                                } else if ((result.statusCode === HttpStatus.OK) || (result.statusCode === HttpStatus.CREATED)) {
                                    log.info('sqldb cmd-provision: create firewall rule: rule created');
                                    ++i;
                                    cb(null);
                                } else {
                                    log.error('sqldb cmd-provision: create firewall rule, unexpected error: result: %j', result);
                                    return cb(Error(result.body.message));
                                }
                            });
                        },
                        function(err) {
                            callback(err);
                        }
                    );
                } else {
                    callback(null);
                }
            },
            function (callback) {  // validate the sql server username and password
                log.info('sqldb cmd-provision: validate the credentials of the server %s', sqlServerFQDN);

                var administratorLogin = reqParams.sqlServerParameters.properties.administratorLogin;
                var administratorLoginPassword = reqParams.sqlServerParameters.properties.administratorLoginPassword;

                sqldbOperations.validateCredentials(sqlServerFQDN, administratorLogin, administratorLoginPassword, function (err) {
                    if (err) {
                        log.error('sqldb cmd-provision: validate the credentials: err: %j', err);
                        callback(err);
                    } else {
                        log.info('sqldb cmd-provision: validate the credentials: succeeded');

                        callback(null);
                    }
                });
            },
            function (callback) {   // see if db exists (in the case that sql server was there already)
                log.info('sqldb cmd-provision: check existence of database');
                sqldbOperations.getDatabase(function (err, result) {
                    if (err) {
                        log.error('sqldb cmd-provision: check existence of sql database: err: %j', err);
                        callback(err);
                    } else if (result.statusCode === HttpStatus.NOT_FOUND) {
                        callback(null);
                    } else if (result.statusCode === HttpStatus.OK) {
                        var error = Error('The database name is not available.');
                        error.statusCode = HttpStatus.CONFLICT;
                        callback(error);
                    } else {
                        log.error('sqldb cmd-provision: check existence of sql database, unexpected error: result: %j', result);
                        callback(Error('Unexpected error.'));
                    }
                });
            },
            function (callback) {  // create the database
                log.info('sqldb cmd-provision: create the database');
                sqldbOperations.createDatabase(reqParams, function (err, result) {
                    if (err) {
                        log.error('sqldb cmd-provision: create sql database: err: %j', err);
                        callback(err);
                    } else {
                        log.info('sqldb cmd-provision: create sql database: result: %j', result);
                        result.value = {};
                        result.value.state = 'in progress';
                        result.value.description = 'Creating logical database ' + reqParams.sqldbName + ' on logical server ' + reqParams.sqlServerName + '.';
                        callback(null, result);
                    }
                });
            }
        ], function (err, result) {
            if (err) {
                log.info('sqldb cmd-provision: final callback: err: ', err);
            } else {
                log.info('sqldb cmd-provision: final callback: result: ', result);
            }
            next(err, result);
        });
    };

    // validators

    this.firewallRuleIsOk = function () {
        if (!_.isUndefined(reqParams.sqlServerParameters.allowSqlServerFirewallRules)) {
            var rules = reqParams.sqlServerParameters.allowSqlServerFirewallRules;
            if (!(rules instanceof Array)) return false;
            var ruleValidFlag = true;
            rules.forEach(function (rule){
                if (rule.ruleName) {
                    if (rule.ruleName.length === 0) {ruleValidFlag = false; return;}
                } else {ruleValidFlag = false; return;}
                if (_.isString(rule.startIpAddress)) {
                    if (rule.startIpAddress.length === 0) {ruleValidFlag = false; return;}
                    if (rule.startIpAddress.search('^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$') !== 0) {ruleValidFlag = false; return;}
                } else {ruleValidFlag = false; return;}
                if (_.isString(rule.endIpAddress)) {
                    if (rule.endIpAddress.length === 0) {ruleValidFlag = false; return;}
                    if (rule.endIpAddress.search('^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$') !== 0) {ruleValidFlag = false; return;}
                } else {ruleValidFlag = false; return;}
            });
            return ruleValidFlag;
        }
        return true;    // no firewall rule at all, is ok.
    };

    this.resourceGroupWasProvided = function () {
        if (_.isString(resourceGroupName)) {
            if (resourceGroupName.length !== 0) return true;
        }
        log.error('SqlDb Provision: Resource Group name was not provided. Did you supply the parameters file?');
        return false;
    };

    this.sqlServerNameWasProvided = function () {
        if (_.isString(reqParams.sqlServerName)) {
            if (reqParams.sqlServerName.length !== 0) return true;
        }
        log.error('SqlDb Provision: SQL Server name was not provided.');
        return false;
    };

    this.sqlServerParametersWereProvided = function () {
        if ((reqParams.sqlServerCreateIfNotExist || false) === true) {
            if ((reqParams.sqlServerParameters || {}) != {}) {
                if (_.isString(reqParams.sqlServerParameters.properties.administratorLogin)) {
                    if (reqParams.sqlServerParameters.properties.administratorLogin.length === 0) return false;
                } else return false;
                if (_.isString(reqParams.sqlServerParameters.properties.administratorLoginPassword)) {
                    if (reqParams.sqlServerParameters.properties.administratorLoginPassword.length === 0) return false;
                } else return false;
                if (_.isString(reqParams.sqlServerParameters.properties.version)) {
                    if (reqParams.sqlServerParameters.properties.version !== '12.0') return false;
                } else return false;
                return true;
            }
            return false;   // this case means we need sql server parameters but none were provided
        }
        return true;    // in this case, we don't want to create the sql server so lack of parameters is correct.
    };

    this.sqlDbNameWasProvided = function () {
        if (_.isString(reqParams.sqldbName)) {
            if (reqParams.sqldbName.length !== 0) return true;
        }
        log.error('SqlDb Provision: SQL DB name was not provided.');
        return false;
    };

    this.sqlDbCollationWasProvided = function () {
        if (_.isString(reqParams.sqldbParameters.properties.collation)) {
            var collation = reqParams.sqldbParameters.properties.collation;
            if (_.indexOf(validCollations, collation) != -1) return true;
        }
        log.error('SqlDb Provision: SQL DB collation was not provided.');
        return false;
    };

    this.allValidatorsSucceed = function () {
        return this.resourceGroupWasProvided() &&
            this.sqlServerNameWasProvided() &&
            this.sqlDbNameWasProvided() &&
            this.sqlDbCollationWasProvided() &&
            this.sqlServerParametersWereProvided() &&
            this.firewallRuleIsOk();
    };
};

module.exports = sqldbProvision;
