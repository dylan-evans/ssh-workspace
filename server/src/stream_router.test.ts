
const stream_router = require('./stream_router');
//const stream_router = './stream_router.ts';

test('createStreamRouter returns a StreamRouter', () => {
  const router = stream_router.createStreamRouter();
  console.log(stream_router.StreamRouter);
  expect(router).toBeTruthy();
  // Note: can't test interfaces as not visible to jest via babel. tsc checks it
  // anyway so the type can be assured.
  //expect(router instanceof stream_router.StreamRouter).toBe(true);
});

test('can add a path to StreamRouter', () => {
  const router = stream_router.createStreamRouter();
  expect(router.get("/foo", (s, h) => {s.end("...")})).toBeUndefined();
  expect(router.call("/foo"))
});

