import { programs } from './programs.js';
import { fetchProgramData } from './api.js';
import {
    moveToStep1,
    moveToStep2,
    moveToStep3,
    moveToStep4,
    submitToGoogleSheet
} from './form-handlers.js';

// Document Ready function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
});

// Initialize the application
function initApp() {
    // Set up event listeners
    setupEventListeners();
    
    // Load county options for Maryland
    loadCountyOptions();
    
    // Check for URL parameters that might auto-fill the form
    checkUrlParameters();
    
    // Initialize any form components that need special setup
    initFormComponents();
    
    // Fetch program data if needed
    fetchProgramData()
        .then(data => {
            console.log('Program data loaded successfully');
        })
        .catch(error => {
            console.error('Error loading program data:', error);
        });
}

// Set up all event listeners
function setupEventListeners() {
    // Navigation buttons
    document.getElementById('next-to-step2').addEventListener('click', moveToStep2);
    document.getElementById('back-to-step1').addEventListener('click', moveToStep1);
    document.getElementById('next-to-step3').addEventListener('click', moveToStep3);
    document.getElementById('back-to-step2').addEventListener('click', moveToStep2);
    document.getElementById('back-to-step3').addEventListener('click', moveToStep3);
    document.getElementById('check-qualification').addEventListener('click', moveToStep4);
    document.getElementById('start-over').addEventListener('click', function() {
        window.location.reload();
    });
    document.getElementById('print-summary').addEventListener('click', function() {
        window.print();
    });
    document.getElementById('submit-data').addEventListener('click', submitToGoogleSheet);
    
    // County dropdown change event
    document.getElementById('municipality').addEventListener('change', function() {
        updateCityOptions(this.value);
    });
}

// Load county options
function loadCountyOptions() {
    const municipalitySelect = document.getElementById('municipality');
    
    // Clear existing options
    municipalitySelect.innerHTML = '';
    
    // Add default "Any" option
    const anyOption = document.createElement('option');
    anyOption.value = 'any';
    anyOption.textContent = 'Any area in Maryland';
    municipalitySelect.appendChild(anyOption);
    
    // Add Maryland counties
    const counties = [
        { value: 'allegany', name: 'Allegany County' },
        { value: 'anne-arundel', name: 'Anne Arundel County' },
        { value: 'baltimore-county', name: 'Baltimore County' },
        { value: 'baltimore-city', name: 'Baltimore City' },
        { value: 'calvert', name: 'Calvert County' },
        { value: 'caroline', name: 'Caroline County' },
        { value: 'carroll', name: 'Carroll County' },
        { value: 'cecil', name: 'Cecil County' },
        { value: 'charles', name: 'Charles County' },
        { value: 'dorchester', name: 'Dorchester County' },
        { value: 'frederick', name: 'Frederick County' },
        { value: 'garrett', name: 'Garrett County' },
        { value: 'harford', name: 'Harford County' },
        { value: 'howard', name: 'Howard County' },
        { value: 'kent', name: 'Kent County' },
        { value: 'montgomery', name: 'Montgomery County' },
        { value: 'prince-georges', name: 'Prince George\'s County' },
        { value: 'queen-annes', name: 'Queen Anne\'s County' },
        { value: 'somerset', name: 'Somerset County' },
        { value: 'st-marys', name: 'St. Mary\'s County' },
        { value: 'talbot', name: 'Talbot County' },
        { value: 'washington', name: 'Washington County' },
        { value: 'wicomico', name: 'Wicomico County' },
        { value: 'worcester', name: 'Worcester County' }
    ];
    
    counties.forEach(county => {
        const option = document.createElement('option');
        option.value = county.value;
        option.textContent = county.name;
        municipalitySelect.appendChild(option);
    });
}

// Update city options based on selected county
function updateCityOptions(county) {
    // This function would fetch cities for the selected county
    // and update a city dropdown if we add that feature
    console.log(`County selected: ${county}`);
    
    // Example cities data structure
    const cities = {
        'montgomery': ['Gaithersburg', 'Rockville', 'Silver Spring', 'Bethesda', 'Germantown', 'Takoma Park'],
        'prince-georges': ['Bowie', 'College Park', 'Greenbelt', 'Hyattsville', 'Laurel'],
        'baltimore-county': ['Towson', 'Catonsville', 'Dundalk', 'Essex', 'Pikesville'],
        'baltimore-city': ['Baltimore'],
        'howard': ['Columbia', 'Ellicott City', 'Laurel', 'Elkridge'],
        'anne-arundel': ['Annapolis', 'Glen Burnie', 'Severna Park', 'Crofton'],
        'frederick': ['Frederick', 'Brunswick', 'Thurmont'],
    };
    
    // If we add a city dropdown, we would update it here
    // const cityDropdown = document.getElementById('city');
    // cityDropdown.innerHTML = '';
    // cities[county].forEach(city => {
    //     const option = document.createElement('option');
    //     option.value = city.toLowerCase().replace(/\s+/g, '-');
    //     option.textContent = city;
    //     cityDropdown.appendChild(option);
    // });
}

// Check URL parameters for pre-filling form fields
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Example: Pre-fill county if provided in URL
    if (urlParams.has('county')) {
        const county = urlParams.get('county');
        const municipalitySelect = document.getElementById('municipality');
        if (municipalitySelect.querySelector(`option[value="${county}"]`)) {
            municipalitySelect.value = county;
            // Trigger change event to update dependent fields
            municipalitySelect.dispatchEvent(new Event('change'));
        }
    }
}

// Initialize form components that need special setup
function initFormComponents() {
    // Example: Initialize tooltips or other UI components
    // const tooltips = document.querySelectorAll('[data-toggle="tooltip"]');
    // tooltips.forEach(tooltip => {
    //     new Tooltip(tooltip);
    // });
}

// Initial setup when page loads
initApp();