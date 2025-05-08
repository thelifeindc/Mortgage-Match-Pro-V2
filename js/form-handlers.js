import { programs } from './programs.js';
import { filterQualifyingPrograms, checkProgramQualification, fetchProgramData } from './api.js';
import { animateSubmitProgress } from './animations.js';

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

// Animation for progress bar
function animateProgressBar(targetWidth) {
    const currentWidth = parseInt(progressBar.style.width || '0');
    const duration = 700; // ms
    const startTime = performance.now();
    
    // Animate progress bar with easing function
    function step(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Cubic bezier approximation for smooth easing
        const t = progress;
        const easedProgress = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        const width = currentWidth + (targetWidth - currentWidth) * easedProgress;
        progressBar.style.width = `${width}%`;
        
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }
    
    requestAnimationFrame(step);
}

// Navigation Functions
function moveToStep1() {
    // Add subtle exit animation to current step
    if (step2.classList.contains("active")) {
        step2.style.animation = "fadeOutDown 0.5s ease forwards";
        setTimeout(() => {
            step2.classList.remove("active");
            step2.style.animation = "";
            step1.classList.add("active");
            // Add custom entrance animation
            step1.style.animation = "fadeInUp 0.6s ease forwards";
        }, 300);
    }
    
    // Animate progress bar with easing
    animateProgressBar(25);
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

        // Show a subtle loading animation before populating programs
        const findingProgramsIndicator = document.createElement("div");
        findingProgramsIndicator.className = "loading-container";
        findingProgramsIndicator.style.height = "200px";
        findingProgramsIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <span class="loading-text">Finding programs that match your criteria...</span>
        `;
        step1.appendChild(findingProgramsIndicator);
        
        // Add animation to the submit button
        const nextButton = document.getElementById("next-to-step2");
        animateSubmitProgress(nextButton, () => {
            // Animate step transition
            step1.style.animation = "fadeOutUp 0.5s ease forwards";
            
            setTimeout(() => {
                // Remove loading indicator
                findingProgramsIndicator.remove();
                
                // Remove current step
                step1.classList.remove("active");
                step1.style.animation = "";
                step3.classList.remove("active");
                step4.classList.remove("active");
                
                // Add next step with animation
                step2.classList.add("active");
                step2.style.animation = "fadeInUp 0.6s ease forwards";
                
                // Populate programs list after transition
                populateProgramsList(qualifyingPrograms);
                
                // Animate progress bar
                animateProgressBar(50);
                
                // Enable/disable next button based on selection
                document.getElementById("next-to-step3").disabled = selectedPrograms.length === 0;
            }, 500);
        });
        
        return; // Return early to prevent immediate transition
    }

    if (step3.classList.contains("active")) {
        // Add exit animation
        step3.style.animation = "fadeOutRight 0.5s ease forwards";
        
        setTimeout(() => {
            step3.classList.remove("active");
            step3.style.animation = "";
            
            // Add entrance animation
            step2.classList.add("active");
            step2.style.animation = "fadeInLeft 0.6s ease forwards";
            
            // Animate progress bar
            animateProgressBar(50);
            
            // Enable/disable next button based on selection
            document.getElementById("next-to-step3").disabled = selectedPrograms.length === 0;
        }, 400);
        
        return;
    }
    
    // Fallback for other scenarios (should never happen)
    step1.classList.remove("active");
    step3.classList.remove("active");
    step4.classList.remove("active");
    step2.classList.add("active");
    animateProgressBar(50);
    
    // Enable/disable next button based on selection
    document.getElementById("next-to-step3").disabled = selectedPrograms.length === 0;
}

function moveToStep3() {
    if (selectedPrograms.length === 0) {
        alert("Please select at least one program to continue.");
        return;
    }

    // Add exit animation to step 2
    step2.style.animation = "fadeOutLeft 0.5s ease forwards";
    
    // Animate the next button
    const nextButton = document.getElementById("next-to-step3");
    animateSubmitProgress(nextButton, () => {
        setTimeout(() => {
            // Display selected programs details and questions
            step2.classList.remove("active");
            step4.classList.remove("active");
            step2.style.animation = "";
            
            // Add entrance animation to step 3
            step3.classList.add("active");
            step3.style.animation = "fadeInRight 0.6s ease forwards";
            
            // Display program details with staggered animations
            displaySelectedProgramsDetails();
            
            // Animate progress bar with easing
            animateProgressBar(75);
        }, 300);
    });
}

function moveToStep4() {
    // Validate all required questions are answered
    if (!validateProgramQuestions()) {
        alert("Please answer all required questions to check your qualification.");
        return;
    }

    // Add exit animation to step 3
    step3.style.animation = "fadeOutUp 0.5s ease forwards";
    
    // Animate the submit button
    const submitButton = document.getElementById("check-qualification");
    animateSubmitProgress(submitButton, () => {
        setTimeout(() => {
            // Generate summary
            step3.classList.remove("active");
            step3.style.animation = "";
            
            // Add entrance animation to step 4
            step4.classList.add("active");
            step4.style.animation = "fadeInDown 0.6s ease forwards";
            
            // Generate summary with animation
            generateSummary();
            
            // Animate progress bar to completion
            animateProgressBar(100);
            
            // Submit data to Google Sheet automatically
            submitToGoogleSheet();
            
            // Disable the submit button since we've already submitted
            document.getElementById("submit-data").disabled = true;
        }, 300);
    });
}

// Add these CSS animations to the document if they don't exist
function addAnimationStyles() {
    if (!document.getElementById('form-animations-css')) {
        const style = document.createElement('style');
        style.id = 'form-animations-css';
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes fadeOutUp {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(-20px);
                }
            }
            
            @keyframes fadeInDown {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes fadeOutDown {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(20px);
                }
            }
            
            @keyframes fadeInLeft {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes fadeOutLeft {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-20px);
                }
            }
            
            @keyframes fadeInRight {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes fadeOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(20px);
                }
            }
        `;
        document.head.appendChild(style);
    }
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

    qualifyingPrograms.forEach((program, index) => {
        const programCard = document.createElement("div");
        programCard.className = "program-card";
        programCard.setAttribute("data-id", program.id);
        programCard.setAttribute("data-program-id", program.id);
        
        // Add staggered animation delay based on index
        programCard.style.animationDelay = `${0.1 + (index * 0.05)}s`;

        programCard.innerHTML = `
            <div class="checkbox-wrapper">
                <input type="checkbox" id="select-${program.id}" name="select-program" value="${program.id}">
                <label for="select-${program.id}" style="display: inline; font-size: 1.2em; color: #2c5282;">Select This Program</label>
            </div>
            <h3>${program.name}</h3>
            <p>${program.description}</p>
            <p class="savings">Potential Savings: ${program.savings}</p>
            <p class="program-rate">Current Rate: ${program.rates?.current || 'N/A'}%</p>
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
                
                // Add smooth animation when selecting a card
                programCard.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
                programCard.classList.add("selected");
            } else {
                // Remove from selected programs
                selectedPrograms = selectedPrograms.filter((p) => p.id !== program.id);
                
                // Add smooth animation when deselecting a card
                programCard.style.transition = "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
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

        // Add rate details to the program card
        const rateCard = createRateCard(program);
        programCard.insertBefore(rateCard, programCard.querySelector('.program-details'));
        updateRateComparison(program.id);
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
        
        // Add staggered entrance animation
        programSection.style.opacity = "0";
        programSection.style.transform = "translateY(20px)";
        programSection.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.15}s`;
        
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
            program.additionalQuestions.forEach((question, qIndex) => {
                // Skip if this question ID is already added
                if (addedQuestions.has(question.id)) return;

                // Mark this question as added
                addedQuestions.add(question.id);

                const questionDiv = document.createElement("div");
                questionDiv.className = "form-group";
                questionDiv.setAttribute("data-program", program.id);
                
                // Add staggered animation for questions
                questionDiv.style.opacity = "0";
                questionDiv.style.transform = "translateY(15px)";
                questionDiv.style.animation = `fadeInUp 0.4s ease forwards ${0.3 + ((index + qIndex) * 0.1)}s`;

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
                                    <label for="${question.id}-${idx}">${option}</label>
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
                field.style.animation = "shake 0.4s ease";
                setTimeout(() => {
                    field.style.animation = "";
                }, 400);
                allFieldsValid = false;
            } else {
                field.style.borderColor = "#ddd";
            }
        } else if (fieldType === "select") {
            // Select field validation
            if (!field.value) {
                field.style.borderColor = "#e53e3e";
                field.style.animation = "shake 0.4s ease";
                setTimeout(() => {
                    field.style.animation = "";
                }, 400);
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
                label.style.animation = "shake 0.4s ease";
                setTimeout(() => {
                    label.style.animation = "";
                }, 400);
                allFieldsValid = false;
            } else {
                // Reset the label color
                const label = field.closest(".form-group").querySelector("label");
                label.style.color = "#333";
            }
        }
    });

    if (!allFieldsValid) {
        // Add shake animation style if not exist
        if (!document.getElementById('shake-animation')) {
            const style = document.createElement('style');
            style.id = 'shake-animation';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    return allFieldsValid;
}

function generateSummary() {
    // Generate user information summary with animation
    userInfoSummary.innerHTML = `
        <h3>Your Information</h3>
        <div class="summary-content" style="opacity: 0; animation: fadeInUp 0.6s ease forwards 0.1s;">
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
        </div>
    `;

    // Add additional answers
    const additionalAnswers = document.createElement("div");
    additionalAnswers.innerHTML = "<h4>Additional Information:</h4>";
    additionalAnswers.style.opacity = "0";
    additionalAnswers.style.animation = "fadeInUp 0.6s ease forwards 0.3s";

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

    // Generate qualification results with animation
    qualificationResults.innerHTML = "<h3>Program Qualification Results</h3>";

    selectedPrograms.forEach((program, index) => {
        const programResult = document.createElement("div");

        // Check qualification based on user data
        const qualifies = checkProgramQualification(program, userData);

        programResult.className = qualifies ? "qualified-program" : "unqualified-program";
        programResult.style.opacity = "0";
        programResult.style.animation = `fadeInUp 0.6s ease forwards ${0.4 + (index * 0.1)}s`;
        
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

    // Add next steps with animation
    nextSteps.innerHTML = `
        <h3>Next Steps</h3>
        <div style="opacity: 0; animation: fadeInUp 0.6s ease forwards 0.6s;">
            <p>Based on your qualification results, here are recommended next steps:</p>
            <ul>
                <li>Contact the specific program administrators for official qualification verification</li>
                <li>Complete a HUD-approved homebuyer education course if you haven't already</li>
                <li>Work with an approved lender to start the pre-approval process</li>
                <li>Gather required documentation (tax returns, pay stubs, bank statements, etc.)</li>
            </ul>
            <p class="warning"><strong>Note:</strong> This tool provides a preliminary assessment only. Final qualification determination will be made by the program administrators based on their complete application process and current guidelines.</p>
        </div>
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
    url: "https://script.google.com/macros/s/AKfycbzIEN7ppnX9wue9YFnDPDl78Mou98tn4YvhfJonEirfTMv5Yj3WjkAhSem-1jH1RlGduA/exec",
    // Set to true to enable Google Sheets submission, false to disable
    enabled: true,
    // Show debug information in the console
    debug: true
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
    // Show a loading spinner with animation
    const loadingContainer = document.createElement("div");
    loadingContainer.className = "loading-container";
    loadingContainer.innerHTML = `
        <div class="loading-spinner"></div>
        <span class="loading-text">Submitting your information...</span>
    `;
    qualificationResults.parentNode.insertBefore(loadingContainer, nextSteps);

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
        loadingContainer.remove();
        const infoMessage = document.createElement("div");
        infoMessage.className = "success submit-success";
        infoMessage.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-info"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <strong>Note:</strong> Form submission feature is currently in demo mode. Your data was not saved.
        `;
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
            redirect: "follow",
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
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
            
            // Remove loading container
            loadingContainer.remove();

            // Show success message with animation
            const successMessage = document.createElement("div");
            successMessage.className = "success submit-success";
            successMessage.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <strong>Success!</strong> Your information has been submitted. Thank you for using our program finder!
            `;
            qualificationResults.parentNode.insertBefore(successMessage, nextSteps);

            // Disable submit button to prevent duplicate submissions
            document.getElementById("submit-data").disabled = true;
        })
        .catch((error) => {
            // Log error if debug is enabled
            if (googleSheetConfig.debug) {
                console.error("Google Sheet submission error:", error);
            }
            
            // Remove loading container
            loadingContainer.remove();

            // Show error message with animation
            const errorMessage = document.createElement("div");
            errorMessage.className = "alert submit-success";
            errorMessage.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12.01" y2="8"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <strong>Error:</strong> There was a problem submitting your information. Please try again later.
            `;
            qualificationResults.parentNode.insertBefore(errorMessage, nextSteps);
            console.error("Error:", error);
        });
}

// Update program rates every minute
const RATE_UPDATE_INTERVAL = 60 * 1000; // 1 minute

function startRateUpdates() {
    setInterval(async () => {
        const programCards = document.querySelectorAll('.program-card');
        if (programCards.length > 0) {
            const latestPrograms = await fetchProgramData();
            updateProgramRates(latestPrograms);
        }
    }, RATE_UPDATE_INTERVAL);
}

function updateProgramRates(programs) {
    programs.forEach(program => {
        const card = document.querySelector(`[data-program-id="${program.id}"]`);
        if (card) {
            const rateElement = card.querySelector('.program-rate');
            if (rateElement && program.rates) {
                rateElement.textContent = `Current Rate: ${program.rates.current}%`;
                // Add visual indicator if rate changed
                if (rateElement.dataset.previousRate && rateElement.dataset.previousRate !== program.rates.current) {
                    const direction = program.rates.current > rateElement.dataset.previousRate ? 'up' : 'down';
                    rateElement.classList.add(`rate-changed-${direction}`);
                    setTimeout(() => rateElement.classList.remove(`rate-changed-${direction}`), 3000);
                }
                rateElement.dataset.previousRate = program.rates.current;
            }
        }
    });
}

// Initialize rate charts
let rateCharts = new Map();

function createRateCard(program) {
    const rateDetails = document.createElement('div');
    rateDetails.className = 'rate-details';
    
    // Current rate display
    const currentRate = program.rates?.current || 'N/A';
    const trend = program.rates?.trend || 'stable';
    
    rateDetails.innerHTML = `
        <div class="current-rate">
            <strong>Current Rate:</strong> ${currentRate}%
            <div class="rate-trend trend-${trend}">
                <svg class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    ${getTrendIcon(trend)}
                </svg>
                <span>${getTrendLabel(trend)}</span>
            </div>
        </div>

        <div class="rate-comparison">
            <h4>Lender Comparison</h4>
            <div id="comparison-${program.id}"></div>
        </div>

        <button class="rate-history-toggle" onclick="toggleRateHistory('${program.id}')">
            View Rate History
        </button>
        <div id="history-${program.id}" class="rate-history" style="display: none;"></div>
    `;

    // Add rate explanation tooltip
    addRateExplanationTooltip(program.id);

    return rateDetails;
}

function getTrendIcon(trend) {
    switch(trend) {
        case 'increasing':
            return '<path d="M7 17l5-5 5 5M7 7l5 5 5-5"/>';
        case 'decreasing':
            return '<path d="M7 7l5 5 5-5M7 17l5-5 5 5"/>';
        default:
            return '<path d="M7 12h10"/>';
    }
}

function getTrendLabel(trend) {
    switch(trend) {
        case 'increasing':
            return 'Rate trending up';
        case 'decreasing':
            return 'Rate trending down';
        default:
            return 'Rate stable';
    }
}

function updateRateComparison(programId) {
    const comparison = LenderService.compareRates(programId);
    if (!comparison) return;

    const container = document.getElementById(`comparison-${programId}`);
    if (!container) return;

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Lender</th>
                    <th>Current Rate</th>
                    <th>24h Avg</th>
                </tr>
            </thead>
            <tbody>
                ${comparison.lenderComparison.map(lender => `
                    <tr class="${lender.lender === comparison.bestLender ? 'best-rate' : ''}">
                        <td>${formatLenderName(lender.lender)}</td>
                        <td>${lender.currentRate.toFixed(3)}%</td>
                        <td>${lender.averageRate.toFixed(3)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function formatLenderName(lender) {
    return lender.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

function toggleRateHistory(programId) {
    const historyContainer = document.getElementById(`history-${programId}`);
    if (!historyContainer) return;

    const isVisible = historyContainer.style.display !== 'none';
    if (isVisible) {
        historyContainer.style.display = 'none';
        if (rateCharts.has(programId)) {
            rateCharts.get(programId).destroy();
            rateCharts.delete(programId);
        }
    } else {
        historyContainer.style.display = 'block';
        createRateHistoryChart(programId);
    }
}

function createRateHistoryChart(programId) {
    const ctx = document.getElementById(`history-${programId}`).getContext('2d');
    const config = getRateChartConfig(programId);
    
    if (rateCharts.has(programId)) {
        rateCharts.get(programId).destroy();
    }

    const chart = new Chart(ctx, config);
    rateCharts.set(programId, chart);
    
    // Add period selector buttons
    addPeriodSelectors(programId);
}

function getRateChartConfig(programId, period = '24h') {
    const history = LenderService.getRateHistory(programId, period);
    const now = new Date();
    const timeFormat = period === '24h' ? 'HH:mm' : 'MM/DD';

    return {
        type: 'line',
        data: {
            labels: history.map(h => {
                const date = new Date(h.timestamp);
                return date.toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    month: period !== '24h' ? 'short' : undefined,
                    day: period !== '24h' ? 'numeric' : undefined
                });
            }),
            datasets: [{
                label: 'Interest Rate',
                data: history.map(h => h.rate),
                borderColor: '#4299e1',
                backgroundColor: 'rgba(66, 153, 225, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (context) => `Rate: ${context.parsed.y.toFixed(3)}%`,
                        title: (tooltipItems) => {
                            const date = new Date(history[tooltipItems[0].dataIndex].timestamp);
                            return date.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric'
                            });
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 8,
                        maxRotation: 0
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: (value) => value + '%'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    };
}

function addPeriodSelectors(programId) {
    const container = document.getElementById(`history-${programId}`).parentElement;
    const selector = document.createElement('div');
    selector.className = 'rate-period-selector';
    
    const periods = [
        { id: '1h', label: '1H' },
        { id: '24h', label: '24H' },
        { id: '7d', label: '7D' },
        { id: '30d', label: '30D' }
    ];

    selector.innerHTML = periods.map(period => `
        <button class="period-button ${period.id === '24h' ? 'active' : ''}" 
                data-period="${period.id}">
            ${period.label}
        </button>
    `).join('');

    container.insertBefore(selector, container.firstChild);

    // Add event listeners
    selector.querySelectorAll('.period-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const period = e.target.dataset.period;
            selector.querySelectorAll('.period-button').forEach(b => 
                b.classList.remove('active')
            );
            e.target.classList.add('active');
            
            // Update chart with new period
            const chart = rateCharts.get(programId);
            const newConfig = getRateChartConfig(programId, period);
            
            chart.data = newConfig.data;
            chart.options = newConfig.options;
            chart.update('active');
        });
    });
}

// Add hover effects for rate history points
function addRateTooltip(programId) {
    const tooltip = document.createElement('div');
    tooltip.className = 'rate-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);

    const chart = rateCharts.get(programId);
    const canvas = chart.canvas;

    canvas.addEventListener('mousemove', (e) => {
        const points = chart.getElementsAtEventForMode(
            e,
            'nearest',
            { intersect: false },
            true
        );

        if (points.length) {
            const point = points[0];
            const data = chart.data.datasets[point.datasetIndex].data[point.index];
            const label = chart.data.labels[point.index];
            
            tooltip.style.display = 'block';
            tooltip.style.left = e.pageX + 'px';
            tooltip.style.top = (e.pageY - 10) + 'px';
            tooltip.textContent = `${label}: ${data.toFixed(3)}%`;
        } else {
            tooltip.style.display = 'none';
        }
    });

    canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });
}

// Update rate cards with real-time information
function updateRateCards() {
    const cards = document.querySelectorAll('.program-card');
    cards.forEach(card => {
        const programId = card.getAttribute('data-program-id');
        if (programId) {
            const rateContainer = card.querySelector('.rate-details');
            if (!rateContainer) {
                const program = LenderService.findProgram(programId);
                if (program) {
                    const rateCard = createRateCard(program);
                    card.insertBefore(rateCard, card.querySelector('.program-details'));
                    updateRateComparison(programId);
                    
                    // Initialize rate history chart if visible
                    const historyContainer = card.querySelector('.rate-history');
                    if (historyContainer && historyContainer.style.display !== 'none') {
                        createRateHistoryChart(programId);
                        addRateTooltip(programId);
                    }
                }
            }
        }
    });
}

// Listen for real-time updates
window.addEventListener('lender-update', (event) => {
    const { data, lender } = event.detail;
    if (data.type === 'rate_update') {
        updateProgramCards();
        // Flash the updated rate
        const rateElement = document.querySelector(`[data-program-id="${data.programId}"] .current-rate`);
        if (rateElement) {
            rateElement.classList.add('rate-update-flash');
            setTimeout(() => rateElement.classList.remove('rate-update-flash'), 1000);
        }
    }
});

// Initialize WebSocket connections when the page loads
document.addEventListener('DOMContentLoaded', function() {
    LenderService.initializeWebSockets();
    addAnimationStyles();
    startRateUpdates();
});

// Add rate explanation tooltip
function addRateExplanationTooltip(programId) {
    const container = document.querySelector(`[data-program-id="${programId}"] .rate-details`);
    if (!container) return;

    const infoIcon = document.createElement('div');
    infoIcon.className = 'rate-info-icon';
    infoIcon.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
    `;

    const tooltip = document.createElement('div');
    tooltip.className = 'rate-info-tooltip';
    tooltip.style.display = 'none';

    // Get rate trend analysis
    const analysis = getRateTrendAnalysis(programId);
    tooltip.innerHTML = `
        <div class="rate-analysis">
            <h4>Rate Analysis</h4>
            <p>${analysis.summary}</p>
            <div class="rate-metrics">
                <div class="metric">
                    <span class="label">24h Change:</span>
                    <span class="value ${analysis.dayChange < 0 ? 'decreasing' : analysis.dayChange > 0 ? 'increasing' : 'stable'}">
                        ${formatRateChange(analysis.dayChange)}
                    </span>
                </div>
                <div class="metric">
                    <span class="label">7d Average:</span>
                    <span class="value">${analysis.weekAverage.toFixed(3)}%</span>
                </div>
                <div class="metric">
                    <span class="label">Volatility:</span>
                    <span class="value">${analysis.volatility}</span>
                </div>
            </div>
            ${analysis.recommendation ? `
                <div class="rate-recommendation">
                    <strong>Recommendation:</strong> ${analysis.recommendation}
                </div>
            ` : ''}
        </div>
    `;

    container.appendChild(infoIcon);
    container.appendChild(tooltip);

    // Show/hide tooltip on hover
    infoIcon.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
        tooltip.style.animation = 'fadeInSlide 0.2s ease forwards';
    });

    infoIcon.addEventListener('mouseleave', () => {
        tooltip.style.animation = 'fadeOutSlide 0.2s ease forwards';
        setTimeout(() => {
            if (!tooltip.matches(':hover')) {
                tooltip.style.display = 'none';
            }
        }, 200);
    });

    tooltip.addEventListener('mouseleave', () => {
        tooltip.style.animation = 'fadeOutSlide 0.2s ease forwards';
        setTimeout(() => tooltip.style.display = 'none', 200);
    });
}

function getRateTrendAnalysis(programId) {
    const history = LenderService.getRateHistory(programId, '7d');
    if (!history || history.length < 2) {
        return {
            summary: 'Insufficient rate history data available.',
            dayChange: 0,
            weekAverage: 0,
            volatility: 'N/A',
            recommendation: null
        };
    }

    const current = history[history.length - 1].rate;
    const dayAgo = history.find(h => {
        const timeDiff = new Date() - new Date(h.timestamp);
        return timeDiff >= 24 * 60 * 60 * 1000;
    })?.rate || history[0].rate;

    const dayChange = current - dayAgo;
    const rates = history.map(h => h.rate);
    const weekAverage = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;

    // Calculate rate volatility
    const volatility = calculateVolatility(rates);
    const volatilityLevel = getVolatilityLevel(volatility);

    // Generate analysis and recommendation
    const summary = generateRateAnalysisSummary(dayChange, weekAverage, volatilityLevel, current);
    const recommendation = generateRateRecommendation(dayChange, volatilityLevel, current, weekAverage);

    return {
        summary,
        dayChange,
        weekAverage,
        volatility: volatilityLevel,
        recommendation
    };
}

function calculateVolatility(rates) {
    if (rates.length < 2) return 0;
    
    const changes = [];
    for (let i = 1; i < rates.length; i++) {
        changes.push(Math.abs(rates[i] - rates[i-1]));
    }
    
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
}

function getVolatilityLevel(volatility) {
    if (volatility < 0.01) return 'Very Low';
    if (volatility < 0.025) return 'Low';
    if (volatility < 0.05) return 'Moderate';
    if (volatility < 0.1) return 'High';
    return 'Very High';
}

function formatRateChange(change) {
    const formatted = Math.abs(change).toFixed(3);
    return `${change < 0 ? '-' : change > 0 ? '+' : ''}${formatted}%`;
}

function generateRateAnalysisSummary(dayChange, weekAverage, volatility, currentRate) {
    const trend = dayChange < 0 ? 'decreased' : dayChange > 0 ? 'increased' : 'remained stable';
    const magnitude = Math.abs(dayChange) < 0.01 ? 'slightly ' : 
                     Math.abs(dayChange) < 0.05 ? '' : 'significantly ';
    
    let summary = `Rates have ${magnitude}${trend} over the last 24 hours `;
    summary += `(${formatRateChange(dayChange)}). `;
    
    if (currentRate < weekAverage) {
        summary += `Current rate is below the 7-day average of ${weekAverage.toFixed(3)}%. `;
    } else if (currentRate > weekAverage) {
        summary += `Current rate is above the 7-day average of ${weekAverage.toFixed(3)}%. `;
    }
    
    summary += `Rate volatility is ${volatility.toLowerCase()}.`;
    
    return summary;
}

function generateRateRecommendation(dayChange, volatility, currentRate, weekAverage) {
    if (volatility === 'Very High') {
        return 'Consider locking your rate soon due to high market volatility.';
    }
    
    if (currentRate < weekAverage && dayChange <= 0) {
        return 'Current rates are favorable compared to recent trends. Consider locking your rate.';
    }
    
    if (currentRate > weekAverage && volatility !== 'Low' && volatility !== 'Very Low') {
        return 'You may want to wait for rates to stabilize or decrease before locking.';
    }
    
    if (volatility === 'Very Low' || volatility === 'Low') {
        return 'Market is stable. Good time to lock if you\'re satisfied with current rates.';
    }
    
    return null; // No specific recommendation
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