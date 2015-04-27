'use strict';

var OBJECT_STORE_DATA = 'syncdb-data';
var OBJECT_STORE_INFO = 'syncdb-info';

function IDBDriver(dbName) {
    if (typeof dbName !== 'string')
        throw new TypeError('dbName argument must be a string');

    this._db = null;
    this._name = dbName;
}

IDBDriver.prototype.init = function () {
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
            db.createObjectStore(OBJECT_STORE_DATA, {keyPath: 'id'});
            db.createObjectStore(OBJECT_STORE_INFO, {keyPath: 'id'});
        };
    });
};

IDBDriver.prototype.insert = function (obj) {
    var self = this;
    return new Promise(function (resolve, reject) {
        var transaction = self._db.transaction(OBJECT_STORE_DATA, 'readwrite');
        transaction.oncomplete = updateSeqId;
        transaction.onerror = function () {
            reject(transaction.error);
        };
        var objectStore = transaction.objectStore(OBJECT_STORE_DATA);
        objectStore.put(obj.value);

        function updateSeqId() {
            var transaction = self._db.transaction(OBJECT_STORE_INFO, 'readwrite');
            transaction.oncomplete = resolve;
            transaction.onerror = function () {
                reject(transaction.error);
            };
            var objectStore = transaction.objectStore(OBJECT_STORE_INFO);
            objectStore.put({
                id: 'seqid',
                seqid: obj.seqid
            });
        }
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
        var transaction = self._db.transaction(OBJECT_STORE_INFO, 'readonly');
        transaction.onerror = function () {
            reject(transaction.error);
        };
        var objectStore = transaction.objectStore(OBJECT_STORE_INFO);
        var request = objectStore.get('seqid');
        request.onsuccess = function (event) {
            var result = event.target.result;
            resolve(result ? result.seqid : 0);
        };
    });
};

module.exports = IDBDriver;
