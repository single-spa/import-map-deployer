# sofe-deplanifester
A manifest deployment service for sofe


## Endpoints

This service exposes the following endpoints

#### GET /sofe-manifest.json

You can request the sofe-manifest.json file by making a get request at /sofe-manifest.json

Example using [HTTPie](https://github.com/jkbrzt/httpie):

    http :5000/sofe-manifest.json

Example using cURL:

    curl localhost:5000/sofe-manifest.json

#### PATCH /services

You can PATCH services to add or update a service, the following json body is expected: 

    {
        "service": "my-service",
        "url": "http://example.com/my-service.js"
    }

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


