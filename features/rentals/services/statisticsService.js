const rentalsRepo = require('../repositories/rentalsRepository');

const getStatistics = async () => {
  return rentalsRepo.aggregateStatistics();
};

module.exports = {
  getStatistics
};
