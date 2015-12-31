# sofe-deplanifester
A manifest deployment service for sofe


## Endpoints

This service exposes the following endpoints

#### GET /sofe-manifest.json

You can request the sofe-manifest.json file by making a get request at /sofe-manifest.json

#### PATCH /services

You can PATCH services to add or update a service, the following json body is expected: 

    {
        "service": "my-service",
        "url": "example.com/my-service.js"
    }

#### DELETE /services/{SERVICE_NAME}

You can remove a service by sending a DELETE with the service name. No request body needs to be sent. Example:

    DELETE /services/my-service


