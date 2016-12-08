'use strict';

const _ = require('lodash');
const debug = require('debug')('eventsd-client');
const client = require('socket.io-client');
const EventEmitter = require('events').EventEmitter;

const defaultOptions = {
  host: '127.0.0.1',
  port: 8151,
  keys: [],
  ssl: {
    enable: false
  }
};

class Client extends EventEmitter {
  constructor(options) {
    super();

    this._socket = null;
    this.options = {};

    if (!_.isPlainObject(options)) {
      options = {};
    }

    _.merge(this.options, defaultOptions, options);
  }

  getUrl() {
    return `ws${(this.options.ssl.enable ? 's' : '')}://${this.options.host}:${this.options.port}`;
  }

  start() {
    debug('Starting EventsD client');
    this._connect();
  }

  stop(callback) {
    if (!_.isFunction(callback)) {
      callback = _.noop;
    }

    debug('Stopping Eventsd client');

    if (!this._socket) {
      callback();
      return;
    }

    try {
      this._unbindRoutingKeys(this.options.keys);
      this._socket.close();
      callback();
    } catch (err) {
      debug(err.stack || err.message || err);
    }
  }

  addKey(key) {
    if (!_.isString(key) && !_.isPlainObject(key) && !_.isString(key.routingKey)) {
      return;
    }

    this.options.keys.push(key);

    if (!this._socket) {
      return;
    }

    this._bindRoutingKeys(key);
  }

  removeKey(key) {
    if (!_.isString(key) && !_.isPlainObject(key) && !_.isString(key.routingKey)) {
      return;
    }

    let index = -1;

    if (_.isPlainObject(key)) {
      index = _.findIndex(this.options.keys, key);
    } else {
      index = this.options.keys.indexOf(key);
    }

    if (index < 0) {
      return;
    }

    this.options.keys.splice(index, 1);

    if (!this._socket) {
      return;
    }

    this._unbindRoutingKeys(key);
  }

  _connect() {
    let url = this.getUrl();

    debug('Connecting to ' + url);

    this._socket = client(url, {rememberUpgrade: true, transports: ['websocket']});

    this._socket.on('connect', function () {
      debug('Connected');
      this.emit('connected');
      this._bindRoutingKeys(this.options.keys);
    }.bind(this));

    this._socket.on('reconnect_attempt', () => {
      debug('Reconnecting...');
      this.emit('reconnecting');
    });

    this._socket.on('event', this._handleEvent.bind(this));

    this._socket.on('disconnect', () => {
      debug('Connection closed');
      this.emit('disconnect');
    });

    this._socket.on('error', this._handleError.bind(this));
  }

  _handleEvent(event) {
    this.emit('event', event);
  }

  _handleError(err) {
    debug(err.stack || err.message || err);
    this._socket = null;
    this._connect();
  }

  _bindRoutingKeys(keys) {
    if (!_.isArray(keys)) {
      keys = [keys];
    }

    _.each(keys, function (key) {
      var data = {};

      if (_.isPlainObject(key)) {
        data = _.merge({}, key);
      } else if (_.isString(key)) {
        data.routingKey = key;
      }

      if (!_.isString(data.routingKey)) {
        return;
      }

      debug('Binding to: ' + data.routingKey);

      this._sendEventToSocket('consume', data);
    }.bind(this));
  }

  _unbindRoutingKeys(keys) {
    if (!_.isArray(keys)) {
      keys = [keys];
    }

    _.each(keys, function (key) {
      var data = {};

      if (_.isPlainObject(key)) {
        data = _.merge({}, key);
      } else if (_.isString(key)) {
        data.routingKey = key;
      }

      if (!_.isString(data.routingKey)) {
        return;
      }

      debug('Unbinding from: ' + key);

      this._sendEventToSocket('stop', data);
    }.bind(this));
  }

  _sendEventToSocket(event, data) {
    if (!this._socket) {
      return;
    }

    this._socket.emit(event, data);
  }
}

module.exports = Client;