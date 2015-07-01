'use strict';

var Bacon = require('baconjs');
var _ = require('lodash');
var intercom;
if (require('is-browser')) {
    intercom = require('./intercom');
}

var busCache = {};
exports.bus = function () {
    /*
     * bus('register')
     * bus('register/loginName')
     * bus('register/loginName/value')
     *
     */
    var busName = Array.prototype.slice.call(arguments).join('/');
    var bus;
    if ((bus = busCache[busName])) {
        return bus;
    }
    bus = busCache[busName] = new Bacon.Bus();
    if (busName.indexOf('store/') === 0) {
        var property = bus.toProperty();
        _.each('push end error plug'.split(' '), function (method) {
            property[method] = bus[method].bind(bus);
        });
        bus = property;
    }
    bus.onValue(function (value) {
        bus.currentValue = value;
        if (intercom && value && value.syncAllTab === true && !value.syncedFromOtherTab) {
            intercom.emit(busName, _.assign({}, value, {syncedFromOtherTab: true}));
        }
    });
    if (intercom) {
        intercom.on(busName, function (value) {
            console.log(arguments);
            bus.push(value);
        });
    }
    return bus;
};
exports.action = exports.bus.bind(null, 'action');
exports.async = exports.bus.bind(null, 'async');
exports.store = exports.bus.bind(null, 'store');
