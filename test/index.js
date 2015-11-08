var test = require('tape');
var concat = require('concat-stream');

var pcm = require('../');

var toBuffer = function() {
	var buffer = new Buffer(arguments.length * 4);

	for(var i = 0; i < arguments.length; i++) {
		buffer.writeFloatLE(arguments[i], i * 4);
	}

	return buffer;
};

test('no data', function(t) {
	var stream = pcm();

	stream.pipe(concat({ encoding: 'buffer' }, function(buffer) {
		t.equals(buffer.length, 0);
		t.end();
	}));

	stream.end();
});

test('single write', function(t) {
	var stream = pcm();

	stream.pipe(concat({ encoding: 'buffer' }, function(buffer) {
		t.equals(buffer.length, 2);
		t.equals(buffer.readInt16LE(0), 0.5 * 32768);
		t.end();
	}));

	stream.write(toBuffer(0.5));
	stream.end();
});

test('multiple writes', function(t) {
	var stream = pcm();

	stream.pipe(concat({ encoding: 'buffer' }, function(buffer) {
		t.equals(buffer.length, 6);
		t.equals(buffer.readInt16LE(0), -32768);
		t.equals(buffer.readInt16LE(2), 32767);
		t.equals(buffer.readInt16LE(4), 0);
		t.end();
	}));

	stream.write(toBuffer(-1, 1));
	stream.write(toBuffer(0));
	stream.end();
});

test('fragmented writes', function(t) {
	var stream = pcm();

	stream.pipe(concat({ encoding: 'buffer' }, function(buffer) {
		t.equals(buffer.length, 4);
		t.equals(buffer.readInt16LE(0), -32768);
		t.equals(buffer.readInt16LE(2), 32767);
		t.end();
	}));

	var data = toBuffer(-1, 1);

	stream.write(data.slice(0, 2));
	stream.write(data.slice(2, 5));
	stream.write(data.slice(5));
	stream.end();

});

test('invalid length', function(t) {
	var stream = pcm();

	stream.on('error', function(err) {
		t.ok(err);
		t.end();
	});

	stream.write(new Buffer([0, 0, 0, 0, 0]));
	stream.resume();
	stream.end();

});
