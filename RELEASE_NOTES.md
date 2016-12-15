v1.2.0

* Azure Service Broker

  * Fix a bug in the retry logic of connecting to the broker database. #70

  * Service broker module `azure-sqldb`

    * Support creating databases on an existing server. New behavior:

      * If the SQL server doesn't exist, the broker will create a new SQL server.

      * If the SQL server exists, the broker will use the existing SQL server.

    * The parameter `sqlServerCreateIfNotExist` is no longer needed because of the above change. For existing users, you need to remove it from your parameters when provisioning a service instance. 

    * Support multiple firewall rules. For existing users, you can specify additional parameters. For example:

      From

      ```
      "allowSqlServerFirewallRules": {
          "ruleName": "<rule-name-1>",
          "startIpAddress": "xx.xx.xx.xx",
          "endIpAddress": "xx.xx.xx.xx"
      }
      ```

      to

      ```
      "allowSqlServerFirewallRules": [
          {
              "ruleName": "<rule-name-1>",
              "startIpAddress": "xx.xx.xx.xx",
              "endIpAddress": "xx.xx.xx.xx"
          },
          {
              "ruleName": "<rule-name-2>",
              "startIpAddress": "xx.xx.xx.xx",
              "endIpAddress": "xx.xx.xx.xx"
          }
      ]
      ```

    * Fit and Finish change: Remove the extra locations in the parameter file because the SQL database must be in the same location with the SQL server. If your existing parameter file already contains the extra location, it will be ignore.
