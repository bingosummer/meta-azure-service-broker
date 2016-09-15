#!/bin/bash
pushd ..
  zip --exclude=*pcf-tile* -r pcf-tile/resources/meta-azure-service-broker.zip *
popd
if [ "$1" = "-major" ]; then
  tile build major
elif [ "$1" = "-minor" ]; then
  tile build minor
else
  tile build
fi
