const suppliesRepo = require('../repositories/suppliesRepository');

const getStatistics = async () => {
  return suppliesRepo.aggregateStatistics();
};

module.exports = {
  getStatistics
};
