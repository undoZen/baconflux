'use strict';

var Bacon = require('baconjs');

var busCache = {};
exports.bus = function () {
    var busName = Array.prototype.slice.call(arguments).join('/');
    var bus;
    if ((bus = busCache[busName])) {
        return bus;
    }
    bus = busCache[busName] = new Bacon.Bus();
    return bus;
};
exports.action = exports.bus.bind(null, 'action');
exports.async = exports.bus.bind(null, 'async');
exports.store = exports.bus.bind(null, 'store');
exports.property = function () {
    var store = exports.store.apply(null, arguments);
    return store._property || (store._property = store.toProperty());
};
