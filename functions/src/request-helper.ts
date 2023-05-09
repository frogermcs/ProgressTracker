import * as functions from "firebase-functions";

/**
 * @fileoverview Helper class for handling requests.
 */
export class RequestHelper {
    /**
     * Logs the request details.
     * @param {functions.https.Request} request The request to handle.
     */
    static logRequestDetails(request: functions.https.Request) {
        console.log("Request headers: " + JSON.stringify(request.headers));
        console.log("Request body: " + JSON.stringify(request.body));
    }

    /**
     * Checks if the request is a POST request.
     * @param {functions.https.Request} request The request to handle.
     * @return {boolean} True if the request is a POST request, false otherwise.
     */
    static isPostMethod(request: functions.https.Request) {
        return request.method === "POST";
    }

    /**
     * Respond to request with given status and errors.
     * @param {functions.Response} response
     * @param {number} status
     * @param {unknown} errors
     */
    static respondWithError(response: functions.Response,
        status: number,
        errors: unknown) {
        response
            .set("Content-Type", "application/json")
            .status(status)
            .send({ error: errors });
    }
}
