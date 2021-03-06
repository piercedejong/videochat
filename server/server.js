const HTTP_PORT = process.env.PORT || 8443;

const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

// Yes, TLS is required
const serverConfig = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

// ----------------------------------------------------------------------------------------

// Create a server for the client html page
const handleRequest = function(request, response) {
  // Render the single client html file for any request the HTTP server receives
  console.log('request received: ' + request.url);

  fs.readFile('./' + request.url, function(err, data) {
    if (!err) {
        var dotoffset = request.url.lastIndexOf('.');
        var mimetype = dotoffset == -1
                        ? 'text/plain'
                        : {
                            '.html' : 'text/html',
                            '.ico' : 'image/x-icon',
                            '.jpg' : 'image/jpeg',
                            '.jpeg' : 'image/jpeg',
                            '.png' : 'image/png',
                            '.gif' : 'image/gif',
                            '.css' : 'text/css',
                            '.js' : 'text/javascript',
                            '.mp3' : 'audio/mpeg'
                            }[ request.url.substr(dotoffset) ];
        response.setHeader('Content-type' , mimetype);
        response.end(data);
    } else if (request.url === "/") {
         response.writeHead(200, {'Content-Type': 'text/html'});
         response.end(fs.readFileSync('client/index.html'));
    }
     else {
        console.log ('file not found: ' + request.url);
        response.writeHead(404, "Not Found");
        response.end();
    }
});
};

const httpServer = http.createServer(serverConfig, handleRequest);
httpServer.listen(HTTP_PORT, '0.0.0.0');

// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
const wss = new WebSocketServer({server: httpServer});

wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    // Broadcast any received message to all clients
    console.log('received: %s', message);
    wss.broadcast(message);
  });
});

wss.broadcast = function(data) {
  this.clients.forEach(function(client) {
    if(client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

console.log('Server running. Visit https://localhost:' + HTTP_PORT + ' in Firefox/Chrome.\n\n\
Some important notes:\n\
  * Note the HTTPS; there is no HTTP -> HTTPS redirect.\n\
  * You\'ll also need to accept the invalid TLS certificate.\n\
  * Some browsers or OSs may not allow the webcam to be used by multiple pages at once. You may need to use two different browsers or machines.\n'
);
