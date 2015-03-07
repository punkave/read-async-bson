var assert = require('assert');
var reader = require('../index.js');
var fs = require('fs');
var BSON = require('bson').BSONPure.BSON;

describe('read-async-bson', function() {
  it('create test BSON file', function(done) {
    var out = fs.createWriteStream(__dirname + '/test-good.bson-stream');
    out.on('error', function() {
      assert(false);
    });
    out.on('close', function() {
      return done();
    });
    var i;
    for (i = 0; (i < 100); i++) {
      out.write(BSON.serialize({ ordinal: i }, false, true, false));
    }
    out.end();
  });

  it('create junk file', function() {
    fs.writeFileSync(__dirname + '/test-wtf.bson-stream', 'la la la I have nothing to do with BSON whatsoever');
    assert(true);
  });

  it('create BSON file with trailing garbage', function(done) {
    var out = fs.createWriteStream(__dirname + '/test-iffy.bson-stream');
    out.on('error', function() {
      assert(false);
    });
    out.on('close', function() {
      return done();
    });
    var i;
    for (i = 0; (i < 100); i++) {
      out.write(BSON.serialize({ ordinal: i }, false, true, false));
    }
    out.write('what the heck is this extra nonsense');
    out.end();
    assert(true);
  });

  it('reader exists', function() {
    assert(reader);
  });

  it('can read a BSON stream from a file, receiving documents in order', function(done) {
    return receive('test', { received: 100 }, done);
  });

  it('can read a BSON stream from a file that is much larger than maxDocumentSize (which forces the buffer resize and buffer rotation logic to execute)', function(done) {
    return receive('test', { maxDocumentSize: 100, received: 100 }, done);
  });

  it('can reject a bogus file gracefully', function(done) {
    return receive('test-wtf', { expectError: 'Unexpected data at end of stream', received: 0 }, done);
  });

  it('can report junk data after valid data gracefully', function(done) {
    return receive('test-iffy', { expectError: 'Unexpected data at end of stream', received: 100 }, done);
  });

  function receive(name, options, done) {
    var received = 0;
    var error;
    var stream = fs.createReadStream(__dirname + '/' + name + '.bson-stream');
    assert(stream);
    options.from = stream;
    return reader(options, function(doc, callback) {
      assert(typeof(doc) === 'object');
      assert(typeof(callback) === 'function');
      assert(doc.ordinal === received);
      received++;
      return callback(null);
    }, function(err) {
      if (options.expectError) {
        assert(err);
        assert(err.message == options.expectError);
      } else {
        assert(!err);
      }
      assert(received === options.received);
      return done();
    });
  }
});
