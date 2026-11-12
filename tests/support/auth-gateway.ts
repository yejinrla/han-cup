import { createServer, request } from "node:http";
createServer((incoming, outgoing) => {
  const auth = incoming.url?.startsWith("/auth/v1/");
  const port = auth ? 55435 : 55436;
  const path = (incoming.url ?? "/").replace(
    auth ? "/auth/v1" : "/rest/v1",
    "",
  );
  const proxy = request(
    {
      hostname: "127.0.0.1",
      port,
      path,
      method: incoming.method,
      headers: { ...incoming.headers, host: "127.0.0.1:" + port },
    },
    (res) => {
      outgoing.writeHead(res.statusCode ?? 502, res.headers);
      res.pipe(outgoing);
    },
  );
  proxy.on("error", () => {
    outgoing.writeHead(503);
    outgoing.end();
  });
  incoming.pipe(proxy);
}).listen(55434, "127.0.0.1", () =>
  console.log("Local auth test gateway listening."),
);
