/**
 * Events module entry point.
 *
 *   const { eventBus, EVENTS } = require('./events');
 */
const eventBus = require('./eventBus');
const EVENTS   = require('./events');

module.exports = { eventBus, EVENTS };
