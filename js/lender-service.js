// Lender Service for real-time mortgage program data
class LenderService {
    // APIs to integrate with
    static APIS = {
        FANNIE_MAE: 'https://api.fanniemae.com/v1',
        FREDDIE_MAC: 'https://api.freddiemac.com/v1',
        FHA: 'https://api.fha.gov/v1',
        MD_MORTGAGE: 'https://api.mmp.maryland.gov/v1'
    };

    // Add error boundary and reconnection configuration
    static RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Increasing delays in milliseconds
    static MAX_RECONNECT_ATTEMPTS = 5;
    static reconnectAttempts = new Map();
    static connectionStatus = new Map();

    // Initialize WebSocket connections
    static initializeWebSockets() {
        this.sockets = {
            FANNIE_MAE: new WebSocket('wss://ws.fanniemae.com/v1'),
            FREDDIE_MAC: new WebSocket('wss://ws.freddiemac.com/v1'),
            FHA: new WebSocket('wss://ws.fha.gov/v1'),
            MD_MORTGAGE: new WebSocket('wss://ws.mmp.maryland.gov/v1')
        };

        // Reset connection tracking
        this.reconnectAttempts.clear();
        this.connectionStatus.clear();

        Object.entries(this.sockets).forEach(([lender, socket]) => {
            this.connectionStatus.set(lender, 'connecting');
            this.setupWebSocketHandlers(lender, socket);
        });

        // Start monitoring connection health
        this.startConnectionHealthCheck();
    }

    static setupWebSocketHandlers(lender, socket) {
        socket.onopen = () => {
            console.log(`Connected to ${lender} WebSocket`);
            this.connectionStatus.set(lender, 'connected');
            this.reconnectAttempts.set(lender, 0); // Reset attempts on successful connection
            this.subscribeToUpdates(socket, lender);

            // Dispatch connection status event
            this.dispatchConnectionStatus(lender, 'connected');
        };

        socket.onmessage = (event) => {
            this.handleUpdate(JSON.parse(event.data), lender);
        };

        socket.onerror = (error) => {
            console.error(`WebSocket error for ${lender}:`, error);
            this.connectionStatus.set(lender, 'error');
            
            // Dispatch connection status event
            this.dispatchConnectionStatus(lender, 'error');
        };

        socket.onclose = (event) => {
            console.log(`${lender} WebSocket connection closed`, event);
            this.connectionStatus.set(lender, 'disconnected');
            this.handleReconnection(lender);

            // Dispatch connection status event
            this.dispatchConnectionStatus(lender, 'disconnected');
        };
    }

    static handleReconnection(lender) {
        const attempts = this.reconnectAttempts.get(lender) || 0;
        
        if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
            console.warn(`Max reconnection attempts reached for ${lender}`);
            this.dispatchConnectionStatus(lender, 'failed');
            return;
        }

        const delay = this.RECONNECT_DELAYS[Math.min(attempts, this.RECONNECT_DELAYS.length - 1)];
        this.reconnectAttempts.set(lender, attempts + 1);

        console.log(`Attempting to reconnect to ${lender} in ${delay}ms (attempt ${attempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);
        
        setTimeout(() => {
            if (this.connectionStatus.get(lender) !== 'connected') {
                this.sockets[lender] = new WebSocket(this.getWebSocketUrl(lender));
                this.setupWebSocketHandlers(lender, this.sockets[lender]);
            }
        }, delay);
    }

    static startConnectionHealthCheck() {
        setInterval(() => {
            Object.entries(this.sockets).forEach(([lender, socket]) => {
                if (socket.readyState === WebSocket.OPEN) {
                    // Send ping to check connection
                    try {
                        socket.send(JSON.stringify({ type: 'ping' }));
                    } catch (error) {
                        console.warn(`Failed to ping ${lender}:`, error);
                        this.handleReconnection(lender);
                    }
                }
            });
        }, 30000); // Check every 30 seconds
    }

    static dispatchConnectionStatus(lender, status) {
        const event = new CustomEvent('lender-connection-status', {
            detail: { lender, status }
        });
        window.dispatchEvent(event);

        // If all connections fail, trigger fallback
        if (status === 'failed') {
            const allFailed = Object.keys(this.sockets).every(
                l => this.connectionStatus.get(l) === 'failed'
            );
            
            if (allFailed) {
                console.warn('All WebSocket connections failed, switching to fallback mode');
                this.enableFallbackMode();
            }
        }
    }

    static enableFallbackMode() {
        // Stop WebSocket reconnection attempts
        this.reconnectAttempts.clear();
        
        // Switch to polling fallback
        this.startPollingFallback();
    }

    static startPollingFallback() {
        // Poll every minute for updates
        setInterval(async () => {
            try {
                const programs = await this.getFallbackData();
                if (programs) {
                    programs.forEach(program => {
                        this.handleUpdate({
                            type: 'program_update',
                            programId: program.id,
                            program
                        }, 'fallback');
                    });
                }
            } catch (error) {
                console.error('Polling fallback error:', error);
            }
        }, 60000);
    }

    // Subscribe to relevant update channels
    static subscribeToUpdates(socket, lender) {
        const subscriptions = {
            rates: true,
            programs: true,
            eligibility: true
        };
        
        socket.send(JSON.stringify({
            type: 'subscribe',
            channels: subscriptions,
            lender: lender
        }));
    }

    // Handle incoming updates
    static handleUpdate(data, lender) {
        switch (data.type) {
            case 'rate_update':
                this.handleRateUpdate(data, lender);
                break;
            case 'program_update':
                this.handleProgramUpdate(data, lender);
                break;
            case 'eligibility_update':
                this.handleEligibilityUpdate(data, lender);
                break;
            default:
                console.warn('Unknown update type:', data.type);
        }

        // Dispatch event for UI updates
        const event = new CustomEvent('lender-update', { 
            detail: { data, lender } 
        });
        window.dispatchEvent(event);
    }

    // Add rate history tracking
    static rateHistory = new Map();
    
    // Maximum history entries to keep per program
    static MAX_HISTORY_ENTRIES = 100;

    // Handle rate updates
    static handleRateUpdate(data, lender) {
        const program = this.findProgram(data.programId);
        if (program) {
            const timestamp = new Date().toISOString();
            
            // Update current rate
            program.rates = {
                ...program.rates,
                current: data.rate,
                lastUpdated: timestamp
            };

            // Track rate history
            if (!this.rateHistory.has(data.programId)) {
                this.rateHistory.set(data.programId, []);
            }

            const history = this.rateHistory.get(data.programId);
            history.push({
                rate: data.rate,
                timestamp,
                lender
            });

            // Keep history size manageable
            if (history.length > this.MAX_HISTORY_ENTRIES) {
                history.shift();
            }

            // Calculate rate trends
            program.rates.trend = this.calculateRateTrend(data.programId);
        }
    }

    // Calculate rate trends
    static calculateRateTrend(programId) {
        const history = this.rateHistory.get(programId);
        if (!history || history.length < 2) return 'stable';

        const recent = history[history.length - 1].rate;
        const previous = history[history.length - 2].rate;
        
        const difference = recent - previous;
        if (Math.abs(difference) < 0.001) return 'stable';
        return difference > 0 ? 'increasing' : 'decreasing';
    }

    // Get rate history for a program
    static getRateHistory(programId, period = '24h') {
        const history = this.rateHistory.get(programId) || [];
        const now = new Date();
        const periodMs = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        }[period] || 24 * 60 * 60 * 1000;

        return history.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return (now - entryDate) <= periodMs;
        });
    }

    // Handle program updates
    static handleProgramUpdate(data, lender) {
        const program = this.findProgram(data.programId);
        if (program) {
            Object.assign(program, this.standardizeProgram(data.program));
        } else {
            this.programs.push(this.standardizeProgram(data.program));
        }
    }

    // Handle eligibility criteria updates
    static handleEligibilityUpdate(data, lender) {
        const program = this.findProgram(data.programId);
        if (program) {
            program.eligibility = {
                ...program.eligibility,
                ...data.eligibility,
                lastUpdated: new Date().toISOString()
            };
        }
    }

    // Helper to find program by ID
    static findProgram(programId) {
        return this.programs.find(p => p.id === programId);
    }

    // Initialize program cache
    static programs = [];

    // Fetch all available programs from multiple sources
    static async getAllPrograms(criteria) {
        try {
            const responses = await Promise.all([
                this.getFannieMaePrograms(criteria),
                this.getFreddieMacPrograms(criteria),
                this.getFHAPrograms(criteria),
                this.getMarylandPrograms(criteria)
            ]);

            return this.consolidatePrograms(responses);
        } catch (error) {
            console.warn('Error fetching from primary sources, attempting fallback:', error);
            return this.getFallbackData(criteria);
        }
    }

    // Fallback mechanism when real-time sources are unavailable
    static async getFallbackData(criteria) {
        try {
            // Try to fetch from backup API endpoints
            const responses = await Promise.allSettled([
                fetch('https://backup1.fanniemae.com/programs'),
                fetch('https://backup1.freddiemac.com/programs'),
                fetch('https://backup1.fha.gov/programs'),
                fetch('https://backup1.mmp.maryland.gov/programs')
            ]);

            const successfulResponses = responses
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value)
                .filter(r => r.ok);

            if (successfulResponses.length > 0) {
                const data = await Promise.all(
                    successfulResponses.map(r => r.json())
                );
                return this.consolidatePrograms(data);
            }

            // If backup APIs fail, use cached data with warning
            if (this.programs.length > 0) {
                console.warn('Using cached program data - real-time updates unavailable');
                return this.programs;
            }

            // Last resort: use local static data
            console.warn('Using local static program data');
            const staticPrograms = await import('../data/program-data.json');
            return staticPrograms;

        } catch (error) {
            console.error('Error fetching fallback data:', error);
            throw new Error('Unable to fetch program data from any source');
        }
    }

    // Get programs from Fannie Mae
    static async getFannieMaePrograms(criteria) {
        // Implementation for Fannie Mae API
        // Will be implemented when API access is granted
        return [];
    }

    // Get programs from Freddie Mac
    static async getFreddieMacPrograms(criteria) {
        // Implementation for Freddie Mac API
        // Will be implemented when API access is granted
        return [];
    }

    // Get FHA programs
    static async getFHAPrograms(criteria) {
        // Implementation for FHA API
        // Will be implemented when API access is granted
        return [];
    }

    // Get Maryland-specific programs
    static async getMarylandPrograms(criteria) {
        // Implementation for Maryland Mortgage Program API
        // Will be implemented when API access is granted
        return [];
    }

    // Consolidate programs from multiple sources
    static consolidatePrograms(responses) {
        const allPrograms = responses.flat();
        
        // Remove duplicates and standardize format
        return Array.from(new Set(allPrograms.map(p => JSON.stringify(p))))
            .map(p => JSON.parse(p))
            .map(this.standardizeProgram);
    }

    // Standardize program data format
    static standardizeProgram(program) {
        return {
            id: program.id || program.programId,
            name: program.name || program.programName,
            description: program.description,
            eligibility: {
                firstTimeBuyer: program.firstTimeBuyer || program.isFirstTimeBuyer,
                creditScore: program.minimumCreditScore || program.creditScore,
                incomeLimits: program.incomeLimits || program.maxIncome,
                // ... other standardized fields
            },
            rates: program.interestRates || program.rates,
            requirements: program.requirements || program.qualificationCriteria,
            benefits: program.benefits || program.advantages,
            lastUpdated: program.lastUpdated || program.updateDate || new Date().toISOString()
        };
    }

    // Compare rates across different lenders
    static compareRates(programId) {
        const program = this.findProgram(programId);
        if (!program) return null;

        const history = this.getRateHistory(programId, '24h');
        const lenderRates = {};

        // Group rates by lender
        history.forEach(entry => {
            if (!lenderRates[entry.lender]) {
                lenderRates[entry.lender] = [];
            }
            lenderRates[entry.lender].push(entry);
        });

        // Calculate average rates per lender
        const averages = Object.entries(lenderRates).map(([lender, rates]) => {
            const avg = rates.reduce((sum, r) => sum + r.rate, 0) / rates.length;
            return {
                lender,
                averageRate: avg,
                currentRate: rates[rates.length - 1].rate,
                lastUpdated: rates[rates.length - 1].timestamp
            };
        });

        return {
            programId,
            programName: program.name,
            lenderComparison: averages,
            bestRate: Math.min(...averages.map(a => a.currentRate)),
            bestLender: averages.reduce((best, current) => 
                current.currentRate < (best?.currentRate ?? Infinity) ? current : best
            , null)?.lender
        };
    }
}

export default LenderService;