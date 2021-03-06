/**
 * Web based GI Client
 */
const GiClient = require('gi-sdk-nodejs');

const config = require('./config.js');

//
var tokens = {};
var sessions = {};


//Start the SDK
GiApp = new GiClient(config.gi.name, config.gi.secret, config.gi.host);
GiApp.connect();

GiApp.on('connect', () => {
  console.log('GI: Connected');
});

GiApp.on('disconnect', () => {
  console.log('GI: Disconnected');
});

GiApp.on('identified', () => {
  console.log('GI: Identified');
});

GiApp.on('handshaked', (data) => {
  let token = data.token;
  let session_id = data.session_id
  console.log('Handshaked token', token);
  console.log('Session id', session_id);

  //Move client to live sessions
  sessions[session_id] = tokens[token];
  sessions[session_id].emit('handshake', data);

  //Remove old
  delete tokens[token];
});

GiApp.on('error', (data) => {
  console.log('GI: Error, '+data.message);
});

GiApp.on('message', (data) => {
  console.log('Received data for', data.session_id);
  sessions[data.session_id].emit('response', data);
});

GiApp.on('type_start', (data) => {
  sessions[data.session_id].emit('response', data);
});

GiApp.on('type_end', (data) => {
  sessions[data.session_id].emit('response', data);
});




/**
 * Start listening for web connections
 */
this.object = require('http').createServer();
let io = require('socket.io')(this.object);

try {
  this.object.listen(config.server.port, () => {
    console.log('Listening to port', config.server.port);
  });
}
catch(err) {
  console.log('error', err);
}


/**
 * New web connection
 */
io.on('connection', (client) => {
  console.log('New user connection');

  client.on('handshake', (data) => {
    console.log('Handshake for token', data.token);
    GiApp.handshake(data.token);
    tokens[data.token] = client;
  });

  //User sending data to GI
  client.on('request', (request) => {
    if(!request.type) {
      request.type = 'message';
    }

    GiApp.send(request.session_id, request.type, request.text, request.data);
  });
});
