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

  it('should add object key while connected', function (done) {
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
        client.addKey({routingKey: 'event.testEvent.#'});
      }, 500);
    });

    client.start();
  });

  it('should remove object key while connected', function (done) {
    let client = new Client({keys: [{routingKey: 'event.testEvent.#'}]});
    let stopSending = false;
    let eventsReceived = 0;

    should.exist(client);

    client.on('event', function (event) {
      stopSending = true;

      eventsReceived++;

      client.removeKey({routingKey: 'event.testEvent.#'});

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

  it('should share event stream', function (done) {
    let client = new Client({keys: [{routingKey: 'event.testEvent.#', id: 'testEvent'}]});
    let client2 = new Client({keys: [{routingKey: 'event.testEvent.#', id: 'testEvent'}]});
    let stopSending = false;
    let eventsReceived = 0;
    let eventsReceived2 = 0;
    let sentCount = 0;

    should.exist(client);

    client.on('event', function (event) {
      stopSending = true;

      eventsReceived++;
    });

    client2.on('event', function (event) {
      stopSending = true;

      eventsReceived2++;
    });

    function sendEvent(noCount) {
      let eventsd = new EventsD();

      if (!noCount) {
        sentCount++;
      }

      eventsd.send('testEvent', 'testing', function (err) {
        if (stopSending) {
          setTimeout(checkDone, 500);
          return;
        }

        setTimeout(sendEvent, 200);
      });
    }

    function checkDone() {
      if (sentCount <= 1) {
        setTimeout(checkDone, 500);
        return;
      }

      sentCount.should.be.greaterThan(0);

      (eventsReceived + eventsReceived2).should.be.equal(sentCount);

      eventsReceived.should.be.greaterThanOrEqual(0);
      eventsReceived.should.be.lessThanOrEqual(sentCount);
      eventsReceived2.should.be.greaterThanOrEqual(0);
      eventsReceived2.should.be.lessThanOrEqual(sentCount);

      client.stop(function () {
        client2.stop(done);
      });
    }

    client.once('connected', function () {
      // send an event
      client2.once('connected', function () {
        sendEvent(true);  // this first event is normally not received (happens before key binding)
      });

      client2.start();
    });

    client.start();
  });

  it('should not share event stream', function (done) {
    let client = new Client({keys: [{routingKey: 'event.testEvent.#'}]});
    let client2 = new Client({keys: [{routingKey: 'event.testEvent.#'}]});
    let stopSending = false;
    let eventsReceived = 0;
    let eventsReceived2 = 0;
    let sentCount = 0;

    should.exist(client);

    client.on('event', function (event) {
      stopSending = true;

      eventsReceived++;
    });

    client2.on('event', function (event) {
      stopSending = true;

      eventsReceived2++;
    });

    function sendEvent(noCount) {
      let eventsd = new EventsD();

      if (!noCount) {
        sentCount++;
      }

      eventsd.send('testEvent', 'testing', function (err) {
        if (stopSending) {
          setTimeout(checkDone, 500);
          return;
        }

        setTimeout(sendEvent, 200);
      });
    }

    function checkDone() {
      if (sentCount <= 1) {
        setTimeout(checkDone, 500);
        return;
      }

      sentCount.should.be.greaterThan(0);

      eventsReceived.should.be.equal(eventsReceived2);
      (eventsReceived + eventsReceived2).should.be.equal(sentCount * 2);

      eventsReceived.should.equal(sentCount);
      eventsReceived2.should.equal(sentCount);

      client.stop(function () {
        client2.stop(done);
      });
    }

    client.once('connected', function () {
      // send an event
      client2.once('connected', function () {
        sendEvent(true);  // this first event is normally not received (happens before key binding)
      });

      client2.start();
    });

    client.start();
  });
});