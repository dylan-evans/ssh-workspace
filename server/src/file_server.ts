
import fs from 'fs'

import {contentType: getContentType} from 'mime-types';


import {StaticStreamRouter, createStreamRouter, HttpMethod, RoutePath, StreamHandler} from './stream_router';

interface FileServer extends StaticStreamRouter {

  serve(path: string);
};

export function createFileServer(directory: string) : FileServer {

  function serve(path: string) {
    return (stream, headers, options) => {
      const ext = path.split(".").pop();
      const fullPath = directory + path;
      stream.respondWithFile(fullPath, {"content-type": getContentType(ext)});
    };
  }

  function serveStreamHandler(path: string): StreamHandler {
    return {
      handler: serve(path),
      options: {},
      path: null
    }
  }

  function selectRoute(method: HttpMethod, path: string): StreamHandler {
    return serveStreamHandler(path);
  }


  return {
    serve,
    selectRoute,
  };

}
