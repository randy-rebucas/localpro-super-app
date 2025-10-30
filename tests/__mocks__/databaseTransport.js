const Transport = require('winston-transport');

class MockDatabaseTransport extends Transport {
	constructor(opts = {}) {
		super(opts);
	}

	log(info, callback) {
		setImmediate(() => this.emit('logged', info));
		callback();
	}
}

module.exports = MockDatabaseTransport;


