// Shared constants

const constants = {
  DEFAULT_PORT: 3000, // TODO move to config
}

module.exports = constants;

// For reference: HTTP status codes
//
// 2xx (Success category) - These status codes represent that the requested action was received
//     and successfully processed by the server.
//
// 200 Ok The standard HTTP response representing success for GET, PUT or POST.
// 201 Created This status code should be returned whenever the new instance is created.
//     e.g on creating a new instance, using POST method, should always return 201 status code.
// 204 No Content represents the request is successfully processed, but has not returned any content.
//     DELETE can be a good example of this.
// The API DELETE /companies/43/employees/2 will delete the employee 2 and in return we do not need any data
// in the response body of the API, as we explicitly asked the system to delete. If there is any error, like
// if employee 2 does not exist in the database, then the response code would be not be of 2xx Success Category
// but around 4xx Client Error category.
//
// 3xx (Redirection Category)
// 304 Not Modified indicates that the client has the response already in its cache.
//     And hence there is no need to transfer the same data again.
//
// 4xx (Client Error Category) - These status codes represent that the client has raised a faulty request.
// 400 Bad Request indicates that the request by the client was not processed,
//     as the server could not understand what the client is asking for.
// 401 Unauthorized indicates that the client is not allowed to access resources,
//     and should re-request with the required credentials.
// 403 Forbidden indicates that the request is valid and the client is authenticated,
//     but the client is not allowed access the page or resource for any reason.errorMessage
//     e.g sometimes the authorized client is not allowed to access the directory on the server.
// 404 Not Found indicates that the requested resource is not available now.
// 410 Gone indicates that the requested resource is no longer available which has been intentionally moved.
