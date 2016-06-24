'use strict';

var OBJECT_STORE_DATA = 'syncdb-data';

function IDBDriver(dbName) {
    if (typeof dbName !== 'string')
        throw new TypeError('dbName argument must be a string');

    this._db = null;
    this._name = dbName;

    this._doInit();
}

IDBDriver.prototype._doInit = function () {
    var self = this;
    this._init = new Promise(function (resolve, reject) {
        var openRequest = indexedDB.open(self._name, 1);
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
    return this._init.then(function () {
        return new Promise(function (resolve, reject) {
            var transaction = self._db.transaction([OBJECT_STORE_DATA], 'readwrite');
            var objectStore = transaction.objectStore(OBJECT_STORE_DATA);
            var request = objectStore.put(obj);
            request.onsuccess = function() {
                resolve();
            };
            request.onerror = function(e) {
                reject(e);
            }
        });
    });
};

IDBDriver.prototype.remove = function (id) {
    var self = this;
    return this._init.then(function () {
        return new Promise(function (resolve, reject) {
            var transaction = self._db.transaction([OBJECT_STORE_DATA], 'readwrite');
            transaction.onerror = function () {
                reject(transaction.error);
            };
            var objectStore = transaction.objectStore(OBJECT_STORE_DATA);
            var request = objectStore.delete(id);
            request.onsuccess = function () {
                resolve();
            };
        });
    });
};

IDBDriver.prototype.get = function (id) {
    var self = this;
    return this._init.then(function () {
        return new Promise(function (resolve, reject) {
            var transaction = self._db.transaction([OBJECT_STORE_DATA], 'readonly');
            transaction.onerror = function () {
                reject(transaction.error);
            };
            var objectStore = transaction.objectStore(OBJECT_STORE_DATA);
            var request = objectStore.get(id);
            request.onsuccess = function (event) {
                resolve(event.target.result || null);
            };
        });
    });
};

IDBDriver.prototype.getData = function () {
    var self = this;
    return this._init.then(function () {
        return new Promise(function (resolve, reject) {
            var transaction = self._db.transaction([OBJECT_STORE_DATA], 'readonly');
            transaction.onerror = function(event) {
                reject(transaction.error);
            };
            var objectStore = transaction.objectStore(OBJECT_STORE_DATA);
            if ('getAll' in objectStore) {
                var results = [];
                var getAll = function getAll(key) {
                    var request = objectStore.getAll(key, 10000);
                    request.onsuccess = function() {
                        var result = request.result;
                        if (result.length) {
                            results.push(result);
                            getAll(result[result.length - 1].id);
                        } else {
                            resolve([].concat.apply([], results));
                        }
                    };
                    request.onerror = function() {
                        reject(request.error);
                    };
                };
                getAll(null);
            } else {
                var result = [];
                objectStore.openCursor().onsuccess = function (event) {
                    var cursor = event.target.result;
                    if (cursor) {
                        result.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(result);
                    }
                };
            }
        });
    });
};

IDBDriver.prototype.getLastSeqid = function () {
    var self = this;
    return this._init.then(function () {
        return new Promise(function (resolve, reject) {
            var transaction = self._db.transaction([OBJECT_STORE_DATA], 'readonly');
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
    });
};

IDBDriver.prototype.getRevData = function () {
    // todo optimize, do not get everything from IDB
    return this.getData().then(function (data) {
        return data.filter(function (doc) {
            return doc.revid > 0;
        });
    });
};

IDBDriver.prototype.clearDatabase = function () {
    var self = this;
    return this._init.then(function () {
        self._db.close();
        return new Promise(function (resolve, reject) {
            var request = indexedDB.deleteDatabase(self._name);
            request.onerror = reject;
            request.onsuccess = function () {
                self._doInit();
                resolve();
            };
        });
    });
};

module.exports = IDBDriver;
