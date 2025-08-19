function toCumulativeThresholds(rates) {
  let cumulative = 0;
  return rates.map((entry) => {
    cumulative += entry.rate;
    return { ...entry, max: cumulative };
  });
}

function formatTimeGMT7(date) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const gmt7Time = new Date(utc + 7 * 60 * 60000);

  const hours = gmt7Time.getHours().toString().padStart(2, "0");
  const minutes = gmt7Time.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

const getRepairCost = (rod) => rod.level * 100;

module.exports = {
  toCumulativeThresholds,
  formatTimeGMT7,
  getRepairCost,
};
