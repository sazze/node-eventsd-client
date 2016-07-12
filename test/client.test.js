'use strict';

const should = require('should');

const EventEmitter = require('events').EventEmitter;
const Client = require('../');
const EventsD = require('eventsd');

const spawn = require('child_process').spawn;

describe('EventsD Client', function () {
  let eventsdProc;

  before(function () {
    eventsdProc = spawn('./node_modules/eventsd-server/bin/eventsd');
  });

  after(function () {
    eventsdProc.kill();
  });

  it('should instanciate', function () {
    should.exist(Client);

    let client = new Client();

    should.exist(client);
    client.should.be.instanceOf(Client);
    client.should.be.instanceOf(EventEmitter);

    should.exist(client.start);
    should.exist(client.stop);

    client.start.should.be.a.function;
    client.stop.should.be.a.function;
  });

  it('should connect to eventsd server', function (done) {
    let client = new Client();

    should.exist(client);

    client.on('connected', function () {
      client.stop(done);
    });

    client.start();
  });

  it('should receive event', function (done){
    let client = new Client({keys: ['#']});
    let stopSending = false;

    should.exist(client);

    client.on('event', function (event) {
      stopSending = true;

      should.exist(event);
      should.exist(event.time);
      should.exist(event.microtime);
      should.exist(event.msg);
      should.exist(event.id);
      should.exist(event.routingKey);

      event.msg.should.eql('testing');
      event.routingKey.should.match(/^event\.testEvent\..+$/);

      client.stop(done);
    });

    function sendEvent() {
      let eventsd = new EventsD();

      eventsd.send('testEvent', 'testing', function (err) {
        if (stopSending) {
          return;
        }

        setTimeout(sendEvent, 200);
      });
    }

    client.once('connected', function () {
      // send an event
      sendEvent();
    });

    client.start();
  });

  it('should add key while connected', function (done) {
    let client = new Client({keys: ['event.notTestEvent.#']});
    let stopSending = false;

    should.exist(client);

    client.on('event', function (event) {
      stopSending = true;

      should.exist(event);
      should.exist(event.time);
      should.exist(event.microtime);
      should.exist(event.msg);
      should.exist(event.id);
      should.exist(event.routingKey);

      event.msg.should.eql('testing');
      event.routingKey.should.match(/^event\.testEvent\..+$/);

      client.stop(done);
    });

    function sendEvent() {
      let eventsd = new EventsD();

      eventsd.send('testEvent', 'testing', function (err) {
        if (stopSending) {
          return;
        }

        setTimeout(sendEvent, 200);
      });
    }

    client.once('connected', function () {
      // send an event
      sendEvent();

      setTimeout(function () {
        client.addKey('event.testEvent.#');
      }, 500);
    });

    client.start();
  });

  it('should remove key while connected', function (done) {
    let client = new Client({keys: ['event.testEvent.#']});
    let stopSending = false;
    let eventsReceived = 0;

    should.exist(client);

    client.on('event', function (event) {
      stopSending = true;

      eventsReceived++;

      client.removeKey('event.testEvent.#');

      if (eventsReceived === 1) {
        setTimeout(function() {
          eventsReceived.should.eql(1);

          client.stop(done);
        }, 1000);
      }

      setTimeout(sendEvent, 250);
    });

    function sendEvent() {
      let eventsd = new EventsD();

      eventsd.send('testEvent', 'testing', function (err) {
        if (stopSending) {
          return;
        }

        setTimeout(sendEvent, 200);
      });
    }

    client.once('connected', function () {
      // send an event
      sendEvent();
    });

    client.start();
  });
});