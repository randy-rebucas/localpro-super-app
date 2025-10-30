const makeFn = () => jest.fn();

const logger = {
	info: makeFn(),
	warn: makeFn(),
	error: makeFn(),
	debug: makeFn(),
	http: makeFn(),
	stream: { write: makeFn() },
	logRequest: makeFn(),
};

module.exports = logger;


