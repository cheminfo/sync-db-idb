'use strict';

var IDBDriver = require('..');

describe('sync-db-idb', function () {

    it('basic test', function (done) {
        //TODO find a way to access indexedDB API form Node
        var idb = new IDBDriver('test');

        function getSeq() {
            idb.getLastSeq().then(function (id) {
                id.should.equal(9);
                done();
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

        idb.init().then(insert).then(getSeq, done);
    });

});
