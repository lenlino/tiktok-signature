const Signer = require("./index");
const http = require("http");
var url = require('url');
const PORT = process.env.PORT || 8080;
(async function main() {
  try {
    const signer = new Signer();
    const start = new Date();

    const server = http
      .createServer()
      .listen(PORT)
      .on("listening", function () {
        console.log("TikTok Signature server started on PORT " + PORT);
      });

    // Uncomment if you want to auto-exit this application after a period of time
    // If you use PM2 or Supervisord, it will attempt to open it
    // setTimeout(function () {
    //   server.close(() => {
    //     console.log("Server shutdown completed.");
    //     process.exit(1);
    //   });
    // }, 1 * 60 * 60 * 1000);

    signer.init();

    server.on("request", (request, response) => {
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.setHeader("Access-Control-Allow-Headers", "*");
      
      if (request.method === "OPTIONS") {
        response.writeHead(200);
        response.end();
        return;
      }
      var url_parse = url.parse(request.url, true);
      console.log(url_parse.pathname === "/signature");

      if (request.method === "GET" && url_parse.pathname === "/signature") {
        request.on('data', (chunk) => {
          console.log(`BODY: ${chunk}`);
      });
        
        request.on("end", async function () {
          console.log("Received url: " + url_parse.query.url);

          try {
            const sign = await signer.sign(url_parse.query.url);
            const navigator = await signer.navigator();

            let output = JSON.stringify({
              status: "ok",
              data: {
                ...sign,
                navigator: navigator,
              },
            });
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(output);
            console.log(output);
          } catch (err) {
            console.log(err);
            // Uncomment if you want to auto-exit this application when an error thrown
            // If you use PM2 or Supervisord, it will attempt to open it
            // var timeElapsed = new Date() - start;
            // console.info("Execution time: %dms", timeElapsed);
            // if (timeElapsed > 2500) {
            //   process.exit(1);
            // }
          }
        });
      } else {
        response.statusCode = 404;
        response.end();
      }
    });

    await signer.close();
  } catch (err) {
    console.error(err);
  }
})();
