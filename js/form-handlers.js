import { programs } from './programs.js';
import { filterQualifyingPrograms, checkProgramQualification } from './api.js';

// Variables to track state
let selectedPrograms = [];
let qualifyingPrograms = [];
let userData = {};

// DOM elements
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const step4 = document.getElementById("step4");
const progressBar = document.getElementById("progress-bar");
const programsList = document.getElementById("programs-list");
const selectedProgramsDetails = document.getElementById("selected-programs-details");
const programSpecificQuestions = document.getElementById("program-specific-questions");
const userInfoSummary = document.getElementById("user-info-summary");
const qualificationResults = document.getElementById("qualification-results");
const nextSteps = document.getElementById("next-steps");

// Navigation Functions
function moveToStep1() {
    step2.classList.remove("active");
    step1.classList.add("active");
    progressBar.style.width = "25%";
    selectedPrograms = [];
}

function moveToStep2() {
    if (step1.classList.contains("active")) {
        // Collect user data from step 1
        userData = {
            firstName: document.getElementById("first-name").value,
            lastName: document.getElementById("last-name").value,
            email: document.getElementById("email").value,
            phoneNumber: document.getElementById("phone-number").value,
            liveInCounty: document.querySelector('input[name="live-in-county"]:checked')?.value === "yes",
            workInCounty: document.querySelector('input[name="work-in-county"]:checked')?.value === "yes",
            countyEmployee: document.querySelector('input[name="county-employee"]:checked')?.value === "yes",
            municipality: document.getElementById("municipality").value,
            householdSize: parseInt(document.getElementById("household-size").value),
            householdIncome: parseFloat(document.getElementById("household-income").value) || 0,
            firstTimeBuyer: document.querySelector('input[name="first-time-buyer"]:checked')?.value === "yes",
            currentlyOwnProperty: document.querySelector('input[name="own-property"]:checked')?.value === "yes",
            creditScore: document.getElementById("credit-score").value,
            studentDebt: document.querySelector('input[name="student-debt"]:checked')?.value === "yes",
            howLongStay: document.getElementById("how-long-stay").value,
        };

        // Validate required fields
        const requiredFields = [
            "live-in-county",
            "work-in-county",
            "county-employee",
            "first-time-buyer",
            "own-property",
            "student-debt",
        ];
        let missingFields = false;

        for (const field of requiredFields) {
            if (!document.querySelector(`input[name="${field}"]:checked`)) {
                missingFields = true;
                break;
            }
        }

        if (missingFields || !userData.householdIncome) {
            alert("Please fill out all required fields before continuing.");
            return;
        }

        // Filter qualifying programs
        qualifyingPrograms = filterQualifyingPrograms(userData);

        // Populate programs list
        populateProgramsList(qualifyingPrograms);
    }

    if (step3.classList.contains("active")) {
        // Don't reset selected programs when going back from step 3
    }

    step1.classList.remove("active");
    step3.classList.remove("active");
    step4.classList.remove("active");
    step2.classList.add("active");
    progressBar.style.width = "50%";

    // Enable/disable next button based on selection
    document.getElementById("next-to-step3").disabled = selectedPrograms.length === 0;
}

function moveToStep3() {
    if (selectedPrograms.length === 0) {
        alert("Please select at least one program to continue.");
        return;
    }

    // Display selected programs details and questions
    displaySelectedProgramsDetails();

    step2.classList.remove("active");
    step4.classList.remove("active");
    step3.classList.add("active");
    progressBar.style.width = "75%";
}

function moveToStep4() {
    // Validate all required questions are answered
    if (!validateProgramQuestions()) {
        alert("Please answer all required questions to check your qualification.");
        return;
    }

    // Generate summary
    generateSummary();

    step3.classList.remove("active");
    step4.classList.add("active");
    progressBar.style.width = "100%";
}

// Helper Functions
function populateProgramsList(qualifyingPrograms) {
    programsList.innerHTML = "";

    if (qualifyingPrograms.length === 0) {
        const noPrograms = document.createElement("div");
        noPrograms.className = "alert";
        noPrograms.innerHTML = "<strong>No matching programs found.</strong> You may need to adjust your information or income level to qualify for Maryland homebuyer programs.";
        programsList.appendChild(noPrograms);
        document.getElementById("next-to-step3").disabled = true;
        return;
    }

    qualifyingPrograms.forEach((program) => {
        const programCard = document.createElement("div");
        programCard.className = "program-card";
        programCard.setAttribute("data-id", program.id);

        programCard.innerHTML = `
            <div class="checkbox-wrapper">
                <input type="checkbox" id="select-${program.id}" name="select-program" value="${program.id}">
                <label for="select-${program.id}" style="display: inline; font-size: 1.2em; color: #2c5282;">Select This Program</label>
            </div>
            <h3>${program.name}</h3>
            <p>${program.description}</p>
            <p class="savings">Potential Savings: ${program.savings}</p>
            <div>
                ${program.benefits.slice(0, 2).map((benefit) => `<span class="benefit-tag">${benefit}</span>`).join("")}
            </div>
        `;

        programsList.appendChild(programCard);

        // Add event listener to checkbox
        const checkbox = programCard.querySelector(`#select-${program.id}`);
        checkbox.addEventListener("change", function () {
            if (this.checked) {
                // Add to selected programs
                selectedPrograms.push(program);
                programCard.classList.add("selected");
            } else {
                // Remove from selected programs
                selectedPrograms = selectedPrograms.filter((p) => p.id !== program.id);
                programCard.classList.remove("selected");
            }

            // Enable/disable next button based on selection
            document.getElementById("next-to-step3").disabled = selectedPrograms.length === 0;
        });

        // Add click event to card (except checkbox)
        programCard.addEventListener("click", (e) => {
            // Ignore clicks on the checkbox itself
            if (e.target !== checkbox && e.target.type !== "checkbox") {
                checkbox.checked = !checkbox.checked;
                // Trigger the change event
                const event = new Event("change");
                checkbox.dispatchEvent(event);
            }
        });
    });
}

function displaySelectedProgramsDetails() {
    const selectedProgramsDetails = document.getElementById("selected-programs-details");
    const programSpecificQuestions = document.getElementById("program-specific-questions");
    
    selectedProgramsDetails.innerHTML = "";
    programSpecificQuestions.innerHTML = "";

    // Add heading for questions
    programSpecificQuestions.innerHTML = `
        <h3>Additional Information Needed</h3>
        <p>Please answer the following questions to check your qualification:</p>
    `;

    // Keep track of questions already added to avoid duplicates
    const addedQuestions = new Set();

    // For each selected program
    selectedPrograms.forEach((program, index) => {
        // Create a section for this program
        const programSection = document.createElement("div");
        programSection.className = "program-section";
        programSection.innerHTML = `
            <h3>${program.name}</h3>
            <p>${program.description}</p>
            <p class="savings">Potential Savings: ${program.savings}</p>

            <div class="program-details">
                <details ${index === 0 ? "open" : ""}>
                    <summary>Program Benefits</summary>
                    <ul>
                        ${program.benefits.map((benefit) => `<li>${benefit}</li>`).join("")}
                    </ul>
                </details>

                <details>
                    <summary>Eligibility Requirements</summary>
                    <ul>
                        ${program.requirements.map((req) => `<li>${req}</li>`).join("")}
                    </ul>
                </details>
            </div>
        `;

        selectedProgramsDetails.appendChild(programSection);

        // Add program-specific questions (avoiding duplicates)
        if (program.additionalQuestions) {
            program.additionalQuestions.forEach((question) => {
                // Skip if this question ID is already added
                if (addedQuestions.has(question.id)) return;

                // Mark this question as added
                addedQuestions.add(question.id);

                const questionDiv = document.createElement("div");
                questionDiv.className = "form-group";
                questionDiv.setAttribute("data-program", program.id);

                switch (question.type) {
                    case "text":
                        questionDiv.innerHTML = `
                            <label for="${question.id}">${question.question}</label>
                            <input type="text" id="${question.id}" name="${question.id}" data-required="true">
                        `;
                        break;

                    case "radio":
                        questionDiv.innerHTML = `
                            <label>${question.question}</label>
                            ${question.options.map((option, idx) => `
                                <div class="radio-option">
                                    <input type="radio" id="${question.id}-${idx}" name="${question.id}" value="${option}" data-required="true">
                                    <label for="${question.id}-${idx}" style="display: inline;">${option}</label>
                                </div>
                            `).join("")}
                        `;
                        break;

                    case "select":
                        questionDiv.innerHTML = `
                            <label for="${question.id}">${question.question}</label>
                            <select id="${question.id}" name="${question.id}" data-required="true">
                                <option value="">-- Please select --</option>
                                ${question.options.map((option) => `<option value="${option}">${option}</option>`).join("")}
                            </select>
                        `;
                        break;

                    default:
                        break;
                }

                programSpecificQuestions.appendChild(questionDiv);
            });
        }
    });
}

function validateProgramQuestions() {
    const requiredFields = document.querySelectorAll('[data-required="true"]');
    let allFieldsValid = true;

    requiredFields.forEach((field) => {
        // Get field type
        const fieldType = field.tagName.toLowerCase();

        if (fieldType === "input" && field.type === "text") {
            // Text input validation
            if (!field.value.trim()) {
                field.style.borderColor = "#e53e3e";
                allFieldsValid = false;
            } else {
                field.style.borderColor = "#ddd";
            }
        } else if (fieldType === "select") {
            // Select field validation
            if (!field.value) {
                field.style.borderColor = "#e53e3e";
                allFieldsValid = false;
            } else {
                field.style.borderColor = "#ddd";
            }
        } else if (field.type === "radio") {
            // Radio button validation (check if any option in the group is selected)
            const name = field.name;
            const group = document.querySelectorAll(`input[name="${name}"]:checked`);

            if (group.length === 0) {
                // Highlight the label
                const label = field.closest(".form-group").querySelector("label");
                label.style.color = "#e53e3e";
                allFieldsValid = false;
            } else {
                // Reset the label color
                const label = field.closest(".form-group").querySelector("label");
                label.style.color = "#333";
            }
        }
    });

    return allFieldsValid;
}

function generateSummary() {
    // Generate user information summary
    userInfoSummary.innerHTML = `
        <h3>Your Information</h3>
        <div class="summary-row">
            <div class="summary-label">Name:</div>
            <div class="summary-value">${userData.firstName} ${userData.lastName}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Email:</div>
            <div class="summary-value">${userData.email}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Phone:</div>
            <div class="summary-value">${userData.phoneNumber}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Live in County:</div>
            <div class="summary-value">${userData.liveInCounty ? "Yes" : "No"}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Work in County:</div>
            <div class="summary-value">${userData.workInCounty ? "Yes" : "No"}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">County Employee:</div>
            <div class="summary-value">${userData.countyEmployee ? "Yes" : "No"}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Preferred Location:</div>
            <div class="summary-value">${getMunicipalityDisplayName(userData.municipality)}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Household Size:</div>
            <div class="summary-value">${userData.householdSize} person${userData.householdSize !== 1 ? "s" : ""}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Annual Household Income:</div>
            <div class="summary-value">$${userData.householdIncome.toLocaleString()}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">First-Time Homebuyer:</div>
            <div class="summary-value">${userData.firstTimeBuyer ? "Yes" : "No"}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Currently Owns Property:</div>
            <div class="summary-value">${userData.currentlyOwnProperty ? "Yes" : "No"}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Credit Score Range:</div>
            <div class="summary-value">${getCreditScoreDisplayValue(userData.creditScore)}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Student Loan Debt:</div>
            <div class="summary-value">${userData.studentDebt ? "Yes" : "No"}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Planned Length of Stay:</div>
            <div class="summary-value">${getStayDurationDisplayValue(userData.howLongStay)}</div>
        </div>
    `;

    // Add additional answers
    const additionalAnswers = document.createElement("div");
    additionalAnswers.innerHTML = "<h4>Additional Information:</h4>";

    // Get all form field values
    const formGroups = document.querySelectorAll("#program-specific-questions .form-group");
    let hasAdditionalInfo = false;

    formGroups.forEach((group) => {
        const label = group.querySelector("label").textContent;
        let value = "";

        // Get the input/select value
        const input = group.querySelector('input[type="text"]');
        const select = group.querySelector("select");
        const radio = group.querySelector('input[type="radio"]:checked');

        if (input) {
            value = input.value;
        } else if (select) {
            value = select.value;
        } else if (radio) {
            value = radio.value;
        }

        if (value) {
            hasAdditionalInfo = true;
            additionalAnswers.innerHTML += `
                <div class="summary-row">
                    <div class="summary-label">${label}</div>
                    <div class="summary-value">${value}</div>
                </div>
            `;
        }
    });

    if (hasAdditionalInfo) {
        userInfoSummary.appendChild(additionalAnswers);
    }

    // Generate qualification results
    qualificationResults.innerHTML = "<h3>Program Qualification Results</h3>";

    selectedPrograms.forEach((program) => {
        const programResult = document.createElement("div");

        // Check qualification based on user data
        const qualifies = checkProgramQualification(program, userData);

        programResult.className = qualifies ? "qualified-program" : "unqualified-program";
        programResult.innerHTML = `
            <h4>${program.name}</h4>
            <p><strong>${qualifies ? "Congratulations! You appear to qualify for this program." : "You may not fully qualify for this program."}</strong></p>
            <p>${qualifies ? `Potential Savings: ${program.savings}` : "Review the requirements below to see what factors may affect your qualification."}</p>
            <details>
                <summary>Program Requirements</summary>
                <ul>
                    ${program.requirements.map((req) => `<li>${req}</li>`).join("")}
                </ul>
            </details>
        `;

        qualificationResults.appendChild(programResult);
    });

    // Add next steps
    nextSteps.innerHTML = `
        <h3>Next Steps</h3>
        <p>Based on your qualification results, here are recommended next steps:</p>
        <ul>
            <li>Contact the specific program administrators for official qualification verification</li>
            <li>Complete a HUD-approved homebuyer education course if you haven't already</li>
            <li>Work with an approved lender to start the pre-approval process</li>
            <li>Gather required documentation (tax returns, pay stubs, bank statements, etc.)</li>
        </ul>
        <p class="warning"><strong>Note:</strong> This tool provides a preliminary assessment only. Final qualification determination will be made by the program administrators based on their complete application process and current guidelines.</p>
    `;
}

// Helper functions
function getMunicipalityDisplayName(municipalityCode) {
    const municipalityMap = {
        'any': 'Any area in Maryland',
        'allegany': 'Allegany County',
        'anne-arundel': 'Anne Arundel County',
        'baltimore-county': 'Baltimore County',
        'baltimore-city': 'Baltimore City',
        'calvert': 'Calvert County',
        'caroline': 'Caroline County',
        'carroll': 'Carroll County',
        'cecil': 'Cecil County',
        'charles': 'Charles County',
        'dorchester': 'Dorchester County',
        'frederick': 'Frederick County',
        'garrett': 'Garrett County',
        'harford': 'Harford County',
        'howard': 'Howard County',
        'kent': 'Kent County',
        'montgomery': 'Montgomery County',
        'prince-georges': 'Prince George\'s County',
        'queen-annes': 'Queen Anne\'s County',
        'somerset': 'Somerset County',
        'st-marys': 'St. Mary\'s County',
        'talbot': 'Talbot County',
        'washington': 'Washington County',
        'wicomico': 'Wicomico County',
        'worcester': 'Worcester County',
        'gaithersburg': 'Gaithersburg',
        'rockville': 'Rockville',
        'takoma-park': 'Takoma Park',
        'other': 'Other area'
    };

    return municipalityMap[municipalityCode] || municipalityCode;
}

function getCreditScoreDisplayValue(creditScoreCode) {
    const creditScoreMap = {
        'below-640': 'Below 640',
        '640-699': '640-699',
        '700-plus': '700 or above',
        'unknown': 'Unknown'
    };

    return creditScoreMap[creditScoreCode] || creditScoreCode;
}

function getStayDurationDisplayValue(stayDurationCode) {
    const stayDurationMap = {
        'less-than-5': 'Less than 5 years',
        '5-10': '5-10 years',
        '10-15': '10-15 years',
        '15-plus': '15+ years',
        'unsure': 'Not sure'
    };

    return stayDurationMap[stayDurationCode] || stayDurationCode;
}

// Configuration for Google Sheet submission
let googleSheetConfig = {
    // Replace this with your Google Apps Script Web App URL
    url: "https://script.google.com/macros/s/AKfycbzSSiuBIxr6Ws3qSyapTHQoxoLk4zZnqsLi1y_T168iLbFo4kpWfcGr5I8hE8Xuvfw5Zw/exec",
    // Set to true to enable Google Sheets submission, false to disable
    enabled: true,
    // Show debug information in the console
    debug: false
};

// Try to load configuration from localStorage if available
try {
    const savedConfig = localStorage.getItem('googleSheetConfig');
    if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        googleSheetConfig = {
            ...googleSheetConfig,
            ...parsedConfig
        };
        console.log("Google Sheets configuration loaded from localStorage");
    }
} catch (error) {
    console.error("Error loading Google Sheets configuration:", error);
}

// Make config accessible to other windows (like admin panel)
window.googleSheetConfig = googleSheetConfig;

// Function to submit data to Google Sheet
function submitToGoogleSheet() {
    // Show a loading message or spinner
    const loadingMessage = document.createElement("div");
    loadingMessage.innerHTML = '<p class="success">Submitting your information...</p>';
    qualificationResults.parentNode.insertBefore(loadingMessage, nextSteps);

    // Collect all program-specific answers
    const additionalResponses = {};
    const formGroups = document.querySelectorAll("#program-specific-questions .form-group");

    formGroups.forEach((group) => {
        const questionLabel = group.querySelector("label").textContent;
        const questionId = group.querySelector('[data-required="true"]').id.split("-")[0];
        let value = "";

        // Get the input/select value
        const input = group.querySelector('input[type="text"]');
        const select = group.querySelector("select");
        const radio = group.querySelector('input[type="radio"]:checked');

        if (input) {
            value = input.value;
        } else if (select) {
            value = select.value;
        } else if (radio) {
            value = radio.value;
        }

        additionalResponses[questionId] = {
            question: questionLabel,
            answer: value,
        };
    });

    // Create the data object to send
    const dataToSend = {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        liveInCounty: userData.liveInCounty,
        workInCounty: userData.workInCounty,
        countyEmployee: userData.countyEmployee,
        municipality: userData.municipality,
        householdSize: userData.householdSize,
        householdIncome: userData.householdIncome,
        firstTimeBuyer: userData.firstTimeBuyer,
        currentlyOwnProperty: userData.currentlyOwnProperty,
        creditScore: userData.creditScore,
        studentDebt: userData.studentDebt,
        howLongStay: userData.howLongStay,
        selectedPrograms: selectedPrograms.map((program) => program.name),
        qualifiedPrograms: selectedPrograms
            .filter((program) => checkProgramQualification(program, userData))
            .map((program) => program.name),
        additionalResponses: additionalResponses,
    };

    // If Google Sheets submission is disabled, show a message and return
    if (!googleSheetConfig.enabled) {
        console.log("Google Sheets submission is disabled");
        loadingMessage.remove();
        const infoMessage = document.createElement("div");
        infoMessage.className = "success";
        infoMessage.innerHTML = "<strong>Note:</strong> Form submission feature is currently in demo mode. Your data was not saved.";
        qualificationResults.parentNode.insertBefore(infoMessage, nextSteps);
        return;
    }

    // Log data being sent if debug is enabled
    if (googleSheetConfig.debug) {
        console.log("Submitting data to Google Sheet:", dataToSend);
    }

    // Send data to Google Apps Script
    fetch(
        googleSheetConfig.url,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dataToSend),
        }
    )
        .then((response) => response.json())
        .then((data) => {
            // Log response if debug is enabled
            if (googleSheetConfig.debug) {
                console.log("Google Sheet response:", data);
            }
            
            // Remove loading message
            loadingMessage.remove();

            // Show success message
            const successMessage = document.createElement("div");
            successMessage.className = "success";
            successMessage.innerHTML = "<strong>Success!</strong> Your information has been submitted. Thank you for using our program finder!";
            qualificationResults.parentNode.insertBefore(successMessage, nextSteps);

            // Disable submit button to prevent duplicate submissions
            document.getElementById("submit-data").disabled = true;
        })
        .catch((error) => {
            // Log error if debug is enabled
            if (googleSheetConfig.debug) {
                console.error("Google Sheet submission error:", error);
            }
            
            // Remove loading message
            loadingMessage.remove();

            // Show error message
            const errorMessage = document.createElement("div");
            errorMessage.className = "alert";
            errorMessage.innerHTML = "<strong>Error:</strong> There was a problem submitting your information. Please try again later.";
            qualificationResults.parentNode.insertBefore(errorMessage, nextSteps);
            console.error("Error:", error);
        });
}

// Export the necessary functions
export {
    moveToStep1,
    moveToStep2,
    moveToStep3,
    moveToStep4,
    submitToGoogleSheet,
    selectedPrograms,
    userData
};