function toCumulativeThresholds(rates) {
  let cumulative = 0;
  return rates.map((entry) => {
    cumulative += entry.rate;
    return { ...entry, max: cumulative };
  });
}

module.exports = {
  toCumulativeThresholds,
};
