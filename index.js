'use strict';

var Bacon = require('baconjs');
var _ = require('lodash');
var intercom, tabId;
if (require('is-browser')) {
    intercom = require('./intercom');
    tabId = Date.now() + Math.random().toString().substring(1);
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
    bus = new Bacon.Bus();
    if (busName.indexOf('store/') === 0) {
        var property = bus.toProperty();
        _.each('push end error plug'.split(' '), function (method) {
            property[method] = bus[method].bind(bus);
        });
        bus = property;
    } else if (busName.indexOf('async/') === 0) {
        bus.toResolved = toResolvedLatest;
        bus.toResolvedAll = toResolved;
    }
    bus.onValue(function (value) {
        bus.currentValue = value;
        if (intercom && value && value.syncAllTab === true && !value.syncedFromOtherTab) {
            intercom.emit(busName, _.assign({}, value, {syncedFromTab: tabId}));
        }
    });
    if (intercom) {
        intercom.on(busName, function (value) {
            if (value.syncedFromTab !== tabId) {
                delete value.syncedFromTab;
                value.syncedFromOtherTab = true;
                bus.push(value);
            }
        });
    }
    busCache[busName] = bus;
    return bus;
};
function promiseOnly(obj) {
    return obj && typeof obj.then === 'function';
}
function toResolved() {
    return this.filter(promiseOnly).flatMap(Bacon.fromPromise);
}
function toResolvedLatest() {
    return this.filter(promiseOnly).flatMapLatest(Bacon.fromPromise);
}
exports.action = exports.bus.bind(null, 'action');
exports.async = exports.bus.bind(null, 'async');
exports.store = exports.bus.bind(null, 'store');
