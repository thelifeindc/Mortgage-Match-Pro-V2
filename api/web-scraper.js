const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// File path for our central program data repository
const PROGRAM_DATA_FILE = path.join(__dirname, '..', 'data', 'program-data.json');

/**
 * Web scraper for housing programs
 * 
 * This module scrapes various housing program websites to update our program database.
 * It follows these rules:
 * 1. New programs are added with status "pending_review"
 * 2. Existing programs are updated with new information while preserving history
 * 3. Changed programs get an updated timestamp
 * 4. Programs are never deleted, only marked as "outdated" when they no longer exist
 */
class HousingProgramScraper {
  /**
   * Initialize the scraper
   */
  constructor() {
    this.sources = [
      {
        id: 'maryland-mortgage',
        name: 'Maryland Mortgage Program',
        url: 'https://mmp.maryland.gov/Pages/Programs.aspx',
        scraper: this.scrapeMaryland
      },
      {
        id: 'montgomery-hoc',
        name: 'Montgomery County HOC',
        url: 'https://www.hocmc.org/homeownership/homeownership-programs.html',
        scraper: this.scrapeMontgomeryHOC
      },
      {
        id: 'pg-county',
        name: 'Prince George\'s County',
        url: 'https://www.princegeorgescountymd.gov/1014/Pathways-to-Purchase',
        scraper: this.scrapePrinceGeorges
      }
    ];
  }

  /**
   * Run scraping for all sources
   */
  async scrapeAll() {
    console.log('Starting scraping of all housing program sources...');
    
    // Load our current program data
    let programs = await this.loadProgramData();
    
    // Track overall results
    const results = {
      new: 0,
      updated: 0,
      unchanged: 0,
      outdated: 0,
      errors: 0
    };
    
    // Process each source
    for (const source of this.sources) {
      console.log(`Scraping ${source.name} (${source.url})...`);
      try {
        // Get data from this source
        const scrapedPrograms = await source.scraper.call(this, source);
        
        // Process the scraped programs
        const sourceResults = await this.processScrapedPrograms(programs, scrapedPrograms, source.id);
        
        // Update our tracking
        results.new += sourceResults.new;
        results.updated += sourceResults.updated;
        results.unchanged += sourceResults.unchanged;
        results.outdated += sourceResults.outdated;
        
        console.log(`Completed scraping ${source.name}: ${JSON.stringify(sourceResults)}`);
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
        results.errors++;
      }
    }
    
    // Save the updated program data
    await this.saveProgramData(programs);
    
    console.log('Scraping complete. Results:', results);
    return results;
  }
  
  /**
   * Process scraped programs and update our central data store
   */
  async processScrapedPrograms(existingPrograms, scrapedPrograms, sourceId) {
    const results = {
      new: 0,
      updated: 0,
      unchanged: 0,
      outdated: 0
    };
    
    const now = new Date().toISOString();
    const scrapedIds = new Set();
    
    // Process each scraped program
    for (const scrapedProgram of scrapedPrograms) {
      // Generate an ID if not present
      if (!scrapedProgram.id) {
        scrapedProgram.id = `${sourceId}-${uuidv4().substring(0, 8)}`;
      }
      
      // Keep track of what we've seen from this source
      scrapedIds.add(scrapedProgram.id);
      
      // Look for an existing program with this ID
      const existingIndex = existingPrograms.findIndex(p => p.id === scrapedProgram.id);
      
      if (existingIndex === -1) {
        // This is a new program - add it
        const newProgram = {
          ...scrapedProgram,
          status: 'pending_review',
          source: 'scraped',
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
                details: `Scraped from ${sourceId}`
              }
            ]
          }
        };
        
        existingPrograms.push(newProgram);
        results.new++;
      } else {
        // This is an existing program - check if it's changed
        const existingProgram = existingPrograms[existingIndex];
        
        // Don't update programs marked as manually managed
        if (existingProgram.source === 'manual-entry') {
          results.unchanged++;
          continue;
        }
        
        // Compare the key fields to see if anything important changed
        if (
          existingProgram.name !== scrapedProgram.name ||
          existingProgram.description !== scrapedProgram.description ||
          JSON.stringify(existingProgram.eligibility) !== JSON.stringify(scrapedProgram.eligibility) ||
          JSON.stringify(existingProgram.benefits) !== JSON.stringify(scrapedProgram.benefits) ||
          JSON.stringify(existingProgram.requirements) !== JSON.stringify(scrapedProgram.requirements)
        ) {
          // Update the program with new data while preserving metadata
          const updatedProgram = {
            ...existingProgram,
            ...scrapedProgram,
            source: 'scraped',
            updatedAt: now,
            lastValidatedAt: now,
            status: existingProgram.status === 'outdated' ? 'pending_review' : existingProgram.status,
            metadata: {
              ...existingProgram.metadata,
              version: existingProgram.metadata.version + 1,
              changeHistory: [
                ...existingProgram.metadata.changeHistory,
                {
                  date: now,
                  type: 'updated',
                  details: `Updated from ${sourceId}`
                }
              ]
            }
          };
          
          existingPrograms[existingIndex] = updatedProgram;
          results.updated++;
        } else {
          // No changes detected, just update the validation timestamp
          existingPrograms[existingIndex].lastValidatedAt = now;
          results.unchanged++;
        }
      }
    }
    
    // Mark programs from this source that weren't seen as outdated
    for (const program of existingPrograms) {
      // Skip programs not from this source or already marked as outdated
      if (!program.id.startsWith(sourceId) || program.status === 'outdated' || program.source === 'manual-entry') {
        continue;
      }
      
      // If we didn't see this program in our scrape, mark it as outdated
      if (!scrapedIds.has(program.id)) {
        program.status = 'outdated';
        program.updatedAt = now;
        program.expiresAt = program.expiresAt || now; // Set expiration date if not already set
        program.metadata.version += 1;
        program.metadata.changeHistory.push({
          date: now,
          type: 'outdated',
          details: `No longer found on ${sourceId}`
        });
        
        results.outdated++;
      }
    }
    
    return results;
  }
  
  /**
   * Load current program data
   */
  async loadProgramData() {
    try {
      const data = await fs.readFile(PROGRAM_DATA_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading program data:', error);
      return [];
    }
  }
  
  /**
   * Save updated program data
   */
  async saveProgramData(programs) {
    // Sort programs with active first, followed by pending review and outdated
    const sortedPrograms = programs.sort((a, b) => {
      const statusOrder = { 'active': 0, 'pending_review': 1, 'outdated': 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
    
    await fs.writeFile(PROGRAM_DATA_FILE, JSON.stringify(sortedPrograms, null, 2), 'utf8');
  }
  
  /**
   * Scrape Maryland Mortgage Program website
   */
  async scrapeMaryland(source) {
    const response = await axios.get(source.url);
    const $ = cheerio.load(response.data);
    const programs = [];
    
    // Example scraping logic for Maryland programs
    $('.program-item').each((i, element) => {
      const name = $(element).find('h3').text().trim();
      const description = $(element).find('.program-description').text().trim();
      const savingsText = $(element).find('.program-savings').text().trim();
      
      // Extract eligibility criteria
      const eligibility = {
        firstTimeBuyer: $(element).find('.first-time-buyer').text().includes('Yes'),
        creditScore: parseInt($(element).find('.credit-score').text().match(/\d+/)?.[0] || '0'),
        incomeLimits: this.parseIncomeLimits($(element).find('.income-limits').text())
      };
      
      // Extract benefits
      const benefits = [];
      $(element).find('.benefit-item').each((i, item) => {
        benefits.push($(item).text().trim());
      });
      
      // Extract requirements
      const requirements = [];
      $(element).find('.requirement-item').each((i, item) => {
        requirements.push($(item).text().trim());
      });
      
      // Add this program to our list
      programs.push({
        id: `maryland-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        description,
        savings: savingsText,
        eligibility,
        benefits,
        requirements
      });
    });
    
    // If we didn't find any programs with our selectors, this might return sample data
    // In a real implementation, you would adapt the selectors to match the actual HTML structure
    if (programs.length === 0) {
      // Return sample data for testing
      return [
        {
          id: 'maryland-mmp',
          name: 'Maryland Mortgage Program (MMP)',
          description: 'A statewide homebuyer assistance program with down payment assistance options.',
          savings: 'Down payment assistance up to $5,000 or 3% of the purchase price as a zero-interest deferred loan.',
          eligibility: {
            firstTimeBuyer: true,
            creditScore: 640,
            incomeLimits: {
              1: 185640,
              2: 185640,
              3: 216580,
              4: 216580,
              5: 216580
            }
          },
          benefits: [
            'Competitive interest rates',
            'Down payment and closing cost assistance',
            'Tax credit available (Maryland HomeCredit)',
            'Potential student debt relief through SmartBuy initiative'
          ],
          requirements: [
            'Must be a first-time homebuyer (or not owned in the past 3 years)',
            'Credit score of 640 or higher',
            'Must occupy the home as primary residence',
            'Must meet income and purchase price limits',
            'Must complete homebuyer education'
          ]
        },
        {
          id: 'maryland-smartbuy',
          name: 'Maryland SmartBuy 3.0',
          description: 'Provides student debt relief plus down payment assistance for homebuyers with educational debt.',
          savings: 'Up to $20,000 for student debt relief plus down payment assistance',
          eligibility: {
            firstTimeBuyer: false,
            creditScore: 640,
            studentDebt: true,
            incomeLimits: {
              1: 185640,
              2: 185640,
              3: 216580,
              4: 216580,
              5: 216580
            }
          },
          benefits: [
            'Up to $20,000 for student debt relief',
            'Additional down payment assistance available',
            'Student debt must be completely paid off at closing'
          ],
          requirements: [
            'Must have existing student debt',
            'Must use a Maryland Mortgage Program first mortgage',
            'Student debt must be completely paid off at closing',
            'Must meet standard Maryland Mortgage Program requirements'
          ]
        }
      ];
    }
    
    return programs;
  }
  
  /**
   * Scrape Montgomery County HOC website
   */
  async scrapeMontgomeryHOC(source) {
    const response = await axios.get(source.url);
    const $ = cheerio.load(response.data);
    const programs = [];
    
    // Example scraping logic for Montgomery HOC
    // (In a real implementation, adapt to the actual website structure)
    
    // Return sample data for testing
    return [
      {
        id: 'montgomery-hoc-mpp',
        name: 'HOC Mortgage Purchase Program (MPP)',
        description: 'A first-time buyer loan program that helps purchasers in Montgomery County with multiple financing options.',
        savings: 'Competitive mortgage financing for first-time buyers',
        eligibility: {
          firstTimeBuyer: true,
          creditScore: 640,
          incomeLimits: {
            1: 185640,
            2: 185640,
            3: 216580,
            4: 216580,
            5: 216580
          }
        },
        benefits: [
          'FHA and Conventional loan options through Fannie Mae and Freddie Mac',
          'Compatible with down payment assistance programs',
          'Competitive interest rates',
          'Property must be in Montgomery County'
        ],
        requirements: [
          'Must not have owned real estate in the past three years',
          'At least one borrower must complete a homebuyer education class',
          'Minimum credit score of 640',
          'Must meet income limits based on household size',
          'Property must be located in Montgomery County'
        ]
      },
      {
        id: 'montgomery-hoc-dpa',
        name: 'HOC 3% Down Payment Assistance',
        description: 'Provides 3% of sales price as a zero-interest loan that\'s forgiven over time.',
        savings: '3% of purchase price in forgivable down payment assistance',
        eligibility: {
          firstTimeBuyer: true,
          creditScore: 640,
          incomeLimits: {
            1: 185640,
            2: 185640,
            3: 216580,
            4: 216580,
            5: 216580
          }
        },
        benefits: [
          '3% down payment assistance forgivable loan',
          'Forgiven at 20% per year over 5 years of residence',
          'Must be used with HOC Mortgage Purchase Program',
          'No interest or monthly payments'
        ],
        requirements: [
          'Must not have owned real estate in the past three years',
          'Must use HOC Mortgage Purchase Program first mortgage',
          'Minimum credit score of 640',
          'Must meet income limits based on household size',
          'Property must be located in Montgomery County'
        ]
      }
    ];
  }
  
  /**
   * Scrape Prince George's County website
   */
  async scrapePrinceGeorges(source) {
    const response = await axios.get(source.url);
    const $ = cheerio.load(response.data);
    const programs = [];
    
    // Example scraping logic
    // Return sample data for testing
    return [
      {
        id: 'pg-pathway-to-purchase',
        name: 'Prince George\'s County Pathway to Purchase',
        description: 'Down payment and closing cost assistance for first-time homebuyers purchasing in Prince George\'s County.',
        savings: 'Up to $10,000 in down payment assistance as a 0% interest deferred loan.',
        eligibility: {
          firstTimeBuyer: true,
          creditScore: 640,
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
        ]
      }
    ];
  }
  
  /**
   * Helper function to parse income limits text into structured data
   */
  parseIncomeLimits(incomeText) {
    // This would parse text like "1 person: $75,000, 2 people: $85,000, ..." into a structure
    const incomeLimits = {};
    
    // Simple regex matching
    const limits = incomeText.match(/(\d+)[^\d]+\$?([\d,]+)/g) || [];
    
    limits.forEach(limit => {
      const match = limit.match(/(\d+)[^\d]+\$?([\d,]+)/);
      if (match) {
        const householdSize = parseInt(match[1]);
        const amount = parseInt(match[2].replace(/,/g, ''));
        incomeLimits[householdSize] = amount;
      }
    });
    
    return incomeLimits;
  }
}

module.exports = HousingProgramScraper;