// Main application class
class CaspianWaterRecoveryApp {
    constructor() {
        this.dataManager = null;
        this.mapManager = null;
        this.hotspotDetector = null;
        this.condensationCalculator = null;
        this.decisionEngine = null;
        this.technologySelector = null;
        this.economicModeler = null;
        this.weatherMonitor = null;
        this.analyticsManager = null;
        
        this.init();
    }

    // Initialize the application
    async init() {
        try {
            // Initialize all modules (using window.* because no exports)
            this.dataManager = new window.DataManager();
            this.hotspotDetector = new window.HotspotDetector(this.dataManager);
            this.condensationCalculator = new window.CondensationIndexCalculator(this.dataManager);
            this.decisionEngine = new window.DecisionSupportEngine(this.dataManager);
            this.technologySelector = new window.TechnologySelector(this.dataManager);
            this.economicModeler = new window.EconomicModeler();
            this.weatherMonitor = new window.WeatherMonitor(this.dataManager);
            this.analyticsManager = new window.AnalyticsManager(this.dataManager);

            // Initialize map after all dependencies are ready
            setTimeout(() => {
                if (typeof window.MapManager !== 'undefined') {
                    this.mapManager = new window.MapManager(this.dataManager);
                    this.mapManager.init();
                } else {
                    console.warn('MapManager not available — using fallback');
                }
            }, 100);

            // Load initial data
            await this.loadData();

            // Render all components
            this.renderAllComponents();

            // Setup event listeners
            this.setupEventListeners();

            // Start periodic updates
            this.startPeriodicUpdates();

            console.log('✅ Caspian Water Recovery App initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing app:', error);
            // Show friendly error in UI
            const errorEl = document.getElementById('error-display');
            if (errorEl) {
                errorEl.innerHTML = `
                    <div class="error-message">
                        <strong>Initialization Error:</strong> ${error.message || 'Unknown error'}
                        <button onclick="document.getElementById(\'error-display\').innerHTML=\'\'" 
                                style="float: right; background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                            Close
                        </button>
                    </div>
                `;
            }
        }
    }

    // Load initial data
    async loadData() {
        try {
            // Load all necessary data
            await this.dataManager.loadCaspianGrid();
            await this.hotspotDetector.detectHotspots();
            await this.condensationCalculator.analyzePotential();
            
            console.log('✅ Initial data loaded');
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
        }
    }

    // Render all components
    renderAllComponents() {
        // Render hotspots
        if (this.hotspotDetector) {
            this.hotspotDetector.renderHotspots();
        } else {
            document.getElementById('hotspots-container').innerHTML = '<div class="error-message">HotspotDetector not initialized</div>';
        }

        // Render condensation analysis
        if (this.condensationCalculator) {
            this.condensationCalculator.renderAnalysis();
        } else {
            document.getElementById('condensation-analysis').innerHTML = '<div class="error-message">Condensation calculator not initialized</div>';
        }

        // Render decision support
        if (this.decisionEngine) {
            this.decisionEngine.renderPanel();
        } else {
            document.getElementById('decision-support-panel').innerHTML = '<div class="error-message">Decision engine not initialized</div>';
        }

        // Render technology comparison
        if (this.technologySelector) {
            this.technologySelector.renderComparison();
        } else {
            document.getElementById('technology-comparison').innerHTML = '<div class="error-message">Technology selector not initialized</div>';
        }

        // Render economic model
        if (this.economicModeler) {
            this.economicModeler.renderModel();
        } else {
            document.getElementById('economic-model').innerHTML = '<div class="error-message">Economic model not initialized</div>';
        }

        // Render weather monitor
        if (this.weatherMonitor) {
            this.weatherMonitor.renderWeatherCards();
        } else {
            document.getElementById('weather-monitor').innerHTML = '<div class="error-message">Weather monitor not initialized</div>';
        }

        // Render analytics
        if (this.analyticsManager) {
            this.analyticsManager.renderStats();
        } else {
            document.getElementById('analytics-stats').innerHTML = '<div class="error-message">Analytics manager not initialized</div>';
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // View controls — DOM is already ready by the time init() finishes
        // loading data, so call directly instead of waiting for
        // DOMContentLoaded (which has already fired by then).
        this.setupViewControls();
    }

    // Setup view controls
    setupViewControls() {
        // Kazakhstan focus button
        const kazakhstanBtn = document.getElementById('kazakhstan-focus');
        if (kazakhstanBtn) {
            kazakhstanBtn.addEventListener('click', () => {
                this.setKazakhstanFocus();
            });
        }

        // Full Caspian button
        const fullCaspianBtn = document.getElementById('full-caspian');
        if (fullCaspianBtn) {
            fullCaspianBtn.addEventListener('click', () => {
                this.setFullCaspianView();
            });
        }

        // Marker mode toggles
        const heatmapToggle = document.getElementById('heatmap-toggle');
        const markersToggle = document.getElementById('markers-toggle');

        if (heatmapToggle) {
            heatmapToggle.addEventListener('click', () => {
                this.setMarkerMode('heatmap');
            });
        }

        if (markersToggle) {
            markersToggle.addEventListener('click', () => {
                this.setMarkerMode('animated');
            });
        }
    }

    // Set Kazakhstan focus
    setKazakhstanFocus() {
        if (this.mapManager) {
            this.mapManager.setKazakhstanFocus();
        }
    }

    // Set full Caspian view
    setFullCaspianView() {
        if (this.mapManager) {
            this.mapManager.setFullCaspianView();
        }
    }

    // Set marker mode
    setMarkerMode(mode) {
        if (this.mapManager) {
            this.mapManager.toggleMarkerMode(mode);
        }
        
        // Update UI
        const heatmapBtn = document.getElementById('heatmap-toggle');
        const markersBtn = document.getElementById('markers-toggle');
        
        if (heatmapBtn && markersBtn) {
            if (mode === 'heatmap') {
                heatmapBtn.classList.add('active');
                markersBtn.classList.remove('active');
            } else {
                heatmapBtn.classList.remove('active');
                markersBtn.classList.add('active');
            }
        }
    }

    // Go to hotspot
    goToHotspot(index) {
        if (this.hotspotDetector) {
            const hotspot = this.hotspotDetector.getHotspotByIndex(index);
            if (hotspot && this.mapManager) {
                this.mapManager.flyTo([hotspot.longitude, hotspot.latitude]);
                
                // Update technology comparison for this location
                if (this.technologySelector) {
                    this.technologySelector.refresh(hotspot);
                }
            }
        }
    }

    // Fly to weather city
    flyToWeatherCity(cityName) {
        if (this.weatherMonitor) {
            this.weatherMonitor.flyToCity(cityName);
        }
    }

    // Set economic scenario
    setEconomicScenario(scenario) {
        if (this.economicModeler) {
            this.economicModeler.setScenario(scenario);
            this.economicModeler.renderModel();
        }
    }

    // Refresh all data
    async refreshAll() {
        try {
            // Reload data
            await this.loadData();
            
            // Refresh all components
            if (this.hotspotDetector) this.hotspotDetector.refresh();
            if (this.condensationCalculator) this.condensationCalculator.refresh();
            if (this.decisionEngine) this.decisionEngine.refresh();
            if (this.technologySelector) this.technologySelector.refresh();
            if (this.economicModeler) this.economicModeler.renderModel();
            if (this.weatherMonitor) this.weatherMonitor.refresh();
            if (this.analyticsManager) this.analyticsManager.refresh();
            
            // Update map
            if (this.mapManager) {
                this.mapManager.updateMapData();
            }
            
            console.log('✅ All data refreshed');
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
        }
    }

    // Start periodic updates
    startPeriodicUpdates() {
        // Refresh data every 5 minutes (for demo purposes)
        setInterval(() => {
            this.refreshAll();
        }, 300000); // 5 minutes
    }

    // Export data
    exportData() {
        const exportData = {
            hotspots: this.hotspotDetector?.topHotspots || [],
            analytics: this.analyticsManager?.analyticsData || null,
            economicModel: this.economicModeler?.getResults() || null,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `caspian-water-recovery-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Show about modal
    showAboutModal() {
        const modal = document.getElementById('about-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // Close modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Get system status
    getSystemStatus() {
        return {
            dataLoaded: this.dataManager?.gridPoints?.length > 0 || false,
            mapReady: !!this.mapManager?.map,
            hotspotsDetected: this.hotspotDetector?.topHotspots?.length > 0 || false,
            condensationAnalyzed: this.condensationCalculator?.indexes?.length > 0 || false,
            timestamp: new Date().toISOString()
        };
    }

    // Handle errors gracefully
    handleError(error, context = '') {
        console.error(`❌ Error in ${context}:`, error);
        
        // Show user-friendly error message
        const errorContainer = document.getElementById('error-display');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message">
                    <strong>Error:</strong> ${error.message || 'An error occurred'}
                    <button onclick="document.getElementById('error-display').innerHTML=''" 
                            style="float: right; background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                        Close
                    </button>
                </div>
            `;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CaspianWaterRecoveryApp();
});

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};
            
