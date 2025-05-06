/**
 * Calculates the sum of an array of numbers
 * @param {number[]} numbers - Array of numbers to sum
 * @returns {number} The total sum
 * @throws {Error} If input is not an array or contains non-numeric values
 */
function calculateTotal(numbers) {
  if (!Array.isArray(numbers)) {
    throw new Error('Input must be an array');
  }
  
  if (numbers.some(num => typeof num !== 'number' || isNaN(num))) {
    throw new Error('All values must be valid numbers');
  }
  
  return numbers.reduce((sum, num) => sum + num, 0);
}

module.exports = {
  calculateTotal
};