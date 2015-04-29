'use strict';

var OBJECT_STORE_DATA = 'syncdb-data';

function IDBDriver(dbName) {
    if (typeof dbName !== 'string')
        throw new TypeError('dbName argument must be a string');

    this._db = null;
    this._name = dbName;

    this.init = this._init();
}

IDBDriver.prototype._init = function () {
    var self = this;
    return new Promise(function (resolve, reject) {
        var openRequest = window.indexedDB.open(self._name, 1);
        openRequest.onerror = reject;
        openRequest.onsuccess = function () {
            self._db = openRequest.result;
            resolve();
        };
        openRequest.onupgradeneeded = function (event) {
            var db = event.target.result;
            var objectStore = db.createObjectStore(OBJECT_STORE_DATA, {keyPath: 'id'});
            objectStore.createIndex('seqid', 'seqid');
        };
    });
};

IDBDriver.prototype.insert = function (obj) {
    var self = this;
    return new Promise(function (resolve, reject) {
        var transaction = self._db.transaction(OBJECT_STORE_DATA, 'readwrite');
        transaction.oncomplete = resolve;
        transaction.onerror = function () {
            reject(transaction.error);
        };
        var objectStore = transaction.objectStore(OBJECT_STORE_DATA);
        objectStore.put(obj);
    });
};

IDBDriver.prototype.getData = function () {
    var self = this;
    return new Promise(function (resolve, reject) {
        var result = [];
        var transaction = self._db.transaction(OBJECT_STORE_DATA, 'readonly');
        transaction.oncomplete = function () {
            resolve(result);
        };
        transaction.onerror = function () {
            reject(transaction.error);
        };
        var objectStore = transaction.objectStore(OBJECT_STORE_DATA);
        var request = objectStore.openCursor();
        request.onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                result.push(cursor.value);
                cursor.continue();
            }
        };
    });
};

IDBDriver.prototype.getLastSeq = function () {
    var self = this;
    return new Promise(function (resolve, reject) {
        var transaction = self._db.transaction(OBJECT_STORE_DATA, 'readonly');
        transaction.onerror = function () {
            reject(transaction.error);
        };
        var objectStore = transaction.objectStore(OBJECT_STORE_DATA);
        var index = objectStore.index('seqid');
        index.openCursor(null, 'prev').onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                resolve(cursor.value.seqid);
            } else {
                resolve(0);
            }
        };
    });
};

module.exports = IDBDriver;
