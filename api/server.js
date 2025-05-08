const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const HousingProgramScraper = require('./web-scraper');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'programs.json');
const PROGRAM_DATA_FILE = path.join(__dirname, '..', 'data', 'program-data.json');

// Configuration flags
const config = {
  webScrapingEnabled: false, // Set to false to disable web scraping
  scheduledTasksEnabled: false, // Set to false to disable scheduled tasks
};

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure data directories exist
async function ensureDataDirs() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.mkdir(path.join(__dirname, '..', 'data'), { recursive: true });
  } catch (err) {
    console.error('Error creating data directories:', err);
  }
}

// Load programs data (legacy format)
async function loadProgramsData() {
  try {
    await ensureDataDirs();
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

// Load program data from central repository
async function loadCentralProgramData() {
  try {
    await ensureDataDirs();
    const data = await fs.readFile(PROGRAM_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist or has invalid JSON, return empty array
    if (err.code === 'ENOENT' || err instanceof SyntaxError) {
      return [];
    }
    throw err;
  }
}

// Save programs data (legacy format)
async function saveProgramsData(data) {
  await ensureDataDirs();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Save program data to central repository
async function saveCentralProgramData(programs) {
  await ensureDataDirs();
  await fs.writeFile(PROGRAM_DATA_FILE, JSON.stringify(programs, null, 2), 'utf8');
}

// Initialize with sample data if empty
async function initializeData() {
  // Initialize legacy data
  const data = await loadProgramsData();
  
  // If no programs exist, add sample programs
  if (data.programs.length === 0) {
    data.programs = require('./sample-programs.js');
    await saveProgramsData(data);
    console.log('Initialized legacy data with sample program data');
  }
  
  // Initialize central program data
  const centralPrograms = await loadCentralProgramData();
  
  // If central data is empty, copy from program-data.json or create from sample data
  if (centralPrograms.length === 0) {
    try {
      // First try to use existing program-data.json
      const newCentralPrograms = await loadCentralProgramData();
      if (newCentralPrograms.length > 0) {
        console.log('Using existing program-data.json');
        return;
      }
      
      // If that's empty too, create from sample data with new structure
      const now = new Date().toISOString();
      const samplePrograms = data.programs.map(program => ({
        ...program,
        status: 'active',
        source: 'manual-entry',
        createdAt: now,
        updatedAt: now,
        lastValidatedAt: now,
        expiresAt: null,
        metadata: {
          version: 1,
          changeHistory: [
            {
              date: now,
              type: 'created',
              details: 'Initial program entry'
            }
          ]
        }
      }));
      
      await saveCentralProgramData(samplePrograms);
      console.log('Initialized central data with structured program data');
    } catch (err) {
      console.error('Error initializing central program data:', err);
    }
  }
}

// API Routes

// Get all programs
app.get('/api/programs', async (req, res) => {
  try {
    // Use central repository instead of legacy data
    const programs = await loadCentralProgramData();
    
    // Filter out outdated programs by default unless specifically requested
    const includeOutdated = req.query.includeOutdated === 'true';
    const includeAll = req.query.includeAll === 'true';
    
    let filteredPrograms = programs;
    
    if (!includeAll) {
      if (includeOutdated) {
        // Include active and outdated programs but not pending review
        filteredPrograms = programs.filter(p => p.status !== 'pending_review');
      } else {
        // Only include active programs (default)
        filteredPrograms = programs.filter(p => p.status === 'active');
      }
    }
    
    res.json(filteredPrograms);
  } catch (err) {
    console.error('Error loading programs:', err);
    res.status(500).json({ error: 'Failed to retrieve programs' });
  }
});

// Get a specific program by ID
app.get('/api/programs/:id', async (req, res) => {
  try {
    const programs = await loadCentralProgramData();
    const program = programs.find(p => p.id === req.params.id);
    
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    // Only return active programs or if specifically requesting all statuses
    if (program.status !== 'active' && req.query.includeAll !== 'true') {
      return res.status(404).json({ error: 'Program not found or inactive' });
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
    const programs = await loadCentralProgramData();
    
    // Filter programs based on search criteria
    const filteredPrograms = programs.filter(program => {
      // Only include active programs by default
      if (program.status !== 'active' && req.query.includeAll !== 'true') {
        return false;
      }
      
      // County filter - if applicable
      if (county && county !== 'any' && program.eligibility.counties) {
        if (!program.eligibility.counties.includes(county) && 
            !program.eligibility.counties.includes('any')) {
          return false;
        }
      }
      
      // City filter - if applicable
      if (city && city !== 'any' && program.eligibility.cities) {
        if (!program.eligibility.cities.includes(city) && 
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

// Add a new program to central repository
app.post('/api/programs', async (req, res) => {
  try {
    const program = req.body;
    
    // Validate required fields
    if (!program.name || !program.description || !program.eligibility) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Add ID if not provided
    if (!program.id) {
      program.id = `manual-${uuidv4().substring(0, 8)}`;
    }
    
    // Add metadata and timestamps
    const now = new Date().toISOString();
    const newProgram = {
      ...program,
      status: 'active',
      source: 'manual-entry',
      createdAt: now,
      updatedAt: now,
      lastValidatedAt: now,
      expiresAt: null,
      metadata: {
        version: 1,
        changeHistory: [
          {
            date: now,
            type: 'created',
            details: 'Manually added via API'
          }
        ]
      }
    };
    
    // Add to central data repository
    const programs = await loadCentralProgramData();
    programs.push(newProgram);
    await saveCentralProgramData(programs);
    
    // Also add to legacy data for backward compatibility
    const legacyData = await loadProgramsData();
    legacyData.programs.push(program);
    await saveProgramsData(legacyData);
    
    res.status(201).json(newProgram);
  } catch (err) {
    console.error('Error adding program:', err);
    res.status(500).json({ error: 'Failed to add program' });
  }
});

// Update a program in central repository
app.put('/api/programs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProgramData = req.body;
    
    const programs = await loadCentralProgramData();
    const index = programs.findIndex(p => p.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    const existingProgram = programs[index];
    
    // Add metadata and timestamps
    const now = new Date().toISOString();
    const updatedProgram = {
      ...existingProgram,
      ...updatedProgramData,
      id, // Ensure ID remains the same
      updatedAt: now,
      lastValidatedAt: now,
      metadata: {
        ...existingProgram.metadata,
        version: existingProgram.metadata.version + 1,
        changeHistory: [
          ...existingProgram.metadata.changeHistory,
          {
            date: now,
            type: 'updated',
            details: 'Manually updated via API'
          }
        ]
      }
    };
    
    // Update central repository
    programs[index] = updatedProgram;
    await saveCentralProgramData(programs);
    
    // Also update legacy data for backward compatibility
    const legacyData = await loadProgramsData();
    const legacyIndex = legacyData.programs.findIndex(p => p.id === id);
    
    if (legacyIndex !== -1) {
      // Only update basic fields in legacy data
      const legacyProgram = {
        ...updatedProgramData,
        id
      };
      legacyData.programs[legacyIndex] = legacyProgram;
      await saveProgramsData(legacyData);
    }
    
    res.json(updatedProgram);
  } catch (err) {
    console.error('Error updating program:', err);
    res.status(500).json({ error: 'Failed to update program' });
  }
});

// Mark a program as outdated (soft delete)
app.delete('/api/programs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const hardDelete = req.query.hardDelete === 'true';
    
    // For central repository, we mark as outdated rather than deleting
    const programs = await loadCentralProgramData();
    const index = programs.findIndex(p => p.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    if (hardDelete) {
      // Actually remove the program if specifically requested (admin only)
      programs.splice(index, 1);
    } else {
      // Mark as outdated (soft delete)
      const now = new Date().toISOString();
      programs[index] = {
        ...programs[index],
        status: 'outdated',
        updatedAt: now,
        expiresAt: now,
        metadata: {
          ...programs[index].metadata,
          version: programs[index].metadata.version + 1,
          changeHistory: [
            ...programs[index].metadata.changeHistory,
            {
              date: now,
              type: 'outdated',
              details: 'Manually marked as outdated via API'
            }
          ]
        }
      };
    }
    
    await saveCentralProgramData(programs);
    
    // Also update legacy data for backward compatibility
    if (hardDelete) {
      const legacyData = await loadProgramsData();
      const initialLength = legacyData.programs.length;
      legacyData.programs = legacyData.programs.filter(p => p.id !== id);
      
      if (legacyData.programs.length < initialLength) {
        await saveProgramsData(legacyData);
      }
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Error marking program as outdated:', err);
    res.status(500).json({ error: 'Failed to update program status' });
  }
});

// Get counties
app.get('/api/counties', async (req, res) => {
  try {
    // Use central repository
    const programs = await loadCentralProgramData();
    
    // Only include active programs
    const activePrograms = programs.filter(p => p.status === 'active');
    
    // Extract unique counties from all programs
    const counties = new Set();
    counties.add('any');
    
    activePrograms.forEach(program => {
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
    
    // Use central repository
    const programs = await loadCentralProgramData();
    
    // Only include active programs
    const activePrograms = programs.filter(p => p.status === 'active');
    
    // Extract unique cities for the specified county
    const cities = new Set();
    cities.add('any');
    
    activePrograms.forEach(program => {
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

// Web scraping endpoints

// Run web scraper to update program data
app.post('/api/admin/scrape', async (req, res) => {
  // Check if web scraping is enabled
  if (!config.webScrapingEnabled) {
    return res.json({
      success: false,
      message: "Web scraping is temporarily disabled for maintenance",
      disabled: true
    });
  }
  
  try {
    const scraper = new HousingProgramScraper();
    const results = await scraper.scrapeAll();
    res.json({
      success: true,
      results
    });
  } catch (err) {
    console.error('Error running web scraper:', err);
    res.status(500).json({ error: 'Failed to run web scraper' });
  }
});

// Change program status (for admin operations - mark as active, outdated, etc.)
app.put('/api/admin/programs/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['active', 'pending_review', 'outdated'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const programs = await loadCentralProgramData();
    const index = programs.findIndex(p => p.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    const now = new Date().toISOString();
    programs[index] = {
      ...programs[index],
      status,
      updatedAt: now,
      expiresAt: status === 'outdated' ? now : programs[index].expiresAt,
      metadata: {
        ...programs[index].metadata,
        version: programs[index].metadata.version + 1,
        changeHistory: [
          ...programs[index].metadata.changeHistory,
          {
            date: now,
            type: 'status_change',
            details: `Status changed to ${status}${reason ? ': ' + reason : ''}`
          }
        ]
      }
    };
    
    await saveCentralProgramData(programs);
    res.json(programs[index]);
  } catch (err) {
    console.error('Error updating program status:', err);
    res.status(500).json({ error: 'Failed to update program status' });
  }
});

// Get program statistics
app.get('/api/admin/stats', async (req, res) => {
  try {
    const programs = await loadCentralProgramData();
    
    const stats = {
      total: programs.length,
      active: programs.filter(p => p.status === 'active').length,
      pendingReview: programs.filter(p => p.status === 'pending_review').length,
      outdated: programs.filter(p => p.status === 'outdated').length,
      manualEntry: programs.filter(p => p.source === 'manual-entry').length,
      scraped: programs.filter(p => p.source === 'scraped').length,
      updatedLast30Days: programs.filter(p => {
        const updatedDate = new Date(p.updatedAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return updatedDate >= thirtyDaysAgo;
      }).length,
      config: {
        webScrapingEnabled: config.webScrapingEnabled,
        scheduledTasksEnabled: config.scheduledTasksEnabled
      }
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Error getting program statistics:', err);
    res.status(500).json({ error: 'Failed to get program statistics' });
  }
});

// Toggle web scraping
app.post('/api/admin/config/scraping', async (req, res) => {
  const { enabled } = req.body;
  
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'Invalid request. Expected "enabled" boolean.' });
  }
  
  config.webScrapingEnabled = enabled;
  
  // If turning on and there are scheduled tasks active
  if (enabled && config.scheduledTasksEnabled && !scrapeSchedule) {
    setupScheduledTasks();
  }
  
  // If turning off and there is a scrape schedule
  if (!enabled && scrapeSchedule) {
    scrapeSchedule.stop();
    scrapeSchedule = null;
  }
  
  res.json({
    success: true,
    webScrapingEnabled: config.webScrapingEnabled,
    scheduledTasksEnabled: config.scheduledTasksEnabled
  });
});

// Setup scheduled tasks
let scrapeSchedule;

function setupScheduledTasks() {
  if (!config.scheduledTasksEnabled) {
    console.log('Scheduled tasks are disabled by configuration');
    return;
  }
  
  // Schedule web scraping to run daily at 2am
  if (config.webScrapingEnabled) {
    scrapeSchedule = cron.schedule('0 2 * * *', async () => {
      console.log('Running scheduled web scraping...');
      try {
        const scraper = new HousingProgramScraper();
        const results = await scraper.scrapeAll();
        console.log('Scheduled scraping complete:', results);
      } catch (error) {
        console.error('Error during scheduled scraping:', error);
      }
    });
    console.log('Web scraping scheduled tasks have been set up');
  } else {
    console.log('Web scraping scheduled tasks are disabled by configuration');
  }
}

// Start the server
app.listen(PORT, async () => {
  console.log(`API server running on port ${PORT}`);
  try {
    await initializeData();
    setupScheduledTasks();
  } catch (err) {
    console.error('Error initializing data:', err);
  }
});

module.exports = app; // For testing purposes