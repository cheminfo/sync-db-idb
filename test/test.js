'use strict';

global.indexedDB = require('fake-indexeddb');

var IDBDriver = require('..');

describe('sync-db-idb', function () {

    it('basic test', function () {
        var idb = new IDBDriver('test');

        function getSeq() {
            return idb.getLastSeq().then(function (id) {
                id.should.equal(9);

                return idb.get(913).then(function (doc) {
                    doc.value.val.should.equal(64);
                });
            });
        }

        function insert() {
            return Promise.all([
                idb.insert({id:123, seqid:2, value:{id: 123, val:15}}),
                idb.insert({id:654, seqid:4, value:{id: 654, val:65}}),
                idb.insert({id:245, seqid:5, value:{id: 245, val:35}}),
                idb.insert({id:156, seqid:7, value:{id: 156, val:16}}),
                idb.insert({id:913, seqid:9, value:{id: 913, val:64}})
            ]);
        }

        return insert().then(getSeq);
    });

});
