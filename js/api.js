import { programs } from './programs.js';

/**
 * Filters programs based on user data to determine which ones the user may qualify for
 * @param {Object} userData - User's input data
 * @returns {Array} - Array of qualifying programs
 */
function filterQualifyingPrograms(userData) {
    return programs.filter((program) => {
        // Check credit score requirement
        let creditScoreQualifies = true;
        if (program.eligibility.creditScore > 0) {
            if (userData.creditScore === "below-640") {
                creditScoreQualifies = program.eligibility.creditScore < 640;
            } else if (userData.creditScore === "640-699") {
                creditScoreQualifies = program.eligibility.creditScore <= 640;
            } else if (userData.creditScore === "700-plus") {
                creditScoreQualifies = true; // If user has 700+, they qualify for any credit score requirement
            }
        }

        // Check first-time buyer requirement
        const firstTimeBuyerQualifies = !program.eligibility.firstTimeBuyer || userData.firstTimeBuyer;

        // Check county employee requirement
        const countyEmployeeQualifies = !program.eligibility.countyEmployee || userData.countyEmployee;

        // Check currently owning property
        const propertyOwnershipQualifies = !program.eligibility.currentlyOwnProperty || !userData.currentlyOwnProperty;

        // Check student debt requirement
        const studentDebtQualifies = !program.eligibility.studentDebt || userData.studentDebt;

        // Check living/working in county requirement (if either is required, at least one must be true)
        const locationQualifies = !(program.eligibility.livingInCounty && program.eligibility.workingInCounty) || 
                                  userData.liveInCounty || 
                                  userData.workInCounty;

        // Check income limits
        const householdSize = Math.min(userData.householdSize, 5); // Cap at 5 for our data structure
        const incomeLimit = program.eligibility.incomeLimits[householdSize];
        const incomeQualifies = userData.householdIncome <= incomeLimit;

        // Special case for municipality-specific programs (Gaithersburg, Rockville, etc.)
        let municipalityQualifies = true;
        if (program.eligibility.gaithersburg) {
            municipalityQualifies = userData.municipality === "gaithersburg";
        }
        if (program.eligibility.rockville) {
            municipalityQualifies = userData.municipality === "rockville";
        }

        return (
            creditScoreQualifies &&
            firstTimeBuyerQualifies &&
            countyEmployeeQualifies &&
            propertyOwnershipQualifies &&
            studentDebtQualifies &&
            locationQualifies &&
            incomeQualifies &&
            municipalityQualifies
        );
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
 * Fetches program data from an external API
 * Future enhancement to load programs dynamically from server
 * @returns {Promise} - Promise that resolves to program data
 */
function fetchProgramData() {
    return new Promise((resolve) => {
        // For now, just return the static program data
        // In the future, this could make an actual API request
        setTimeout(() => {
            resolve(programs);
        }, 300);
    });
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