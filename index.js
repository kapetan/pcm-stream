var stream = require('stream');
var util = require('util');

var HIGH_WATER_MARK = Math.pow(2, 14) * 16;

var PcmStream = function() {
	if(!(this instanceof PcmStream)) return new PcmStream();
	stream.Transform.call(this, { highWaterMark: HIGH_WATER_MARK });

	this._destroyed = false;
	this._buffer = [];
	this._bufferLength = 0;
};

util.inherits(PcmStream, stream.Transform);

PcmStream.prototype.destroy = function(err) {
	if(this._destroyed) return;
	this._destroyed = true;

	if(err) this.emit('error', err);
	this.emit('close');
};

PcmStream.prototype._transform = function(data, encoding, callback) {
	this._pushBuffer(data);

	if(this._bufferLength < 4) {
		return callback();
	}

	data = Buffer.concat(this._buffer, this._bufferLength);
	this._resetBuffer();

	var floatsLength = Math.floor(data.length / 4) * 4;
	var intsLength = floatsLength / 2;
	var intsBuffer = new Buffer(intsLength);

	for(var i = 0; i < floatsLength; i += 4) {
		var f = data.readFloatLE(i);

		f = f * 32768;
		if(f > 32767) f = 32767;
		if(f < -32768) f = -32768;

		var j = Math.floor(f);
		intsBuffer.writeInt16LE(j, i / 2);
	}

	if(data.length > floatsLength) {
		var restBuffer = data.slice(floatsLength);
		this._pushBuffer(restBuffer);
	}

	callback(null, intsBuffer);
};

PcmStream.prototype._flush = function(callback) {
	if(this._bufferLength) callback(new Error('Final stream length must be a multiple of four'));
	else callback();
};

PcmStream.prototype._pushBuffer = function(data) {
	this._buffer.push(data);
	this._bufferLength += data.length;
};

PcmStream.prototype._resetBuffer = function() {
	this._buffer = [];
	this._bufferLength = 0;
};

module.exports = PcmStream;
