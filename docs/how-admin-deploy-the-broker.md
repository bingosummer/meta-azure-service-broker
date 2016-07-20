# How a Cloud Foundry Admin manages the meta Azure service broker

## Deploy the meta Azure service broker as an application in Cloud Foundry

1. Get the source code from Github.

  ```
  git clone https://github.com/Azure/meta-azure-service-broker
  cd meta-azure-service-broker
  ```

2. Update `config/default.json`.

  1. Create a SQL database.

    You have several options to create a SQL database.

    * [Create an Azure SQL database](https://azure.microsoft.com/en-us/documentation/articles/sql-database-get-started/)
    * Create a SQL server VM on Azure

  2. Create tables in the SQL database.

    1. Use your favorite way to connect to the SQL database.

      For example:

      ```
      sudo npm install -g sql-cli
      mssql --server "<server-name>.database.windows.net" --database <database> --user <username>@<server-name> --pass <pass> --encrypt
      ```

    2. Create tables `instances` and `bindings` according to [schema.sql](../scripts/schema.sql).

  2. Update the configurations.

    Update `config/default.json` with the configurations of the SQL database.

3. Update `manifest.yml` with your credentials.

  * Common Configurations

    ```
    environment: REPLACE-ME
    subscription_id: REPLACE-ME
    tenant_id: REPLACE-ME
    client_id: REPLACE-ME
    client_secret: REPLACE-ME
    ```

    These configurations should be matched:

    * environment

      Two options `AzureCloud` and `AzureChinaCloud` are supported.

      | Service Name | AzureCloud | AzureChinaCloud |
      |:---|:---|:---|
      | DocumentDB Service | yes | yes |
      | Event Hub Service | yes | yes |
      | Redis Cache Service | yes | yes |
      | Service Bus Service | yes | yes |
      | Storage Blob Service | yes | yes |
      | SQL Database Service | yes | yes |

    * subscription_id

      You can list the providers in the subscription, and make sure that the namespace is registered. For example, if you want to enable Service Bus service, `Microsoft.ServiceBus` should be registered.

      ```
      $ azure provider list
      info:    Executing command provider list
      + Getting ARM registered providers
      data:    Namespace                  Registered
      data:    -------------------------  -------------
      data:    Microsoft.Batch            Registered
      data:    Microsoft.Cache            Registered
      data:    Microsoft.Compute          Registered
      data:    Microsoft.DocumentDB       Registered
      data:    Microsoft.EventHub         Registered
      data:    microsoft.insights         Registered
      data:    Microsoft.KeyVault         Registered
      data:    Microsoft.MySql            Registered
      data:    Microsoft.Network          Registering
      data:    Microsoft.ServiceBus       Registered
      data:    Microsoft.Sql              Registered
      data:    Microsoft.Storage          Registered
      data:    Microsoft.ApiManagement    NotRegistered
      data:    Microsoft.Authorization    Registered
      data:    Microsoft.ClassicCompute   NotRegistered
      data:    Microsoft.ClassicNetwork   NotRegistered
      data:    Microsoft.ClassicStorage   NotRegistered
      data:    Microsoft.Devices          NotRegistered
      data:    Microsoft.Features         Registered
      data:    Microsoft.HDInsight        NotRegistered
      data:    Microsoft.Resources        Registered
      data:    Microsoft.Scheduler        Registered
      data:    Microsoft.ServiceFabric    NotRegistered
      data:    Microsoft.StreamAnalytics  NotRegistered
      data:    Microsoft.Web              NotRegistered
      info:    provider list command OK
      ```

    * A [service principal](https://azure.microsoft.com/en-us/documentation/articles/resource-group-create-service-principal-portal/) is composed of `tenant_id`, `client_id` and `client_secret`.

  * DocumentDB related configurations

    If you want to enable the DocumentDB service, you need to specify the following values. Please ignore them if you do not want to enable the DocumentDB service. Please read [Azure DocumentDB Service](./docs/azure-document-db.md) for more information.

    ```
    docDb_hostEndPoint: REPLACE-ME
    docDb_masterKey: REPLACE-ME
    ```

4. Push the broker to Cloud Foundry

  ```
  cf push
  ```

## Register a service broker

```
cf create-service-broker demo-service-broker $authUser $authPassword <URL of the app meta-azure-service-broker>
```

`$authUser` and `$authPassword` should be same as the ones in `config/default.json`.

## Make the plans public

```
cf enable-service-access $service-name
```

For example:

```
cf enable-service-access azurestorageblob
```

Show the services in the marketplace to verify they are ready.

```
cf marketplace
```

## Unregister a service broker

```
cf delete-service-broker demo-service-broker -f
```

## Debug logging

By default, the debug logging is disabled. If you want to enable the debug logging, please remove `debug` from the `suppress` list in `.logule.json`. Here is the [reference](https://github.com/clux/logule#configuration).

```
"stdout"    : {
  "pad"       : 0,
  "delimiter" : " - ",
  "nesting"   : 3,
  "mutable"   : true,
  "timestamp" : "toLocaleTimeString",
  "suppress"  : ["debug"]
},
```

## More information

[Managing Service Brokers](http://docs.cloudfoundry.org/services/managing-service-brokers.html)
