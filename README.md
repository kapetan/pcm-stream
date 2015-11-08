# pcm-stream

A transform stream for converting audio encoded as 32-bit floats to 16-bit intergers.

	npm install pcm-stream

# Usage

```javascript
var pcm = require('pcm-stream');

var stream = pcm();

pcm.on('data', function(data) {
	console.log(data);
});

pcm.write(new Buffer([0, 0, 0, 0]));
pcm.end();
```

Also works in browsers with browserify.
