import { programs } from './programs.js';
import LenderService from './lender-service.js';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const programCache = new Map();

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
    
    try {
        // Get real-time data from lender APIs
        const realTimePrograms = await LenderService.getAllPrograms(criteria);
        
        // Merge with local program data
        const localPrograms = programs.filter(program => {
            return !realTimePrograms.some(rtp => rtp.id === program.id);
        });

        const mergedPrograms = [...realTimePrograms, ...localPrograms];
        
        // Update cache
        programCache.set(cacheKey, {
            data: mergedPrograms,
            timestamp: Date.now()
        });

        return mergedPrograms;
    } catch (error) {
        console.error('Error fetching program data:', error);
        
        // Check cache for stale data before falling back to local data
        if (cachedData) {
            console.log('Using stale cached data');
            return cachedData.data;
        }
        
        // Ultimate fallback to local data
        return programs;
    }
}

/**
 * Filters programs based on user data to determine which ones they may qualify for
 * @param {Object} userData - User's input data
 * @returns {Promise<Array>} - Array of qualifying programs
 */
async function filterQualifyingPrograms(userData) {
    const allPrograms = await fetchProgramData(userData);
    
    return allPrograms.filter((program) => {
        return checkProgramQualification(program, userData);
    });
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

    // Check first time buyer requirement
    if (criteria.firstTimeBuyer && !userData.firstTimeBuyer) {
        return false;
    }

    // Check credit score
    if (criteria.creditScore > 0) {
        if (userData.creditScore === "below-640" && criteria.creditScore >= 640) {
            return false;
        }
        if (userData.creditScore === "640-699" && criteria.creditScore > 640) {
            return false;
        }
    }

    // Check living/working in county
    if (criteria.livingInCounty && !userData.liveInCounty) {
        return false;
    }

    if (criteria.workingInCounty && !userData.workInCounty) {
        return false;
    }

    // Check county employee requirement
    if (criteria.countyEmployee && !userData.countyEmployee) {
        return false;
    }

    // Check property ownership
    if (criteria.currentlyOwnProperty === false && userData.currentlyOwnProperty) {
        return false;
    }

    // Check student debt requirement
    if (criteria.studentDebt && !userData.studentDebt) {
        return false;
    }

    // Check income limits
    const householdSize = Math.min(userData.householdSize, 5); // Cap at 5 for our data structure
    const incomeLimit = criteria.incomeLimits[householdSize];
    if (userData.householdIncome > incomeLimit) {
        return false;
    }

    // Check municipality-specific requirements
    if (criteria.gaithersburg && userData.municipality !== "gaithersburg") {
        return false;
    }

    if (criteria.rockville && userData.municipality !== "rockville") {
        return false;
    }

    // Check additional questions - specific to certain programs
    if (program.id === "mchaf" && userData.howLongStay === "less-than-5") {
        return false;
    }

    if ((program.id === "hoc-dpa" || program.id === "pap") && userData.howLongStay === "less-than-5") {
        return false;
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
    return fetch('/api/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userData,
            selectedPrograms
        })
    }).then(response => response.json());
}

export {
    filterQualifyingPrograms,
    checkProgramQualification,
    fetchProgramData,
    submitUserData
};