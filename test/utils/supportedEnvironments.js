var supportedEnvironment = {
  AzureCloud: {
    location: 'eastus',
    redisCacheEndpointSuffix: '.redis.cache.windows.net',
    sqlServerEndpointSuffix: '.database.windows.net',
    serviceBusEndpointSuffix: '.servicebus.windows.net',
    storageEndpointSuffix: '.core.windows.net'
  },
  AzureUSGovernment: {
    location: 'usgovvirginia',
    redisCacheEndpointSuffix: '.redis.cache.usgovcloudapi.net',
    sqlServerEndpointSuffix: '.database.usgovcloudapi.net',
    serviceBusEndpointSuffix: '.servicebus.usgovcloudapi.net',
    storageEndpointSuffix: '.core.usgovcloudapi.net'
  },
  AzureChinaCloud: {
    location: 'chinaeast',
    redisCacheEndpointSuffix: '.redis.cache.chinacloudapi.cn',
    sqlServerEndpointSuffix: '.database.chinacloudapi.cn',
    serviceBusEndpointSuffix: '.servicebus.chinacloudapi.cn',
    storageEndpointSuffix: '.core.chinacloudapi.cn'
  }
};

module.exports = supportedEnvironment;
