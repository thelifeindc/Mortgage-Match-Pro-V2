const { formatDate } = require('./utils/dateUtils');
const { calculateTotal } = require('./utils/mathUtils');

function main() {
  const today = new Date();
  console.log(`Today is: ${formatDate(today)}`);
  
  const prices = [10.99, 24.50, 5.75, 16.30];
  const total = calculateTotal(prices);
  console.log(`Total: $${total.toFixed(2)}`);
}

main();