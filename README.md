# sofe-deplanifester
A manifest deployment service for sofe


# Endpoints

This service exposes the following endpoints

## PATCH /services

You can PATCH services to add or update a service, the following json body is expected: 

    {
        "service": "my-service",
        "url": "example.com/my-service.js"
    }

## DELETE /services/{SERVICE_NAME}

You can remove a service by sending a DELETE with the service name. No request body needs to be sent. Example:

    DELETE /services/my-service


