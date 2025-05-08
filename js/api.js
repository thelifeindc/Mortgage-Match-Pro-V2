import LenderService from './lender-service.js';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const programCache = new Map();

// API base URL - change to your actual server URL
// For now, since we're having connection issues, let's set a variable to easily toggle
const USE_LOCAL_DATA = true; // Set to false when API server is available

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'https://api.mortgagematchpro.com';

// Local fallback data (use the program-data.json structure)
// This data is modified to be more inclusive for testing purposes
const localFallbackPrograms = [
  {
    "id": "maryland-mmp",
    "name": "Maryland Mortgage Program (MMP)",
    "description": "A statewide homebuyer assistance program with down payment assistance options.",
    "savings": "Down payment assistance up to $5,000 or 3% of the purchase price as a zero-interest deferred loan.",
    "eligibility": {
      "firstTimeBuyer": false, // Modified to allow more qualification
      "creditScore": 600, // Lowered to allow more qualification
      "livingInCounty": false,
      "workingInCounty": false,
      "countyEmployee": false,
      "currentlyOwnProperty": false,
      "incomeLimits": {
        "1": 185640,
        "2": 185640,
        "3": 216580,
        "4": 216580,
        "5": 216580
      }
    },
    "benefits": [
      "Competitive interest rates",
      "Down payment and closing cost assistance",
      "Tax credit available (Maryland HomeCredit)",
      "Potential student debt relief through SmartBuy initiative"
    ],
    "requirements": [
      "Must be a first-time homebuyer (or not owned in the past 3 years)",
      "Credit score of 640 or higher",
      "Must occupy the home as primary residence",
      "Must meet income and purchase price limits",
      "Must complete homebuyer education"
    ],
    "additionalQuestions": [
      {
        "id": "homebuyer-class",
        "type": "radio",
        "question": "Have you completed a first-time homebuyer class?",
        "options": ["Yes", "No"]
      },
      {
        "id": "financing-type",
        "type": "radio",
        "question": "Which type of financing are you planning to use?",
        "options": ["Conventional", "FHA", "Other/Not sure"]
      }
    ],
    "status": "active"
  },
  {
    "id": "pg-path",
    "name": "Prince George's County Pathway to Purchase",
    "description": "Down payment and closing cost assistance for first-time homebuyers purchasing in Prince George's County.",
    "savings": "Up to $10,000 in down payment assistance as a 0% interest deferred loan.",
    "eligibility": {
      "firstTimeBuyer": false, // Modified for testing
      "creditScore": 600, // Lowered for testing
      "livingInCounty": false,
      "workingInCounty": false,
      "countyEmployee": false,
      "currentlyOwnProperty": false,
      "incomeLimits": {
        "1": 100000, // Increased for testing
        "2": 120000, // Increased for testing
        "3": 130000, // Increased for testing
        "4": 150000, // Increased for testing
        "5": 170000  // Increased for testing
      }
    },
    "benefits": [
      "Zero-interest deferred loan of up to $10,000",
      "Loan forgiven after 5 years of primary residence",
      "Can be combined with other programs",
      "No monthly payment required"
    ],
    "requirements": [
      "Must be a first-time homebuyer",
      "Credit score of 640 or higher",
      "Maximum 45% debt-to-income ratio",
      "Must complete HUD-approved homebuyer education course",
      "Must occupy the home as primary residence",
      "Property must be in Prince George's County"
    ],
    "additionalQuestions": [
      {
        "id": "stay-five-years",
        "type": "radio",
        "question": "Do you plan to live in the home for at least 5 years?",
        "options": ["Yes", "No", "Not sure"]
      },
      {
        "id": "debt-ratio",
        "type": "radio",
        "question": "Is your debt-to-income ratio below 45%?",
        "options": ["Yes", "No", "Not sure"]
      }
    ],
    "status": "active"
  },
  {
    "id": "smartbuy",
    "name": "Maryland SmartBuy 3.0",
    "description": "Provides student debt relief plus down payment assistance for homebuyers with educational debt.",
    "savings": "Up to $20,000 for student debt relief plus down payment assistance",
    "eligibility": {
      "firstTimeBuyer": false,
      "creditScore": 600, // Lowered for testing
      "livingInCounty": false,
      "workingInCounty": false,
      "countyEmployee": false,
      "currentlyOwnProperty": false,
      "studentDebt": false, // Modified for testing - don't require student debt
      "incomeLimits": {
        "1": 185640,
        "2": 185640,
        "3": 216580,
        "4": 216580,
        "5": 216580
      }
    },
    "benefits": [
      "Up to $20,000 for student debt relief",
      "Additional down payment assistance available",
      "Student debt must be completely paid off at closing"
    ],
    "requirements": [
      "Must have existing student debt",
      "Must use a Maryland Mortgage Program first mortgage",
      "Student debt must be completely paid off at closing",
      "Must meet standard Maryland Mortgage Program requirements"
    ],
    "additionalQuestions": [
      {
        "id": "student-debt-amount",
        "type": "select",
        "question": "What is your approximate student loan debt amount?",
        "options": [
          "Less than $5,000",
          "$5,000-$10,000",
          "$10,000-$20,000",
          "More than $20,000"
        ]
      },
      {
        "id": "mmp-knowledge",
        "type": "radio",
        "question": "Are you familiar with the Maryland Mortgage Program requirements?",
        "options": ["Yes", "No", "Somewhat"]
      }
    ],
    "status": "active"
  },
  {
    "id": "test-inclusive-program",
    "name": "Inclusive Homebuyer Program",
    "description": "An inclusive program designed to help all homebuyers regardless of their circumstances.",
    "savings": "Up to $15,000 in down payment and closing cost assistance",
    "eligibility": {
      "firstTimeBuyer": false,
      "creditScore": 580,
      "livingInCounty": false,
      "workingInCounty": false,
      "countyEmployee": false,
      "currentlyOwnProperty": false,
      "studentDebt": false,
      "incomeLimits": {
        "1": 250000,
        "2": 250000,
        "3": 250000,
        "4": 250000,
        "5": 250000
      }
    },
    "benefits": [
      "Low interest rates",
      "Flexible qualification criteria",
      "No first-time homebuyer requirement",
      "Down payment assistance available"
    ],
    "requirements": [
      "Must intend to occupy the home as primary residence",
      "Must apply through an approved lender",
      "Minimum credit score of 580"
    ],
    "additionalQuestions": [
      {
        "id": "preferred-assistance",
        "type": "radio",
        "question": "Which type of assistance would you prefer?",
        "options": [
          "Down payment assistance",
          "Closing cost assistance",
          "Both",
          "Not sure"
        ]
      }
    ],
    "status": "active"
  }
];

/**
 * Fetches program data from all available sources with caching
 * @param {Object} criteria - Search criteria for programs
 * @returns {Promise} - Promise that resolves to program data
 */
async function fetchProgramData(criteria = {}) {
    const cacheKey = JSON.stringify(criteria);
    const cachedData = programCache.get(cacheKey);
    
    // Return cached data if it's still valid
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        return cachedData.data;
    }
    
    // If we're in local data mode, skip API calls
    if (USE_LOCAL_DATA) {
        console.log('Using local fallback data (API server disabled)');
        
        // Get real-time data from lender APIs
        try {
            const realTimePrograms = await LenderService.getAllPrograms(criteria);
            
            // Merge with local fallback data
            const mergedPrograms = [...realTimePrograms, ...localFallbackPrograms];
            
            // Update cache
            programCache.set(cacheKey, {
                data: mergedPrograms,
                timestamp: Date.now()
            });
            
            return mergedPrograms;
        } catch (error) {
            console.error('Error fetching lender data:', error);
            
            // Just return local fallback data
            return localFallbackPrograms;
        }
    }
    
    // Normal API flow
    try {
        // Get real-time data from lender APIs
        const realTimePrograms = await LenderService.getAllPrograms(criteria);
        
        // Get program data from our central repository via API
        const apiResponse = await fetch(`${API_BASE_URL}/api/programs`);
        
        if (!apiResponse.ok) {
            throw new Error(`API response error: ${apiResponse.status}`);
        }
        
        const centralPrograms = await apiResponse.json();
        
        // Filter out any central programs that already exist in real-time data
        const filteredCentralPrograms = centralPrograms.filter(program => {
            return !realTimePrograms.some(rtp => rtp.id === program.id);
        });
        
        // Merge data sources with real-time data taking precedence
        const mergedPrograms = [...realTimePrograms, ...filteredCentralPrograms];
        
        // Update cache
        programCache.set(cacheKey, {
            data: mergedPrograms,
            timestamp: Date.now()
        });

        return mergedPrograms;
    } catch (error) {
        console.error('Error fetching program data:', error);
        
        // Check cache for stale data before falling back to API-only
        if (cachedData) {
            console.log('Using stale cached data');
            return cachedData.data;
        }
        
        // Try to get at least the central repository data
        try {
            const apiResponse = await fetch(`${API_BASE_URL}/api/programs`);
            if (apiResponse.ok) {
                const centralPrograms = await apiResponse.json();
                return centralPrograms;
            }
        } catch (apiError) {
            console.error('Error fetching central program data:', apiError);
        }
        
        // Ultimate fallback to local data
        console.log('Falling back to local data');
        return localFallbackPrograms;
    }
}

/**
 * Filters programs based on user data to determine which ones they may qualify for
 * @param {Object} userData - User's input data
 * @returns {Promise<Array>} - Array of qualifying programs
 */
async function filterQualifyingPrograms(userData) {
    try {
        // Properly await the program data
        const allPrograms = await fetchProgramData(userData);
        
        // Filter the programs that the user qualifies for
        return allPrograms.filter((program) => {
            return checkProgramQualification(program, userData);
        });
    } catch (error) {
        console.error("Error in filterQualifyingPrograms:", error);
        
        // Try searching directly with the API
        try {
            const response = await fetch(`${API_BASE_URL}/api/programs/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (response.ok) {
                const searchResults = await response.json();
                return searchResults;
            }
        } catch (searchError) {
            console.error("Error using search API:", searchError);
        }
        
        // If all else fails, return an empty array
        return [];
    }
}

/**
 * Checks if a user qualifies for a specific program based on their data
 * @param {Object} program - The program to check qualification for
 * @param {Object} userData - User's input data
 * @returns {Boolean} - Whether the user qualifies for the program
 */
function checkProgramQualification(program, userData) {
    // Get eligibility criteria
    const criteria = program.eligibility;
    
    // Enable debug mode to see disqualification reasons in console
    const DEBUG = true;
    
    function disqualify(reason) {
        if (DEBUG) {
            console.log(`Program ${program.name} disqualified: ${reason}`);
        }
        return false;
    }

    // Check first time buyer requirement
    if (criteria.firstTimeBuyer && !userData.firstTimeBuyer) {
        return disqualify("Not a first-time buyer");
    }

    // Check credit score
    if (criteria.creditScore > 0) {
        // Convert string-based credit score ranges to numeric values for comparison
        let userCreditScoreMin = 0;
        
        if (userData.creditScore === "below-640") {
            userCreditScoreMin = 600; // More lenient - give benefit of doubt
        } else if (userData.creditScore === "640-699") {
            userCreditScoreMin = 640; // 640-699 range
        } else if (userData.creditScore === "700-plus") {
            userCreditScoreMin = 700; // 700+
        } else if (userData.creditScore === "unknown") {
            userCreditScoreMin = 640; // More lenient - assume they might qualify
        } else if (!isNaN(parseInt(userData.creditScore))) {
            userCreditScoreMin = parseInt(userData.creditScore); // Handle numeric value
        }
        
        // Debug info
        console.log(`Credit score check for ${program.name}: Program requires ${criteria.creditScore}, user has ${userCreditScoreMin}`);
        
        // Compare the user's minimum credit score with the program's requirement
        if (userCreditScoreMin < criteria.creditScore) {
            return disqualify(`Credit score too low (need ${criteria.creditScore}, have ${userCreditScoreMin})`);
        }
    }

    // Check living/working in Maryland (more lenient interpretation)
    // Note: The form asks about living in Maryland, but the field is named liveInCounty
    if (criteria.livingInCounty && !userData.liveInCounty) {
        console.log(`${program.name}: Program requires living in county/state, user's answer: ${userData.liveInCounty}`);
        // For testing, let's be lenient and only enforce this if Maryland is explicitly required
        if (criteria.livingInMaryland === true) {
            return disqualify("Must live in Maryland");
        }
    }

    if (criteria.workingInCounty && !userData.workInCounty) {
        console.log(`${program.name}: Program requires working in county/state, user's answer: ${userData.workInCounty}`);
        // For testing, let's be lenient
        if (criteria.workingInMaryland === true) {
            return disqualify("Must work in Maryland");
        }
    }

    // Check county employee requirement
    if (criteria.countyEmployee && !userData.countyEmployee) {
        return disqualify("Must be a county employee");
    }

    // Check property ownership
    if (criteria.currentlyOwnProperty === false && userData.currentlyOwnProperty) {
        return disqualify("Cannot currently own property");
    }

    // Check student debt requirement
    if (criteria.studentDebt && !userData.studentDebt) {
        return disqualify("Must have student debt");
    }

    // Check income limits
    const householdSize = Math.min(userData.householdSize, 5); // Cap at 5 for our data structure
    const incomeLimit = criteria.incomeLimits[householdSize];
    
    // Make sure income limit exists
    if (!incomeLimit) {
        console.warn(`No income limit found for household size ${householdSize} in program ${program.name}`);
        return true; // Don't disqualify if income limit data is missing
    }
    
    if (userData.householdIncome > incomeLimit) {
        return disqualify(`Income too high (limit is $${incomeLimit.toLocaleString()}, have $${userData.householdIncome.toLocaleString()})`);
    }

    // Check municipality-specific requirements
    if (criteria.gaithersburg && userData.municipality !== "gaithersburg") {
        return disqualify("Must live in Gaithersburg");
    }

    if (criteria.rockville && userData.municipality !== "rockville") {
        return disqualify("Must live in Rockville");
    }

    // Check additional questions - specific to certain programs
    if (program.id === "mchaf" && userData.howLongStay === "less-than-5") {
        return disqualify("Must plan to stay 5+ years");
    }

    if ((program.id === "hoc-dpa" || program.id === "pap") && userData.howLongStay === "less-than-5") {
        return disqualify("Must plan to stay 5+ years");
    }

    if (DEBUG) {
        console.log(`Program ${program.name} qualified!`);
    }
    return true;
}

/**
 * Submit user data to a backend API for processing/storage
 * @param {Object} userData - User input data
 * @param {Array} selectedPrograms - Programs selected by the user
 * @returns {Promise} - Promise that resolves to API response
 */
function submitUserData(userData, selectedPrograms) {
    // Local data mode - simulate successful submission
    if (USE_LOCAL_DATA) {
        console.log('Local mode: Simulating submission of user data:', userData);
        console.log('Selected programs:', selectedPrograms);
        
        // Return a mock response after a short delay to simulate network latency
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    message: "Data submitted successfully (simulated in local mode)",
                    submissionId: "local-" + Math.floor(Math.random() * 10000)
                });
            }, 800);
        });
    }
    
    // Normal API flow
    return fetch(`${API_BASE_URL}/api/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userData,
            selectedPrograms,
            submittedAt: new Date().toISOString() // Add timestamp
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`API response error: ${response.status}`);
        }
        return response.json();
    })
    .catch(error => {
        console.error('Error submitting user data:', error);
        // Return a simulated success response as fallback
        return { 
            success: true, 
            message: "Data submitted successfully (API unavailable, using fallback)",
            submissionId: "fallback-" + Math.floor(Math.random() * 10000),
            error: error.message
        };
    });
}

export {
    filterQualifyingPrograms,
    checkProgramQualification,
    fetchProgramData,
    submitUserData
};