#eventsd-client

EventsD client library for receiving events that are sent to an [EventsD service](https://github.com/sazze/node-eventsd-server).

Clients like [opstail](https://github.com/sazze/opstail) can be built using this client library.

## Install

```bash
npm install --save eventsd-client
```

**Note:** Requires Node.js version `>= 4.2.2`

## Usage

```javascript
const Client = require('eventsd-client');

let options = {
    keys: [
        'event.*.env.production.#',
        'event.*.env.staging.#'
    ]
};

let client = new Client(options);

client.on('event', function (event) {
    // received an event
    // do something with it
    
    console.log(event);
});

client.start();
```

## Client Options

```javascript
// Default Client Options
const defaultOptions = {
  host: '127.0.0.1',
  port: 8151,
  keys: [],
  ssl: {
    enable: false
  }
};
```

- `host`: the hostname/IP address of the EventsD server to connect to
- `port`: the port number that the EventsD server accepts client connections on
- `keys`: an array of event routing key patterns to bind to (this determines which events this client instance will receive)
- `ssl`:
  - `enable`: use SSL to connect to the EventsD server

## Environment Variables

The `DEBUG` environment variable can be used to see verbose logs from the client.

```bash
DEBUG=eventsd-client
```

## Testing

```bash
npm test
```

**NOTE:**

A local RabbitMQ server is REQUIRED to run the tests.