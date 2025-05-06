// API Integration for Mortgage Match Pro

const API_BASE_URL = 'http://localhost:3000/api';

// Fetch all counties
async function fetchCounties() {
  try {
    const response = await fetch(`${API_BASE_URL}/counties`);
    if (!response.ok) {
      throw new Error('Failed to fetch counties');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching counties:', error);
    return ['any'];
  }
}

// Fetch cities for a specific county
async function fetchCitiesForCounty(county) {
  try {
    const response = await fetch(`${API_BASE_URL}/counties/${county}/cities`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cities for ${county}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching cities for ${county}:`, error);
    return ['any'];
  }
}

// Fetch all programs
async function fetchAllPrograms() {
  try {
    const response = await fetch(`${API_BASE_URL}/programs`);
    if (!response.ok) {
      throw new Error('Failed to fetch programs');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
}

// Fetch a specific program by ID
async function fetchProgramById(programId) {
  try {
    const response = await fetch(`${API_BASE_URL}/programs/${programId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch program with ID: ${programId}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching program with ID: ${programId}:`, error);
    return null;
  }
}

// Search programs based on user criteria
async function searchPrograms(criteria) {
  try {
    const response = await fetch(`${API_BASE_URL}/programs/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criteria),
    });
    
    if (!response.ok) {
      throw new Error('Failed to search programs');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching programs:', error);
    return [];
  }
}

// Helper function to get credit score value from range
function getCreditScoreValue(creditScoreRange) {
  const rangeMap = {
    'below-620': 619,
    '620-639': 620,
    '640-659': 640,
    '660-679': 660,
    '680-699': 680,
    '700-719': 700,
    '720-739': 720,
    '740-plus': 740
  };
  
  return rangeMap[creditScoreRange] || 0;
}

// Example: Load counties into dropdown
async function populateCountyDropdown() {
  const counties = await fetchCounties();
  const countySelect = document.getElementById('county');
  
  if (!countySelect) return;
  
  // Clear existing options
  countySelect.innerHTML = '';
  
  // Add the default "Any" option
  const anyOption = document.createElement('option');
  anyOption.value = 'any';
  anyOption.textContent = 'Any county in Maryland';
  countySelect.appendChild(anyOption);
  
  // Add county options
  counties.forEach(county => {
    if (county === 'any') return; // Skip "any" as it's already added
    
    const option = document.createElement('option');
    option.value = county;
    option.textContent = county.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' County';
    countySelect.appendChild(option);
  });
  
  // Add event listener to update city options when county changes
  countySelect.addEventListener('change', async function() {
    await updateCityDropdown(this.value);
  });
  
  // Initialize city dropdown
  await updateCityDropdown(countySelect.value);
}

// Example: Update city dropdown based on selected county
async function updateCityDropdown(county) {
  const cities = await fetchCitiesForCounty(county);
  const cityContainer = document.getElementById('city-container');
  
  if (!cityContainer) return;
  
  // Clear current city options
  cityContainer.innerHTML = '';
  
  // Only show city selection if a specific county is selected
  if (county !== 'any') {
    // Create city selection form group
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const label = document.createElement('label');
    label.setAttribute('for', 'city');
    label.textContent = 'Which city/town are you interested in?';
    
    const select = document.createElement('select');
    select.id = 'city';
    select.name = 'city';
    select.className = 'form-control';
    
    // Add the default "Any" option
    const anyOption = document.createElement('option');
    anyOption.value = 'any';
    anyOption.textContent = `Any city/town in ${county.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} County`;
    select.appendChild(anyOption);
    
    // Add city options
    cities.forEach(city => {
      if (city === 'any') return; // Skip "any" as it's already added
      
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      select.appendChild(option);
    });
    
    formGroup.appendChild(label);
    formGroup.appendChild(select);
    cityContainer.appendChild(formGroup);
  }
}

// Example: Submit form to find qualifying programs
async function findQualifyingPrograms(formData) {
  // Convert form data to search criteria
  const criteria = {
    county: formData.county,
    city: formData.city,
    firstTimeBuyer: formData.firstTimeBuyer === 'yes',
    creditScore: getCreditScoreValue(formData.creditScore),
    income: parseFloat(formData.income) || 0,
    householdSize: parseInt(formData.householdSize) || 1
  };
  
  // Search programs using the API
  const qualifyingPrograms = await searchPrograms(criteria);
  
  return qualifyingPrograms;
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Initialize county dropdown
  await populateCountyDropdown();
  
  // Add form submission handler
  const qualificationForm = document.getElementById('qualification-form');
  if (qualificationForm) {
    qualificationForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Show loading indicator
      document.getElementById('results-container').innerHTML = `
        <div class="loading-spinner">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Finding programs that match your situation...</p>
        </div>
      `;
      
      // Show results section
      document.getElementById('results-section').classList.remove('hidden');
      
      // Collect form data
      const formData = {
        county: document.getElementById('county').value,
        city: document.getElementById('city') ? document.getElementById('city').value : 'any',
        firstTimeBuyer: document.getElementById('first-time-buyer').value,
        creditScore: document.getElementById('credit-score').value,
        householdSize: document.getElementById('household-size').value,
        income: document.getElementById('income').value,
        livingInCounty: document.getElementById('living-in-county').value,
        workingInCounty: document.getElementById('working-in-county').value,
        countyEmployee: document.getElementById('county-employee').value,
        studentDebt: document.getElementById('student-debt').value,
        currentlyOwnProperty: document.getElementById('currently-own-property').value
      };
      
      // Populate summary
      populateSummary(formData);
      
      // Find qualifying programs
      const qualifyingPrograms = await findQualifyingPrograms(formData);
      
      // Display results
      renderProgramCards(qualifyingPrograms);
      
      // Scroll to results
      document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    });
  }
});

// Helper functions for rendering and interacting with the UI
function populateSummary(userData) {
  document.getElementById('summary-location').textContent = 
    userData.county === 'any' ? 'Any County in Maryland' : 
      userData.county.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' County' + 
      (userData.city && userData.city !== 'any' ? ', ' + userData.city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '');
  
  document.getElementById('summary-first-time').textContent = userData.firstTimeBuyer === 'yes' ? 'Yes' : 'No';
  document.getElementById('summary-credit').textContent = userData.creditScore.replace(/-/g, ' to ').replace('below-620', 'Below 620').replace('740-plus', '740 or higher');
  document.getElementById('summary-income').textContent = userData.income.replace(/-/g, ' to $').replace(/k/g, ',000').replace('below-30k', 'Below $30,000').replace('above-200k', 'Above $200,000');
  document.getElementById('summary-household').textContent = userData.householdSize === '8-plus' ? '8 or more' : userData.householdSize;
  document.getElementById('summary-lives').textContent = userData.livingInCounty === 'yes' ? 'Yes' : 'No';
  document.getElementById('summary-works').textContent = userData.workingInCounty === 'yes' ? 'Yes' : 'No';
  document.getElementById('summary-employee').textContent = userData.countyEmployee === 'yes' ? 'Yes' : 'No';
}

function renderProgramCards(programs) {
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.innerHTML = '';
  
  if (programs.length === 0) {
    resultsContainer.innerHTML = `
      <div class="alert alert-info">
        <h4>No matching programs found</h4>
        <p>Based on your information, we couldn't find any matching home loan assistance programs. You might consider:</p>
        <ul>
          <li>Checking other counties or cities</li>
          <li>Reviewing your credit score requirements</li>
          <li>Exploring private lender options</li>
        </ul>
      </div>
    `;
    return;
  }
  
  programs.forEach(program => {
    const programCard = document.createElement('div');
    programCard.className = 'card program-card';
    programCard.innerHTML = `
      <div class="program-header">
        <h3 class="mb-0">${program.name}</h3>
      </div>
      <div class="program-content">
        <p class="lead">${program.description}</p>
        <div class="alert alert-success">
          <strong>Financial Benefit:</strong> ${program.savings}
        </div>
        
        <h4>Benefits</h4>
        <ul class="list-group mb-4">
          ${program.benefits.map(benefit => `<li class="list-group-item">${benefit}</li>`).join('')}
        </ul>
        
        <h4>Requirements</h4>
        <ul class="list-group mb-4">
          ${program.requirements.map(req => `<li class="list-group-item">${req}</li>`).join('')}
        </ul>
        
        ${program.links ? `
        <h4>More Information</h4>
        <div class="mb-3">
          ${program.links.map(link => `<a href="${link.url}" target="_blank" class="btn btn-outline-primary me-2 mb-2">${link.title}</a>`).join('')}
        </div>
        ` : ''}
        
        <div class="text-muted mt-2">
          <small>Last updated: ${program.lastUpdated || 'Unknown'}</small>
        </div>
      </div>
    `;
    
    resultsContainer.appendChild(programCard);
  });
}