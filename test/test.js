'use strict';

global.indexedDB = require('fake-indexeddb');

var IDBDriver = require('..');
var should = require('should');

describe('sync-db-idb', function () {

    var idb = new IDBDriver('test');
    beforeEach(function () {
        return idb.clearDatabase();
    });

    it('basic test', function () {

        function getSeq() {
            return idb.getLastSeqid().then(function (id) {
                id.should.equal(9);

                return idb.get(913).then(function (doc) {
                    doc.value.val.should.equal(64);

                    return idb.getRevData().then(function (data) {
                        data.length.should.equal(1);
                        data[0].id.should.equal(245);
                    });
                });
            });
        }

        function insert2() {
            return Promise.all([
                insert({id:123, seqid:2, revid: 0, value:{id: 123, val:15}}),
                insert({id:654, seqid:4, revid: 0, value:{id: 654, val:65}}),
                insert({id:245, seqid:5, revid: 1, value:{id: 245, val:35}}),
                insert({id:156, seqid:7, revid: 0, value:{id: 156, val:16}}),
                insert({id:913, seqid:9, revid: 0, value:{id: 913, val:64}})
            ]);
        }

        return insert2().then(getSeq);
    });

    it('clearDatabase', function () {
        return insert({id:123, seqid:2, revid: 0, value:{id: 123, val:15}})
            .then(checkValue.bind(null, 123, false))
            .then(clearDB)
            .then(checkValue.bind(null, 123, true));
    });

    function insert(data) {
        return idb.insert(data);
    }

    function checkValue(id, notExist) {
        return idb.get(id).then(function (data) {
            if (notExist) {
                should(data).equal(null);
            } else {
                data.id.should.equal(id);
            }
        });
    }

    function clearDB() {
        return idb.clearDatabase();
    }

});
