"use strict";
// Simple (not optimal) url router for use with http2.
// Note re typescript: This was a fairly brief module written in javascript,
// hopefully the added complexity and time taken to convert to typescript will
// be justified.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStreamRouter = exports.HttpMethod = void 0;
const events_1 = require("events");
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["PUT"] = "PUT";
    HttpMethod["POST"] = "POST";
    HttpMethod["PATCH"] = "PATCH";
    HttpMethod["HEAD"] = "HEAD";
    HttpMethod["DELETE"] = "DELETE";
    HttpMethod["OPTIONS"] = "OPTIONS";
    HttpMethod["TRACE"] = "TRACE";
    HttpMethod["CONNECT"] = "CONNECT";
})(HttpMethod = exports.HttpMethod || (exports.HttpMethod = {}));
function createStreamRouter(errorHandler = defaultErrorHandler) {
    const routes = makeRoutes();
    // Note that the path to a sub router is string only.
    const subRouters = new Map();
    function call(stream, headers) {
        const { ":method": method, ":path": path } = headers;
        console.log("router call");
        try {
            const { handler, options } = selectRoute(method, path);
            handler(stream, headers, options);
        }
        catch (err) {
            errorHandler(500, "Server Error").handler(stream, headers);
        }
    }
    function selectRoute(method, path) {
        /* Search for subRoute */
        for (const [subPath, subRouter] of subRouters) {
            if (path.startsWith(subPath)) {
                return subRouter.selectRoute(method, path.slice(subPath.length));
            }
        }
        for (const route of routes.get(method)) {
            if (route.path instanceof RegExp) {
                const execResult = route.path.exec(path);
                if (execResult) {
                    const optionsCopy = Object.assign({ execResult }, route.options);
                    return { path: route.path, handler: route.handler, options: optionsCopy };
                }
            }
            else if (path === route.path) {
                return route;
            }
        }
        return errorHandler(404, "Not Found");
    }
    function extend(path, subRouter) {
        subRouters.set(path, subRouter);
    }
    function addRoute(method, path, handler, options = {}) {
        routes.get(method).push({ path, handler, options });
    }
    return Object.assign({
        call,
        extend,
        addRoute,
        selectRoute,
        get: (p, h, o) => addRoute(HttpMethod.GET, p, h, o),
        put: (p, h, o) => addRoute(HttpMethod.PUT, p, h, o),
        post: (p, h, o) => addRoute(HttpMethod.POST, p, h, o),
        patch: (p, h, o) => addRoute(HttpMethod.PATCH, p, h, o),
        head: (p, h, o) => addRoute(HttpMethod.HEAD, p, h, o),
        delete: (p, h, o) => addRoute(HttpMethod.DELETE, p, h, o),
        options: (p, h, o) => addRoute(HttpMethod.OPTIONS, p, h, o),
        trace: (p, h, o) => addRoute(HttpMethod.TRACE, p, h, o),
        connect: (p, h, o) => addRoute(HttpMethod.CONNECT, p, h, o),
    }, new events_1.EventEmitter());
}
exports.createStreamRouter = createStreamRouter;
function makeRoutes() {
    const http_methods = Object.keys(HttpMethod);
    return new Map(http_methods.map((method) => [method, []]));
}
function errorResponse(status, message) {
    return (stream, headers) => {
        stream.respond({
            ":status": status || 500,
            "content-type": "text/plain"
        });
        stream.end(message || "Error");
    };
}
function defaultErrorHandler(status, body, contentType) {
    return {
        path: "",
        options: {},
        handler: (stream, headers, options) => {
            stream.respond({ ":status": status, "content-type": contentType || "text/plain" });
            stream.end(body || (`Status: ${status}`));
        },
    };
}
module.exports = { createStreamRouter };
