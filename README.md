# import-map-deployer

[![Build Status](https://travis-ci.com/single-spa/import-map-deployer.svg?branch=master)](https://travis-ci.com/single-spa/import-map-deployer)

The import-map-deployer is a backend service that updates [import map json files](https://github.com/WICG/import-maps#installation). When using
import-map-deployer, a frontend deployment is completed in two steps:

1. Upload a javascript file to a static server or CDN, such as AWS S3, Azure Storage, Digital Ocean Spaces, or similar.
2. Make an HTTP request (e.g. via `curl` or `httpie`) to modify an existing import map to point to the new file.

These two steps are often performed during a CI process, to automate deployments of frontend code.

<img src="https://drive.google.com/uc?id=1tkDltyzV-jpVLT9U5DvRDfslPyiEAB6y" alt="import-map-deployer demo">

## Why does this exist?

The alternative to the import-map-deployer is to pull down the import map file, modify it, and reupload it during your CI process. That alternative has one problem: it doesn't properly handle concurrency. If two deployments occur in separate CI pipelines at the same time, it is possible they pull down the import map at the same time, modify it, and reupload. In that case, there is a race condition where the "last reupload wins," overwriting the deployment that the first reupload did.

When you have a single import map file and multiple services' deployment process modifies that import map, there is a (small) chance for a race condition where two deployments attempt to modify the import map at the same time. This could result in a CI pipeline indicating that it successfully deployed the frontend module, even though the deployment was overwritten with a stale version.

## Explanation video

[![Tutorial video for import map deployer](http://img.youtube.com/vi/QHunH3MFPZs/0.jpg)](https://www.youtube.com/watch?v=QHunH3MFPZs&list=PLLUD8RtHvsAOhtHnyGx57EYXoaNsxGrTU&index=6&t=0s "Deploying Microfrontends Part 1 - Import Map Deployer")

## Security

The import-map-deployer must have read / write access to the CDN / bucket that is storing your production import map. It exposes a web server that allows for modifying the state of your production application. It is password protected with HTTP basic authentication.

### Securing the import-map-deployer

The following security constraints are highly recommended to secure the import-map-deployer

1. The import-map-deployer's web server is only exposed within your VPC.
2. Your CI runners should either be within the VPC or tunnel into it when calling the import-map-deployer.
3. The import-map-deployer has HTTP basic authentication enabled, and only the CI runners know the username and password.
4. You have configured `urlSafeList` with a list of URL prefixes that are trusted in your import map. Any attempts to modify the state of production so that your import map downloads from other URLs will be rejected.

### Secure alternative

If you are not comfortable with running the import-map-deployer at all, you do not have to. Instead, give read/write access to your CI runners for modifying your import map file. Perform all import map modifications the import map inside of your CI process.

If you do this, decide whether you care about the deployment race condition scenario described in the [Why does this exist?](#why-does-this-exist) section. If you are willing to live with that unlikely race condition, see these examples ([1](/examples/ci-for-javascript-repo/gitlab-aws-no-import-map-deployer), [2](/examples/bash-aws-no-import-map-deployer)) for some example CI commands.

Note that several object stores (notably Google Cloud Storage and Azure Storage) allow for optimistic concurrency when uploading files. By correctly sending pre-condition headers on those services, your CI process can correctly fail and/or retry in the event of a race condition. For further reading, see [Azure's docs](https://docs.microsoft.com/en-us/azure/storage/blobs/concurrency-manage?tabs=dotnet#optimistic-concurrency) or [Google Cloud's docs](https://cloud.google.com/storage/docs/request-preconditions) on concurrency.

If you do want to address the deployment race condition without using import-map-deployer, we'd love to hear what you come up with. Consider leaving a PR to these docs that explain what you did!

## Example repository

[This github repository](https://github.com/joeldenning/live-import-map-deployer) shows an example of setting up your own Docker image that can be configured specifically for your organization.

## Related Projects

- [Netlify Plugin for import-map-deployer](https://github.com/single-spa-books/netlify-plugin-importmap-single-spa)
- [docker-import-maps-mfe-server](https://github.com/single-spa/docker-import-maps-mfe-server) (if you need to host in docker rather than a cloud object storage)

## Installation and usage

### Docker

import-map-deployer is available on DockerHub as [`singlespa/import-map-deployer`](https://hub.docker.com/repository/docker/singlespa/import-map-deployer). If you want to run just the single container,
you can run `docker-compose up` from the project root. When running via docker-compose, it will mount a volume in the project root's directory,
expecting a `config.json` file to be present.

[Example Dockerfile](https://github.com/joeldenning/live-import-map-deployer/blob/master/Dockerfile)

```Dockerfile
FROM singlespa/import-map-deployer:<version-tag>

ENV HTTP_USERNAME= HTTP_PASSWORD=

COPY conf.js /www/

CMD ["yarn", "start", "conf.js"]
```

### Node

To run the import-map-deployer in Node, run the following command:
`npx import-map-deployer config.json`

It is available as `import-map-deployer` [on npm](https://npmjs.com/package/import-map-deployer).

The default web server port is `5000`. To run web server with a custom port, se the `PORT` ENV variable.

`$ PORT=8080 npx import-map-deployer config.json`

## Configuration file

The import-map-deployer expects a configuration file to be present so it (1) can password protect deployments, and (2) knows where and how
to download and update the "live" import map.

If no configuration file is present, import-map-deployer defaults to using the filesystem to host the manifest file, which is called `sofe-manifest.json` and created in the current working directory. If username and password are included, http basic auth will be required. If username and password is not provided, no http auth will be needed.

Here are the properties available in the config file:

- `urlSafeList` (optional, but **highly** recommended): An array of strings and/or functions that indicate which URLs are trusted when updating the import map. A string value is treated as a URL prefix - for example `https://unpkg.com/`. A function value is called with a [URL object](https://developer.mozilla.org/en-US/docs/Web/API/URL) and must return a truthy value when the URL is trusted. Any attempt to update the import map to include an untrusted URL will be rejected. If you omit `urlSafeList`, all URLs are considered trusted (not recommended).
- `packagesViaTrailingSlashes` (optional, defaults to true): A boolean that indicates whether to turn off the automatic generation of trailing slash package records on PATCH service requests. For more information and examples visit [standard guideline](https://github.com/WICG/import-maps/#packages-via-trailing-slashes).
- `manifestFormat` (required): A string that is either `"importmap"` or `"sofe"`, which indicates whether the import-map-deployer is
  interacting with an [import map](https://github.com/WICG/import-maps) or a [sofe manifest](https://github.com/CanopyTax/sofe).
- `locations` (required): An object specifying one or more "locations" (or "environments") for which you want the import-map-deployer to control the import map. The special `default`
  location is what will be used when no query parameter `?env=` is provided in calls to the import-map-deployer. If no `default` is provided, the import-map-deployer will create
  a local file called `import-map.json` that will be used as the import map. The keys in the `locations` object are the names of environments, and the values are
  strings that indicate how the import-map-deployer should interact with the import map for that environment. For more information on the possible string values for locations, see the
  [Built-in IO Methods](#built-in-io-methods) section.
- `username` (optional): The username for HTTP auth when calling the import-map-deployer. If username and password are omitted, anyone can update the import map without authenticating. This
  username _is not_ related to authenticating with S3/Digital Ocean/Other, but rather is the username your CI process will use in its HTTP request to the import-map-deployer.
- `password` (optional): The password for HTTP auth when calling the import-map-deployer. If username and password are omitted, anyone can update the import map without authenticating. This
  password _is not_ related to authenticating with S3/Digital Ocean/Other, but rather is the password your CI process will use in its HTTP request to the import-map-deployer.
- `port` (optional): The port to run the import-map-deployer on. Defaults to 5000.
- `region` (optional): The [AWS region](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html) to be used when retrieving and updating the import map.
  This can also be specified via the [AWS_DEFAULT_REGION environment variable](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html), which is the preferred method.
- `s3.putObject` (optional): The s3.putObject is an object that is merged with the default putObject parameters. This can contain and override any of of the valid request options, such as ACL, encoding, SSE, etc. The sdk options can be found [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property).
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
- `cacheControl` (optional): Cache-control header that will be set on the import map file when the import-map-deployer is called. Defaults to `public, must-revalidate, max-age=0`.
- `alphabetical` (optional, defaults to false): A boolean that indicates whether to sort the import-map alphabetically by service/key/name.

### Option 1: json file

The below configuration file will set up the import-map-deployer to do the following:

- Requests to import-map-deployer must use HTTP auth with the provided username and password.
- The import maps are hosted on AWS S3. This is indicated with the `s3://` prefix.
- There are three different import maps being managed by this import-map-deployer: `default`, `prod`, and `test`.

```json
{
  "urlSafeList": ["https://unpkg.com/", "https://my-organization-cdn.com/"],
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
module.exports = {
  // The username that must be provided via HTTP auth when calling the import-map-deployer
  username: "admin",
  // The password that must be provided via HTTP auth when calling the import-map-deployer
  password: "1234",
  // The type of json file that should be updated. Import-maps are two ways of defining URLs for javascript module.
  manifestFormat: "importmap|sofe",
  // Optional, if you are using a built-in "IO Method"
  readManifest: function (env) {
    return new Promise((resolve, reject) => {
      const manifest = ""; //read a string from somewhere
      resolve(manifest); //must resolve a string
    });
  },
  // Optional, if you are using a built-in "IO Method"
  writeManifest: function () {
    return new Promise((resolve, reject) => {
      //write the file....
      resolve(); //you don't have to call resolve with any value
    });
  },
};
```

### Setting Authentication Credentials

Basic auth credentials can be set either in the `config.json` file (see above) or using the following environment variables:

- `IMD_USERNAME`
- `IMD_PASSWORD`

> :information_source: **Both** environment variables must be set for them to take effect.

> :warning: The above environment variables will **override** the username and password from the config file.

## Building image using docker

To build image using default settings

```sh
$ docker build .
# ...
```

To build image with a custom container port in the `PORT` ENV variable

```sh
$ docker build --container-port=8080 .
# ...
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
    "prod": "s3://mycdn.com/import-map.json"
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
    "prod": "spaces://mycdn.com/import-map.json"
  }
}
```

### Minio

Minio also has an s3 compatible API, so you can use a process similar to digital ocean spaces. You would use the import-map-deployer to modify the import map file
by specifying in your config `spaces://` in the `locations` config object.

Instead of an AWS region, you should provide an `s3Endpoint` config value that points to your root domain.

config.json:

```json
{
  "manifestFormat": "importmaps",
  "s3Endpoint": "https://<selfhosted.domain>",
  "locations": {
    "default": "spaces://minio.<selfhosted.domain>/import-map.json"
  }
}
```

### Azure Storage

Note, that you must have environment variables `AZURE_STORAGE_ACCOUNT` and `AZURE_STORAGE_ACCESS_KEY`, or `AZURE_STORAGE_CONNECTION_STRING` defined for authentication.

If you wish to provide custom authentication keys for specific environments you can provide it also via the keys `azureConnectionString`, `azureAccount` or `azureAccessKey`.

**Its not recommended to put authentication keys in code. Always provide them via environment variables.**

config.js:

```js
module.exports = {
  manifestFormat: "importmap",
  locations: {
    prod: {
      azureContainer: "static",
      azureBlob: "importmap.json",
      azureConnectionString: process.env.AZURE_STORAGE_ACCOUNT_PROD, // optional
      azureAccount: process.env.AZURE_STORAGE_ACCOUNT_PROD, // optional
      azureAccessKey: process.env.AZURE_STORAGE_ACCOUNT_PROD, // optional
    },
  },
};
```

### Google Cloud Storage

Note that you must have the `GOOGLE_APPLICATION_CREDENTIALS` environment variable set for authentication.

config.json:

```json
{
  "manifestFormat": "importmap",
  "locations": {
    "prod": "gs://name-of-bucket/importmap.json"
  }
}
```

### File system

If you'd like to store the import map locally on the file system, provide the name of a file in your `locations` instead.

```json
{
  "manifestFormat": "importmap",
  "locations": {
    "prod": "prod-import-map.json"
  }
}
```

## Endpoints

This service exposes the following endpoints

#### GET /health

An endpoint for health checks. It will return an HTTP 200 with a textual response body saying that everything is okay. You may also call `/` as a health check endpoint.

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

Note that the `skip_url_check` query param indicates that the import-map-deployer will update the import map even if it is not able to reach it via a network request.

Example using [HTTPie](https://github.com/jkbrzt/httpie):

```sh
http PATCH :5000/import-map.json\?env=prod < importmap.json

# Don't check whether the URLs in the import map are publicly reachable
http PATCH :5000/import-map.json\?env=prod\&skip_url_check < importmap.json
```

Example using cURL:

```sh
curl -X PATCH localhost:5000/import-map.json\?env=prod --data "@import-map.json" -H "Accept: application/json" -H "Content-Type: application/json"

# Don't check whether the URLs in the import map are publicly reachable
curl -X PATCH localhost:5000/import-map.json\?env=prod\&skip_url_check --data "@import-map.json" -H "Accept: application/json" -H "Content-Type: application/json"
```

#### PATCH /services?env=stage&packageDirLevel=1

You can PATCH services to add or update a service, the following json body is expected:

Note that the `skip_url_check` query param indicates that the import-map-deployer will update the import map even if it is not able to reach it via a network request.

Note that the `packageDirLevel` query param indicates the number of directories to remove when determining the root directory for the package. The default is 1. Note that this option only takes effect if `packagesViaTrailingSlashes` is set to true.

Body:

```json
{
  "service": "my-service",
  "url": "http://example.com/path/to/my-service.js"
}
```

Response:

```json
{
  "imports": {
    "my-service": "http://example.com/path/to/my-service.js",
    "my-service/": "http://example.com/path/to/"
  }
}
```

Example using HTTPie:

```sh
http PATCH :5000/services\?env=stage service=my-service url=http://example.com/my-service.js

# Don't check whether the URL in the request is publicly reachable
http PATCH :5000/services\?env=stage\&skip_url_check service=my-service url=http://example.com/my-service.js
```

Example using cURL:

```sh
curl -d '{ "service":"my-service","url":"http://example.com/my-service.js" }' -X PATCH localhost:5000/services\?env=beta -H "Accept: application/json" -H "Content-Type: application/json"

# Don't check whether the URL in the request is publicly reachable
curl -d '{ "service":"my-service","url":"http://example.com/my-service.js" }' -X PATCH localhost:5000/services\?env=beta\&skip_url_check -H "Accept: application/json" -H "Content-Type: application/json"
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

##### Special Chars

This project uses URI encoding: [encode URI]. If you have any service with special chars like _@_, _/_, etc... you need to use It's corresponding UTF-8 encoding character.

[encode uri]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent

Imagine you have this service name in your _import-map.json_ `@company/my-service`. You have to replace those characters to utf-8 encoded byte: See detailed list [utf8 encode]

[utf8 encode]: http://www.fileformat.info/info/charset/UTF-8/list.htm

```sh
curl -X DELETE localhost:5000/services/%40company%2Fmy-service
```
