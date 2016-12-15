v1.2.0.rc2

This is a release candidate.

* Azure Service Broker
  * Fix a bug that the broker fails to retry if the connection information to the broker database is not correct. [#70](https://github.com/Azure/meta-azure-service-broker/issues/70)
  * Service broker module `azure-sqldb`
    * Support creating databases in an existing server
    * Support multiple firewall rules
    * Remove the parameter `sqlServerCreateIfNotExist`. Current behavior:
      * If the SQL server doesn't exist, the broker will create a new SQL server.
      * If the SQL server exists, the broker will use the existing SQL server.
    * Remove the extra locations in the parameter file because the SQL database must be in the same location with the SQL server
