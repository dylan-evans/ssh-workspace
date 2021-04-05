
// Simple (not optimal) url router for use with http2.
// Note re typescript: This was a fairly brief module written in javascript,
// hopefully the added complexity and time taken to convert to typescript will
// be justified.

import { ServerHttp2Stream } from 'http2';
import { EventEmitter } from 'events';

export type HttpHeaders = any;
export type Options = any;
export type Handler = (stream: ServerHttp2Stream, headers: HttpHeaders, options?: Options) => void;
export type RoutePath = string | RegExp | null;
export type RouteMap = Map<HttpMethod, StreamHandler[]>;
export type ErrorHandler = (status: number, body?: string, contentType?: string) => StreamHandler;

export enum HttpMethod {
  GET = "GET",
  PUT = "PUT",
  POST = "POST",
  PATCH = "PATCH",
  HEAD = "HEAD",
  DELETE = "DELETE",
  OPTIONS = "OPTIONS",
  TRACE = "TRACE",
  CONNECT = "CONNECT"
}

//type HttpMethod = "GET" | "PUT" | "POST" | "PATCH" | "HEAD" | "DELETE" | "OPTIONS" | "TRACE" | "CONNECT";


/** A handler for a given url pattern. */
export interface StreamHandler {
  path: RoutePath,
  handler: Handler,
  options: Options,
}

/**
 * Sub set of the StreamRouter interface used for custom routers.
 */
export interface StaticStreamRouter {
  /**
   * Search for a handler.
   */
  selectRoute(method: HttpMethod, path: RoutePath): StreamHandler;
}

/** The api for interacting with a StreamRouter. */
export interface StreamRouter extends StaticStreamRouter, EventEmitter {
  /**
   * Call a handler based on the parameters passed from the Http2Server.
   *
   * @param stream Stream passed from Http2Server stream event.
   * @param headers Headers from Http2Server stream event.
   */
   call(stream: ServerHttp2Stream, headers: HttpHeaders);
  /**
   * Add a sub-router to a given path.
   *
   * @param path The url prefix to the sub-router.
   * @param subRouter The implementation to route to.
   */
  extend(path: string, subRouter: StaticStreamRouter);
  addRoute(method: HttpMethod, path: RoutePath, handler: Handler, options?: Options);
  get(path: RoutePath, handler: Handler, options?: Options);
  put(path: RoutePath, handler: Handler, options?: Options);
  post(path: RoutePath, handler: Handler, options?: Options);
  patch(path: RoutePath, handler: Handler, options?: Options);
  head(path: RoutePath, handler: Handler, options?: Options);
  delete(path: RoutePath, handler: Handler, options?: Options);
  options(path: RoutePath, handler: Handler, options?: Options);
  trace(path: RoutePath, handler: Handler, options?: Options);
  connect(path: RoutePath, handler: Handler, options?: Options);
}

export interface ResourceRouter extends StreamRouter {

}

export function createStreamRouter(errorHandler = defaultErrorHandler): StreamRouter {
  const routes = makeRoutes();
  // Note that the path to a sub router is string only.
  const subRouters: Map<string, StaticStreamRouter> = new Map();

  function call(stream, headers) {
    const {":method": method, ":path": path} = headers;
    console.log("router call");

    try {
      const {handler, options} = selectRoute(method, path);
      handler(stream, headers, options);
    } catch(err) {
      errorHandler(500, "Server Error").handler(stream, headers);
    }
  }

  function selectRoute(method: HttpMethod, path: string): StreamHandler {
    /* Search for subRoute */
    for (const [subPath, subRouter] of subRouters) {
      if (path.startsWith(subPath)) {
        return subRouter.selectRoute(method, path.slice(subPath.length))
      }
    }

    for (const route of routes.get(method)) {
      if (route.path instanceof RegExp) {
        const execResult = route.path.exec(path);
        if (execResult) {
          const optionsCopy = Object.assign({execResult}, route.options);
          return {path: route.path, handler: route.handler, options: optionsCopy};
        }
      } else if (path === route.path) {
        return route;
      }
    }
    return errorHandler(404, "Not Found");
  }

  function extend(path: string, subRouter: StaticStreamRouter) {
    subRouters.set(path, subRouter);
  }

  function addRoute(method: HttpMethod, path: RoutePath, handler: Handler, options: Options = {}) {
    routes.get(method).push({path, handler, options});
  }

  return Object.assign({
    call,
    extend,
    addRoute,
    selectRoute,
    get: (p, h, o?) => addRoute(HttpMethod.GET, p, h, o),
    put: (p, h, o?) => addRoute(HttpMethod.PUT, p, h, o),
    post: (p, h, o?) => addRoute(HttpMethod.POST, p, h, o),
    patch: (p, h, o?) => addRoute(HttpMethod.PATCH, p, h, o),
    head: (p, h, o?) => addRoute(HttpMethod.HEAD, p, h, o),
    delete: (p, h, o?) => addRoute(HttpMethod.DELETE, p, h, o),
    options: (p, h, o?) => addRoute(HttpMethod.OPTIONS, p, h, o),
    trace: (p, h, o?) => addRoute(HttpMethod.TRACE, p, h, o),
    connect: (p, h, o?) => addRoute(HttpMethod.CONNECT, p, h, o),
  }, new EventEmitter());
}


/**
 * Create a router with CRUD events.
 */
export function createResourceRouter(errorHandler?: ErrorHandler): StreamRouter {
  const router = createStreamRouter(errorHandler);
  const resPath = RegExp("/([-a-f0-9/]+)");

  router.post("/", (s, h, o) => router.emit("create", s, h, o));
  router.get(resPath, (s, h, o) => router.emit("read", s, h, o));
  router.put(resPath, (s, h, o) => router.emit("update", s, h, o));
  router.patch(resPath, (s, h, o) => router.emit("update", s, h, o));
  router.delete(resPath, (s, h, o) => router.emit("update", s, h, o));

  return router;
}


function makeRoutes(): RouteMap {
  const http_methods = Object.keys(HttpMethod);

  return new Map(http_methods.map((method) => [method as HttpMethod, [] as StreamHandler[]]));
}

function errorResponse(status?, message?) {
  return (stream, headers) => {
    stream.respond({
      ":status": status || 500,
      "content-type": "text/plain"
    });
    stream.end(message || "Error");
  };
}

function defaultErrorHandler(status: number, body?: string, contentType?: string): StreamHandler {
  return {
    path: "",
    options: {},
    handler: (stream, headers, options?) => {
      stream.respond({":status": status, "content-type": contentType || "text/plain"});
      stream.end(body || (`Status: ${status}`));
    },
  };
}

module.exports = {createStreamRouter};
