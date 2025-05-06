// Sample program data for Mortgage Match Pro API
module.exports = [
  {
    id: 'maryland-mortgage-program',
    name: 'Maryland Mortgage Program (MMP)',
    description: 'Statewide homebuying assistance program offering low interest rates and downpayment assistance.',
    savings: 'Down payment assistance up to $5,000 or 3% of the purchase price as a zero-interest deferred loan.',
    eligibility: {
      firstTimeBuyer: true,
      creditScore: 640,
      livingInCounty: false,
      workingInCounty: false,
      countyEmployee: false,
      currentlyOwnProperty: false,
      counties: ['any'],
      cities: ['any'],
      incomeLimits: {
        1: 145000,
        2: 145000,
        3: 145000,
        4: 145000,
        5: 145000
      }
    },
    benefits: [
      'Competitive interest rates',
      'Down payment and closing cost assistance',
      'Tax credit available (Maryland HomeCredit)',
      'Potential student debt relief'
    ],
    requirements: [
      'Must be a first-time homebuyer (or not owned in the past 3 years)',
      'Credit score of 640 or higher',
      'Must occupy the home as primary residence',
      'Must meet income and purchase price limits',
      'Must complete homebuyer education'
    ],
    links: [
      {
        title: 'Official Program Website',
        url: 'https://mmp.maryland.gov/Pages/About-CDA.aspx'
      },
      {
        title: 'How to Apply',
        url: 'https://mmp.maryland.gov/Pages/How-to-Apply.aspx'
      }
    ],
    lastUpdated: '2025-05-01'
  },
  {
    id: 'montgomery-hoc',
    name: 'Montgomery County HOC Mortgage Purchase Program',
    description: 'Provides below-market interest rate loans for low and moderate income first-time homebuyers in Montgomery County.',
    savings: 'Below-market interest rates with down payment assistance up to $10,000.',
    eligibility: {
      firstTimeBuyer: true,
      creditScore: 640,
      livingInCounty: false,
      workingInCounty: false,
      countyEmployee: false,
      currentlyOwnProperty: false,
      counties: ['montgomery'],
      cities: ['any'],
      incomeLimits: {
        1: 109500,
        2: 125000,
        3: 140500,
        4: 156000,
        5: 168500
      }
    },
    benefits: [
      'Below-market interest rates',
      'Down payment assistance up to $10,000',
      'Reduced mortgage insurance premiums',
      'Can be combined with other assistance programs'
    ],
    requirements: [
      'Must be a first-time homebuyer',
      'Credit score of 640 or higher',
      'Must complete HUD-approved homebuyer education course',
      'Must occupy the home as primary residence',
      'Property must be in Montgomery County'
    ],
    links: [
      {
        title: 'Montgomery Housing Opportunities Commission',
        url: 'https://www.hocmc.org/homeownership/home-purchase-loans.html'
      }
    ],
    lastUpdated: '2025-04-15'
  },
  {
    id: 'pg-pathway-to-purchase',
    name: "Prince George's County Pathway to Purchase",
    description: "Down payment and closing cost assistance for first-time homebuyers purchasing in Prince George's County.",
    savings: 'Up to $10,000 in down payment assistance as a 0% interest deferred loan.',
    eligibility: {
      firstTimeBuyer: true,
      creditScore: 640,
      livingInCounty: false,
      workingInCounty: false,
      countyEmployee: false,
      currentlyOwnProperty: false,
      counties: ['prince-georges'],
      cities: ['any'],
      incomeLimits: {
        1: 71400,
        2: 81600,
        3: 91800,
        4: 102000,
        5: 110160
      }
    },
    benefits: [
      'Zero-interest deferred loan of up to $10,000',
      'Loan forgiven after 5 years of primary residence',
      'Can be combined with other programs',
      'No monthly payment required'
    ],
    requirements: [
      'Must be a first-time homebuyer',
      'Credit score of 640 or higher',
      'Maximum 45% debt-to-income ratio',
      'Must complete HUD-approved homebuyer education course',
      'Must occupy the home as primary residence',
      'Property must be in Prince George\'s County'
    ],
    links: [
      {
        title: "Prince George's County Department of Housing",
        url: 'https://www.princegeorgescountymd.gov/1014/Pathways-to-Purchase'
      }
    ],
    lastUpdated: '2025-03-20'
  },
  {
    id: 'baltimorecity-buying-into-baltimore',
    name: 'Baltimore City Buying Into Baltimore Program',
    description: 'Provides $5,000 for downpayment and closing costs to homebuyers who purchase a home in Baltimore City.',
    savings: '$5,000 in downpayment and closing cost assistance as a forgivable loan.',
    eligibility: {
      firstTimeBuyer: false,
      creditScore: 640,
      livingInCounty: false,
      workingInCounty: false,
      countyEmployee: false,
      currentlyOwnProperty: false,
      counties: ['baltimore-city'],
      cities: ['baltimore'],
      incomeLimits: {
        1: 150000,
        2: 150000,
        3: 150000,
        4: 150000,
        5: 150000
      }
    },
    benefits: [
      '$5,000 forgivable loan for downpayment and closing costs',
      'Forgiven after 5 years of occupancy',
      'No income limits',
      'Available for homes anywhere in Baltimore City'
    ],
    requirements: [
      'Must attend a Buying Into Baltimore event',
      'Must use an approved lender',
      'Must complete homeownership counseling',
      'Must occupy the home as primary residence for 5 years'
    ],
    links: [
      {
        title: 'Baltimore City Live Baltimore',
        url: 'https://livebaltimore.com/financial-incentives/'
      }
    ],
    lastUpdated: '2025-02-25'
  },
  {
    id: 'howard-settlement-downpayment',
    name: 'Howard County Settlement Downpayment Loan Program',
    description: 'Provides loans to help low and moderate income first-time homebuyers with downpayment and closing costs in Howard County.',
    savings: 'Up to $15,000 in downpayment and closing cost assistance as a deferred loan.',
    eligibility: {
      firstTimeBuyer: true,
      creditScore: 640,
      livingInCounty: false,
      workingInCounty: false,
      countyEmployee: false,
      currentlyOwnProperty: false,
      counties: ['howard'],
      cities: ['any'],
      incomeLimits: {
        1: 92050,
        2: 105200,
        3: 118350,
        4: 131500,
        5: 142050
      }
    },
    benefits: [
      'Zero-interest deferred loan up to $15,000',
      'No monthly payments required',
      'Repaid only when home is sold, transferred, or refinanced',
      'Can be combined with other assistance programs'
    ],
    requirements: [
      'Must be a first-time homebuyer',
      'Must meet income eligibility requirements',
      'Must contribute at least 3% of purchase price from own funds',
      'Must occupy the home as primary residence',
      'Property must be in Howard County'
    ],
    links: [
      {
        title: 'Howard County Housing',
        url: 'https://www.howardcountymd.gov/housing/homeownership-programs'
      }
    ],
    lastUpdated: '2025-04-05'
  },
  {
    id: 'frederick-homebuyer-assistance',
    name: 'Frederick County Homebuyer Assistance Program',
    description: 'Provides downpayment and closing cost assistance to first-time homebuyers in Frederick County.',
    savings: 'Up to $8,000 in downpayment and closing cost assistance as a deferred payment loan.',
    eligibility: {
      firstTimeBuyer: true,
      creditScore: 640,
      livingInCounty: false,
      workingInCounty: false,
      countyEmployee: false,
      currentlyOwnProperty: false,
      counties: ['frederick'],
      cities: ['any'],
      incomeLimits: {
        1: 73500,
        2: 84000,
        3: 94500,
        4: 105000,
        5: 113400
      }
    },
    benefits: [
      'Deferred payment loan up to $8,000',
      'Zero percent interest',
      'No monthly payments',
      'Loan is due upon sale, transfer, or when home is no longer primary residence'
    ],
    requirements: [
      'Must be a first-time homebuyer',
      'Must meet income eligibility requirements',
      'Must contribute at least $1,000 of own funds',
      'Must complete HUD-certified homebuyer education',
      'Property must be in Frederick County'
    ],
    links: [
      {
        title: 'Frederick County Housing',
        url: 'https://www.frederickcountymd.gov/7426/Homebuyer-Programs'
      }
    ],
    lastUpdated: '2025-03-15'
  }
];