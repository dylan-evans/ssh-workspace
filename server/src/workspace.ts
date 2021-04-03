
const uuid = require('uuid');

const {createStreamRouter, createResourceRouter, HttpHeaders, Options} = require('./stream_router');

/**
 * A workspace will contain all of the details of an active "session" (not
 * a http/2 session as it may persist and be accessed from different browsers).
 */
export function createWorkspace() {
  return {

  };
}

/** 
 * The workspace controller matches inbound streams to active workspaces.
 */
export function createWorkspaceController() {
  const router = createResourceRouter();
  const workspaces: Map<string, object> = new Map()

  router.on('create', (stream, headers, options) => {
    const newID = uuid.v4();
    workspaces.set(newID, createWorkspace());
    stream.end();
  });

  return {
    router
  };
}


