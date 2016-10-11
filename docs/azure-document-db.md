# Azure DocumentDB Service

[Azure DocumentDB](https://azure.microsoft.com/en-us/services/documentdb/) is a NoSQL document database service designed from the ground up to natively support JSON and JavaScript directly inside the database engine.

## Create a DocumentDB account manually

Instructions to create a DocumentDB account using ARM and CLI are [here](https://azure.microsoft.com/documentation/articles/documentdb-automation-resource-manager-cli/).

After the DocumentDB account is created, you need to specify the following values in the manifest of `meta-azure-service-broker`. **NOTE: In future, these values may be deprecated.**

  ```
  DOCDB_HOSTENDPOINT: REPLACE-ME
  DOCDB_MASTERKEY: REPLACE-ME
  ```

## Create an Azure DocumentDB service

1. Get the service name and plans

  ```
  cf marketplace
  ```

  Sample output:

  ```
  service           plans       description
  azure-documentdb  standard*   Azure DocumentDb Service
  ```

  If you can not find the service name, please use the following command to make the plans public.

  ```
  cf enable-service-access azure-documentdb
  ```

2. Create a service instance

  Configuration parameters are supported with the provision request. These parameters are passed in a valid JSON object containing configuration parameters, provided either in-line or in a file.

  ```
  cf create-service azure-documentdb $service_plan $service_instance_name -c $path_to_parameters
  ```

  Supported configuration parameters:

  ```
  {
    "resourceGroup": "<resource-group-name>",  // [Required] Unique. Only allow up to 90 characters
    "docDbName": "<DocumentDB-database-name>", // [Required] Unique. Can contain only lowercase letters, numbers, and the '-' character and must be between 3 and 50 characters.
    "parameters": {
      "location": "<location>"                 // [Required] e.g. eastasia, eastus2, westus, etc. You can use azure cli command 'azure location list' to list all locations.
    }
  }
  ```

  For example:

  ```
  cf create-service azure-documentdb standard mydocdb -c examples/documentdb-example-config.json
  ```

  The contents of `examples/documentdb-example-config.json`:

  ```
  {
    "resourceGroup": "my-resource-group-name",
    "docDbName": "docdbname123",
    "parameters": {
      "location": "westus"
    }
  }
  ```

  **Please remove the comments in the JSON file before you use it.**

3. Check the operation status of creating the service instance

  The creating operation is asynchronous. You can get the operation status after the creating operation.

  ```
  cf service $service_instance_name
  ```

  For example:

  ```
  cf service mydocdb
  ```

[More information](http://docs.cloudfoundry.org/devguide/services/managing-services.html#create).

## Using the services in your application

### Binding

  ```
  cf bind-service $app_name $service_instance_name
  ```

  For example:

  ```
  cf bind-service demoapp mydocdb
  ```

### Format of Credentials

  Verify that the credentials are set as environment variables

  ```
  cf env $app_name
  ```

  The credentials have the following format:
  
  ```
  "credentials": {
    "documentdb_host": "https://YOUR_DOCUMENTDB_NAME.documents.azure.com:443/",
    "documentdb_key": "YOUR_SECRET_KEY_ENDING_IN_==",
    "documentdb_database": "YOUR_DATABASE_NAME",
    "documentdb_resource_id": "dbs/ID_ENDING_IN_==/"
  }
  ```

## Unbinding

  ```
  cf unbind-service $app_name $service_instance_name
  ```

  For example:

  ```
  cf unbind-service demoapp mydocdb
  ```

## Delete the service instance

  ```
  cf delete-service $service_instance_name -f
  ```

  For example:

  ```
  cf delete-service mydocdb -f
  ```
