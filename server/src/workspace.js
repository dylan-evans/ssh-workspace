"use strict";
const uuid = require('uuid');
const { createStreamRouter, HttpHeaders, Options } = require('./stream_router');
/**
 * A workspace will contain all of the details of an active "session" (not
 * a http/2 session as it may persist and be accessed from different browsers).
 */
function createWorkspace() {
    function setupRoute() {
    }
    return {};
}
/**
 * The workspace controller matches inbound streams to active workspaces.
 */
function createWorkspaceController() {
    const router = createStreamRouter();
    router.get("/test", (stream, headers, options) => stream.end("Hello, Test!"));
    router.get("/hello", helloWorld);
    function helloWorld(stream, headers, options) {
        stream.end("Hello, World");
    }
    return {
        router
    };
}
module.exports = { createWorkspace, createWorkspaceController };
