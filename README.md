# import-map-deployer
The import-map-deployer is a backend service that updates [import map json files](https://github.com/WICG/import-maps#installation). When using
import-map-deployer, a frontend deployment is completed in two steps:

1. Upload a javascript file to a static server or CDN, such as AWS S3, Azure Storage, Digital Ocean Spaces, or similar.
2. Make an HTTP request (e.g. via `curl` or `httpie`) to modify an existing import map to point to the new file.

These two steps are often performed during a CI process, to automate deployments of frontend code.

<img src="https://drive.google.com/uc?id=1tkDltyzV-jpVLT9U5DvRDfslPyiEAB6y" alt="import-map-deployer demo">

## Installation and usage
#### Docker
import-map-deployer is available on DockerHub as canopytax/import-map-deployer. If you want to run just the single container,
you can run `docker-compose up` from the project root. When running via docker-compose, it will mount a volume in the project root's directory,
expecting a `config.json` file to be present.

#### Node
To run the import-map-deployer in Node, run the following command:
`npx import-map-deployer config.json`

## Configuration file
The import-map-deployer expects a configuration file to be present so it (1) can password protect deployments, and (2) knows where and how
to download and update the "live" import map.

If no configuration file is present, import-map-deployer defaults to using the filesystem to host the manifest file, which is called `sofe-manifest.json` and created in the current working directory. If username and password are included, http basic auth will be required. If username and password is not provided, no http auth will be needed.

Here are the properties available in the config file:
- `manifestFormat` (required): A string that is either `"importmap"` or `"sofe"`, which indicates whether the import-map-deployer is
  interacting with an [import map](https://github.com/WICG/import-maps) or a [sofe manifest](https://github.com/CanopyTax/sofe).
- `locations` (required): An object specifying one or more "locations" (or "environments") for which you want the import-map-deployer to control the import map. The special `default`
  location is what will be used when no query parameter `?env=` is provided in calls to the import-map-deployer. If no `default` is provided, the import-map-deployer will create
  a local file called `import-map.json` that will be used as the import map. The keys in the `locations` object are the names of environments, and the values are
  strings that indicate how the import-map-deployer should interact with the import map for that environment. For more information on the possible string values for locations, see the
  [Built-in IO Methods](#built-in-io-methods) section.
- `username` (optional): The username for HTTP auth when calling the import-map-deployer. If username and password are omitted, anyone can update the import map without authenticating. This
  username *is not* related to authenticating with S3/Digital Ocean/Other, but rather is the username your CI process will use in its HTTP request to the import-map-deployer.
- `password` (optional): The password for HTTP auth when calling the import-map-deployer. If username and password are omitted, anyone can update the import map without authenticating. This
  password *is not* related to authenticating with S3/Digital Ocean/Other, but rather is the password your CI process will use in its HTTP request to the import-map-deployer.
- `region` (optional): The [AWS region](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html) to be used when retrieving and updating the import map.
  This can also be specified via the [AWS_DEFAULT_REGION environment variable](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html), which is the preferred method.
- `s3Endpoint` (optional): The url for aws-sdk to call when interacting with S3. Defaults to AWS' default domain, but can be configured for
Digital Ocean Spaces or other S3-compatible APIs.
- `readManifest(env)` (optional): A javascript function that will be called to read the import map. One argument is provided, a string `env` indicating
  which location to read from. This allows you to implement your own way of reading the import map. The function must return
  a Promise that resolves with the import map as a **string**. Since javascript functions are not part of JSON, this option is only available if you provide a config.js file (instead
  of config.json).
- `writeManifest(importMapAsString, env)` (optional): A javascript function that will be called to write the import map. Two arguments are provided, 
  the first being the import map as a string to be written, and the second is the string `env` that should be updated. This allows you to implement your
  own way of writing the import map. The function must return a Promise that resolves with the import map as an object. Since javascript functions are
  not part of JSON, this option is only available if you provide a config.js file (instead of config.json).

### Option 1: json file
The below configuration file will set up the import-map-deployer to do the following:

- Requests to import-map-deployer must use HTTP auth with the provided username and password.
- The import maps are hosted on AWS S3. This is indicated with the `s3://` prefix.
- There are three different import maps being managed by this import-map-deployer: `default`, `prod`, and `test`.

```json
{
  "username": "admin",
  "password": "1234",
  "manifestFormat": "importmap|sofe",
  "locations": {
    "default": "import-map.json",
    "prod": "s3://cdn.canopytax.com/import-map.json",
    "test": "import-map-test.json"
  }
}
```

### Option 2: javascript module
Example config.js
```js
// config.js
exports = {
  // The username that must be provided via HTTP auth when calling the import-map-deployer
  username: "admin",
  // The password that must be provided via HTTP auth when calling the import-map-deployer
  password: "1234",
  // The type of json file that should be updated. Import-maps are two ways of defining URLs for javascript module.
  manifestFormat: "importmap|sofe",
  // Optional, if you are using a built-in "IO Method"
  readManifest: function(env) {
    return new Promise((resolve, reject) => {
      const manifest = ''; //read a string from somewhere
      resolve(manifest); //must resolve a string
    });
  },
  // Optional, if you are using a built-in "IO Method"
  writeManifest: function() {
    return new Promise((resolve, reject) => {
      //write the file....
      resolve(); //you don't have to call resolve with any value
    }
  }
}
```

## Built-in IO Methods
The import-map-deployer knows how to update import maps that are stored in the following ways:

### AWS S3
If your import map json file is hosted by AWS S3, you can use the import-map-deployer to modify the import map file
by specifying in your config `s3://` in the `locations` config object.

The format of the string is `s3://bucket-name/file-name.json`

import-map-deployer relies on the [AWS CLI environment variables](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html) for
authentication with S3.

config.json:
```json
{
  "manifestFormat": "importmap",
  "locations": {
    "prod": "s3://mycdn.com/import-map.json",
  }
}
```

### Digital Ocean Spaces
If your import map json file is hosted by Digital Ocean Spaces, you can use the import-map-deployer to modify the import map file
by specifying in your config `spaces://` in the `locations` config object.

The format of the string is `spaces://bucket-name.digital-ocean-domain-stuff.com/file-name.json`. Note that the name of the Bucket
is everything after `spaces://` and before the first `.` character.

Since the API Digital Ocean Spaces is compatible with the AWS S3 API, import-map-deployer uses `aws-sdk` to communicate with Digital Ocean Spaces. As such,
all options that can be passed for AWS S3 also are applied to Digital Ocean Spaces. You need to provide
[AWS CLI environment variables](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html) for authentication with Digital Ocean Spaces, since
import-map-deployer is using `aws-sdk` to communicate with Digital Ocean.

Instead of an AWS region, you should provide an `s3Endpoint` config value that points to a Digital Ocean region.

config.json:
```json
{
  "manifestFormat": "importmap",
  "s3Endpoint": "https://nyc3.digitaloceanspaces.com",
  "locations": {
    "prod": "spaces://mycdn.com/import-map.json",
  }
}
```

### Azure Storage
Note, that you must have environment variables `AZURE_STORAGE_ACCOUNT` and `AZURE_STORAGE_ACCESS_KEY`, or `AZURE_STORAGE_CONNECTION_STRING` defined for authentication.

config.json:
```json
{
  "manifestFormat": "importmap",
  "locations": {
    "prod": {
      "azureContainer": "static",
      "azureBlob": "import-map.js"
    },
  }
}
```

### File system
If you'd like to store the import map locally on the file system, provide the name of a file in your `locations` instead.

```json
{
  "manifestFormat": "importmap",
  "locations": {
    "prod": "prod-import-map.json",
  }
}
```

## Endpoints

This service exposes the following endpoints

#### GET /environments

You can retrieve the list of environments (locations) a GET request at /environments

Example using [HTTPie](https://github.com/jkbrzt/httpie):

```sh
http :5000/environments
```

Example using cURL:

```sh
curl localhost:5000/environments
```

Response:
```json
{
  "environments": [
    {
      "name": "default",
      "aliases": ["prod"],
      "isDefault": true
    },
    {
      "name": "prod",
      "aliases": ["default"],
      "isDefault": true
    },
    {
      "name": "staging",
      "aliases": [],
      "isDefault": false
    }
  ]
}
```

#### GET /import-map.json?env=prod

You can request the importmap.json file by making a GET request.

Example using [HTTPie](https://github.com/jkbrzt/httpie):

    http :5000/import-map.json\?env=prod

Example using cURL:

    curl localhost:5000/import-map.json\?env=prod

#### PATCH /import-map.json?env=prod

You can modify the import map by making a PATCH request. The import map should be sent in the HTTP request body
and will be merged into the import map controlled by import-map-deployer.

If you have an import map called `importmap.json`, here is how you can merge it into the import map deployer's import map.

Example using [HTTPie](https://github.com/jkbrzt/httpie):

```sh
http PATCH :5000/import-map.json\?env=prod < importmap.json
```

Example using cURL:

```sh
curl -X PATCH localhost:5000/import-map.json\?env=prod --data "@import-map.json" -H "Accept: application/json" -H "Content-Type: application/json"
```

#### PATCH /services?env=stage

You can PATCH services to add or update a service, the following json body is expected:

```json
{
    "service": "my-service",
    "url": "http://example.com/my-service.js"
}
```

Example using HTTPie:

```sh
http PATCH :5000/services\?env=stage service=my-service url=http://example.com/my-service.js
```

Example using cURL:

```sh
curl -d '{ "service":"my-service","url":"http://example.com/my-service.js" }' -X PATCH localhost:5000/services\?env=beta -H "Accept: application/json" -H "Content-Type: application/json"
```

#### DELETE /services/{SERVICE_NAME}?env=alpha

You can remove a service by sending a DELETE with the service name. No request body needs to be sent. Example:

```sh
DELETE /services/my-service
```

Example using HTTPie:

```sh
http DELETE :5000/services/my-service
```

Example using cURL:

```sh
curl -X DELETE localhost:5000/services/my-service
```