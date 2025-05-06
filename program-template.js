// Template for adding a new county or city-specific program
const newProgram = {
  id: 'unique-program-id',
  name: 'Program Name',
  description: 'Brief description of the program',
  savings: 'Description of financial benefits',
  eligibility: {
    firstTimeBuyer: true, // Whether first-time buyer status is required
    creditScore: 640,     // Minimum credit score (0 if no minimum)
    livingInCounty: false,
    workingInCounty: false,
    countyEmployee: false,
    currentlyOwnProperty: false,
    counties: ['county-name'], // List of eligible counties
    cities: ['city-name'],     // List of eligible cities (if applicable)
    incomeLimits: {
      1: 100000, // Income limits by household size
      2: 120000,
      3: 140000,
      4: 160000,
      5: 180000
    }
  },
  benefits: [
    'Benefit 1',
    'Benefit 2',
    'Benefit 3'
  ],
  requirements: [
    'Requirement 1',
    'Requirement 2',
    'Requirement 3'
  ],
  additionalQuestions: [
    {
      id: 'question-id',
      type: 'radio|select|text',
      question: 'Question text?',
      options: ['Option 1', 'Option 2'] // For radio and select types
    }
  ]
};

// Example of a completed program for Baltimore County
const baltimoreProgram = {
  id: 'baltimore-settlement-expense-loan-program',
  name: 'Baltimore County Settlement Expense Loan Program',
  description: 'Provides interest-free, deferred payment loans to first-time homebuyers to assist with settlement expenses.',
  savings: 'Interest-free, deferred payment loans up to $10,000 for settlement expenses.',
  eligibility: {
    firstTimeBuyer: true,
    creditScore: 640,
    livingInCounty: false,
    workingInCounty: false,
    countyEmployee: false,
    currentlyOwnProperty: false,
    counties: ['baltimore-county'],
    cities: ['any'],
    incomeLimits: {
      1: 89600,
      2: 102400,
      3: 115200,
      4: 128000,
      5: 138240
    }
  },
  benefits: [
    'Interest-free loan',
    'Deferred payment (no monthly payments)',
    'Assistance with down payment and closing costs',
    'Loan is forgiven if you live in the home for 15 years'
  ],
  requirements: [
    'Must be a first-time homebuyer',
    'Property must be in Baltimore County',
    'Must have a minimum credit score of 640',
    'Must complete a homebuyer education program',
    'Must meet income eligibility requirements'
  ]
};

// Adding a program to the programs array
function addProgram(newProgram) {
  // Ensure the program has all required fields
  if (!newProgram.id || !newProgram.name || !newProgram.description || !newProgram.eligibility) {
    console.error('Program is missing required fields.');
    return false;
  }
  
  // Add the program to the array
  programs.push(newProgram);
  console.log(`Program "${newProgram.name}" has been added.`);
  return true;
}

// How to use the template:
// 1. Copy the newProgram template
// 2. Fill in all the fields with your program details
// 3. Call addProgram(yourProgram) to add it to the programs array
// 4. Test the application to ensure your program displays correctly