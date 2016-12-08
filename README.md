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
        'event.*.env.staging.#',
        {
            routingKey: 'event.*.env.qa.#'
        },
        {
            routingKey: 'event.*.env.dev.#',
            id: 'dev-events'
        }
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

### Add/Remove bound routing keys without reconnecting

```javascript
// 'connect' event already fired

client.addKey('event.test.#');
client.addKey(['event.test1.#', 'event.test2.#']);


client.removeKey('event.test.#');
client.removeKey(['event.test1.#', 'event.test2.#']);
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

**EventsD Server v2.1.0+**

Version 2.1.0+ of the eventsd-server allows clients to share an event stream.

To use this feature, provide the following object as your key (instead of a string):

```javascript
{
    routingKey: 'event.test.#',
    id: 'test-events'
}
```
The important field here is the `id` field.

If an `id` is provided in the `key` object, then all clients with the same `routingKey` and `id` will share the same event stream (this acts like load balancing/distribution).

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