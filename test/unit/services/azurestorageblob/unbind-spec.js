/*
  good instanceId : b259c5e0-7442-46bc-970c-9912613077dd
  test: 
*/

/* jshint camelcase: false */
/* jshint newcap: false */
/* global describe, before, it */

var logule = require('logule');
var should = require('should');
var sinon = require('sinon');
var common = require('../../../../lib/common');
var azureblobstorage = require('../../../../lib/services/azure-blobstorage/');
var storageBlobClient = require('../../../../lib/services/azure-blobstorage/storageblobclient');

var log = logule.init(module, 'StorageBlob-Mocha');

describe('StorageBlob', function() {

  describe('Unbinding', function() {

    before(function() {
      storageBlobClient.init = sinon.stub();
    });

    describe('When no error is thrown', function() {
      var sandbox;
      var validParams = {};

      before(function() {
        validParams = {
          instance_id: 'e77a25d2-f58c-11e5-b933-000d3a80e5f5',
          provisioning_result: '{\"resourceGroupResult\":{\"resourceGroupName\":\"cloud-foundry-e77a25d2-f58c-11e5-b933-000d3a80e5f5\",\"groupParameters\":{\"location\":\"eastus\"}},\"storageAccountResult\":{\"storageAccountName\":\"cfe77a25d2f58c11e5b93300\",\"accountParameters\":{\"location\":\"eastus\",\"accountType\":\"Standard_LRS\"}}}',
          azure: common.getCredentialsAndSubscriptionId(),
        };
        sinon.stub(storageBlobClient, 'unbind').yields(null);
      });

      after(function() {
        storageBlobClient.unbind.restore();
      });

      it('should unbind the service', function(done) {
        azureblobstorage.unbind(log, validParams, function(
          err, reply, result) {
          should.not.exist(err);

          var replyExpected = {
            statusCode: 200,
            code: 'OK',
            value: {}
          };
          reply.should.eql(replyExpected);

          var resultExpected = {};
          result.should.eql(resultExpected);

          done();
        });
      });
    });

  });
});
