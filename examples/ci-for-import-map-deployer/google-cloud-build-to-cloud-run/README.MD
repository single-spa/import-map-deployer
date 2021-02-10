# How it works
Just make a conf and a dockerfile like in this folder.
Initiate a new cloud run instance, choose from repository.
Connect to github and choose your repo with these files.
Watch it build and deploy.

Go to the cloud run instance, add some variables, the variables stated in the conf.js.

Voila, you have a magical import-map-deployer.

# Things you might have to do
* You might have to make sure there is a service account connected to the cloud run which gives permission to the bucket provided.
Then there is no need for GOOGLE_APPLICATION_CREDENTIALS, because it just knows.

* You might have to open cors on the bucket: https://cloud.google.com/storage/docs/configuring-cors

# For the future
Instead of doing it all via the interface, or maybe via gsutil. You do Infrastructure as code.
https://www.pulumi.com/ - https://www.pulumi.com/docs/reference/pkg/gcp/cloudrun/ - https://www.pulumi.com/docs/reference/pkg/gcp/storage/
Or terraform: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/storage_bucket
