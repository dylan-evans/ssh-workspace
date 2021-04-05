
import {createSecureServer} from 'http2';
import fs from 'fs';

import {createStreamRouter} from './stream_router';
import {createFileServer} from './file_server';

const port = process.env.PORT? parseInt(process.env.PORT) : 3333;

const server = createSecureServer({
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
});

const router = createStreamRouter();
const fileServer = createFileServer("../client/build");

router.extend("/static", fileServer);
router.get("/index.html", fileServer.serve("/index.html"));
const fileServer2 = createFileServer("../client/build/static");
router.extend("/static", fileServer2);
console.log(`Listending on port ${port}`);


server.on('stream', router.call);

server.listen(port);
