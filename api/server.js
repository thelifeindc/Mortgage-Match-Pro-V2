const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'programs.json');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

// Load programs data
async function loadProgramsData() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist or has invalid JSON, return empty array
    if (err.code === 'ENOENT' || err instanceof SyntaxError) {
      return { programs: [] };
    }
    throw err;
  }
}

// Save programs data
async function saveProgramsData(data) {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Initialize with sample data if empty
async function initializeData() {
  const data = await loadProgramsData();
  
  // If no programs exist, add sample programs
  if (data.programs.length === 0) {
    data.programs = require('./sample-programs.js');
    await saveProgramsData(data);
    console.log('Initialized with sample program data');
  }
}

// API Routes

// Get all programs
app.get('/api/programs', async (req, res) => {
  try {
    const data = await loadProgramsData();
    res.json(data.programs);
  } catch (err) {
    console.error('Error loading programs:', err);
    res.status(500).json({ error: 'Failed to retrieve programs' });
  }
});

// Get a specific program by ID
app.get('/api/programs/:id', async (req, res) => {
  try {
    const data = await loadProgramsData();
    const program = data.programs.find(p => p.id === req.params.id);
    
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    res.json(program);
  } catch (err) {
    console.error('Error loading program:', err);
    res.status(500).json({ error: 'Failed to retrieve program' });
  }
});

// Search programs by criteria
app.post('/api/programs/search', async (req, res) => {
  try {
    const { county, city, firstTimeBuyer, creditScore, income, householdSize } = req.body;
    const data = await loadProgramsData();
    
    // Filter programs based on search criteria
    const filteredPrograms = data.programs.filter(program => {
      // County filter
      if (county && county !== 'any') {
        if (!program.eligibility.counties.includes(county) && 
            !program.eligibility.counties.includes('any')) {
          return false;
        }
      }
      
      // City filter
      if (city && city !== 'any') {
        if (program.eligibility.cities && 
            !program.eligibility.cities.includes(city) && 
            !program.eligibility.cities.includes('any')) {
          return false;
        }
      }
      
      // First-time buyer filter
      if (firstTimeBuyer !== undefined) {
        if (program.eligibility.firstTimeBuyer && !firstTimeBuyer) {
          return false;
        }
      }
      
      // Credit score filter (assuming creditScore is the minimum score)
      if (creditScore !== undefined) {
        if (program.eligibility.creditScore > creditScore) {
          return false;
        }
      }
      
      // Income filter
      if (income !== undefined && householdSize !== undefined) {
        const size = Math.min(householdSize, 5); // Cap at 5 for our data structure
        const incomeLimit = program.eligibility.incomeLimits[size];
        if (income > incomeLimit) {
          return false;
        }
      }
      
      return true;
    });
    
    res.json(filteredPrograms);
  } catch (err) {
    console.error('Error searching programs:', err);
    res.status(500).json({ error: 'Failed to search programs' });
  }
});

// Add a new program
app.post('/api/programs', async (req, res) => {
  try {
    const program = req.body;
    
    // Validate required fields
    if (!program.name || !program.description || !program.eligibility) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Add ID if not provided
    if (!program.id) {
      program.id = uuidv4();
    }
    
    const data = await loadProgramsData();
    data.programs.push(program);
    await saveProgramsData(data);
    
    res.status(201).json(program);
  } catch (err) {
    console.error('Error adding program:', err);
    res.status(500).json({ error: 'Failed to add program' });
  }
});

// Update a program
app.put('/api/programs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProgram = req.body;
    
    const data = await loadProgramsData();
    const index = data.programs.findIndex(p => p.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    // Ensure ID remains the same
    updatedProgram.id = id;
    data.programs[index] = updatedProgram;
    await saveProgramsData(data);
    
    res.json(updatedProgram);
  } catch (err) {
    console.error('Error updating program:', err);
    res.status(500).json({ error: 'Failed to update program' });
  }
});

// Delete a program
app.delete('/api/programs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = await loadProgramsData();
    const initialLength = data.programs.length;
    data.programs = data.programs.filter(p => p.id !== id);
    
    if (data.programs.length === initialLength) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    await saveProgramsData(data);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting program:', err);
    res.status(500).json({ error: 'Failed to delete program' });
  }
});

// Get counties
app.get('/api/counties', async (req, res) => {
  try {
    const data = await loadProgramsData();
    
    // Extract unique counties from all programs
    const counties = new Set();
    counties.add('any');
    
    data.programs.forEach(program => {
      if (program.eligibility.counties) {
        program.eligibility.counties.forEach(county => {
          if (county !== 'any') {
            counties.add(county);
          }
        });
      }
    });
    
    res.json(Array.from(counties));
  } catch (err) {
    console.error('Error retrieving counties:', err);
    res.status(500).json({ error: 'Failed to retrieve counties' });
  }
});

// Get cities for a specific county
app.get('/api/counties/:county/cities', async (req, res) => {
  try {
    const { county } = req.params;
    const data = await loadProgramsData();
    
    // Extract unique cities for the specified county
    const cities = new Set();
    cities.add('any');
    
    data.programs.forEach(program => {
      if (program.eligibility.counties && 
          (program.eligibility.counties.includes(county) || program.eligibility.counties.includes('any'))) {
        if (program.eligibility.cities) {
          program.eligibility.cities.forEach(city => {
            if (city !== 'any') {
              cities.add(city);
            }
          });
        }
      }
    });
    
    res.json(Array.from(cities));
  } catch (err) {
    console.error('Error retrieving cities:', err);
    res.status(500).json({ error: 'Failed to retrieve cities' });
  }
});

// Start the server
app.listen(PORT, async () => {
  console.log(`API server running on port ${PORT}`);
  try {
    await initializeData();
  } catch (err) {
    console.error('Error initializing data:', err);
  }
});

module.exports = app; // For testing purposes