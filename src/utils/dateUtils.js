/**
 * Formats a date in a user-friendly format
 * @param {Date} date - The date to format
 * @returns {string} The formatted date string
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calculate the difference in days between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} The absolute difference in days
 */
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.abs(Math.round((date1 - date2) / oneDay));
  return diffDays;
}

module.exports = {
  formatDate,
  daysBetween
};