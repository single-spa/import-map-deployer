# sofe-deplanifester
A manifest deployment service for [sofe](https://github.com/CanopyTax/sofe). Also can host the manifest file.

## Installation and usage
1. `npm install -g sofe-deplanifester`
2. `sofe-deplanifester conf.js`

## Configuration file
If no configuration file is present, sofe-deplanifester defaults to using the filesystem to host the manifest file, which is called `sofe-manifest.json` and created in the current working directory. If username and password is included, http basic auth will be required. If username and password is not provided, no http auth will be needed.

### Option 1: javascript module
Example conf.js
```js
//conf.js
exports = {
    username: "admin",
    password: "1234",
    readManifest: function() {
        return new Promise((resolve, reject) => {
            const manifest = ''; //read a string from somewhere
            resolve(manifest); //must resolve a string
        });
    },
    
    writeManifest: function() {
        return new Promise((resolve, reject) => {
            //write the file....
            resolve(); //you don't have to call resolve with any value
        }
    }
}
```
### Option 2: json file (more options to come)
Example conf.json
```json
{
  "username":"admin",
  "password":"1234",
  "region": "us-west-2",
  "locations": {
    "default": "sofe-manifest.json",
    "prod": "s3://cdn.canopytax.com/sofe-manifest.json",
    "test": "sofe-manifest2.json"
  }
}
```
The `region` is the s3 endpoint region (not needed if not using s3).

## Endpoints

This service exposes the following endpoints

#### GET /environments

You can retrieve the list of environments (each having its own sofe-manifest.json) by making a GET request at /environments

Example using [HTTPie](https://github.com/jkbrzt/httpie):

    http :5000/environments

Example using cURL:

    curl localhost:5000/environments

Response:
```json
{
  "environments": [
    {
      "name": "default"
    },
    {
      "name": "prod"
    },
    {
      "name": "staging"
    }
  ]
}
```

#### GET /sofe-manifest.json

You can request the sofe-manifest.json file by making a GET request at /sofe-manifest.json

Example using [HTTPie](https://github.com/jkbrzt/httpie):

    http :5000/sofe-manifest.json

Example using cURL:

    curl localhost:5000/sofe-manifest.json

#### PATCH /services

You can PATCH services to add or update a service, the following json body is expected: 

```json
{
    "service": "my-service",
    "url": "http://example.com/my-service.js"
}
```

Example using HTTPie:

    http PATCH :5000/services service=my-service url=http://example.com/my-service.js

Example using cURL:

    curl -d '{ "service":"my-service","url":"http://example.com/my-service.js" }' -X PATCH localhost:5000/services -H "Accept: application/json" -H "Content-Type: application/json"

#### DELETE /services/{SERVICE_NAME}

You can remove a service by sending a DELETE with the service name. No request body needs to be sent. Example:

    DELETE /services/my-service

Example using HTTPie:

    http DELETE :5000/services/my-service

Example using cURL:

    curl -X DELETE localhost:5000/services/my-service


