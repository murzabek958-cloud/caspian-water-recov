// Analytics and statistics module
class AnalyticsManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.analyticsData = null;
    }

    // Perform comprehensive analytics
    async performAnalytics() {
        try {
            // Get all data
            const allData = await this.dataManager.getEvaporationData();
            const kazakhstanData = await this.dataManager.getEvaporationData('kazakhstan');
            const hotspots = await this.dataManager.getHotspots();
            
            // Calculate statistics
            const overallStats = this.calculateOverallStats(allData);
            const kazakhstanStats = await this.dataManager.getKazakhstanStats();
            
            this.analyticsData = {
                overallStats,
                kazakhstanStats,
                hotspots,
                totalPoints: allData.length,
                lastUpdated: new Date().toISOString()
            };
            
            return this.analyticsData;
        } catch (error) {
            console.error('Error performing analytics:', error);
            return null;
        }
    }

    // Calculate overall statistics
    calculateOverallStats(data) {
        if (data.length === 0) {
            return {
                averageEvaporation: 0,
                averageTemperature: 0,
                averageHumidity: 0,
                averageWind: 0,
                maxEvaporation: 0,
                minEvaporation: 0,
                riskDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
            };
        }

        const stats = {
            averageEvaporation: 0,
            averageTemperature: 0,
            averageHumidity: 0,
            averageWind: 0,
            maxEvaporation: 0,
            minEvaporation: Infinity,
            riskDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
        };

        // Calculate averages and extremes
        stats.averageEvaporation = data.reduce((sum, p) => sum + parseFloat(p.evaporation), 0) / data.length;
        stats.averageTemperature = data.reduce((sum, p) => sum + parseFloat(p.airTemperature), 0) / data.length;
        stats.averageHumidity = data.reduce((sum, p) => sum + parseFloat(p.humidity), 0) / data.length;
        stats.averageWind = data.reduce((sum, p) => sum + parseFloat(p.windSpeed), 0) / data.length;

        // Find max and min evaporation
        data.forEach(p => {
            const evap = parseFloat(p.evaporation);
            if (evap > stats.maxEvaporation) stats.maxEvaporation = evap;
            if (evap < stats.minEvaporation) stats.minEvaporation = evap;
        });

        // Count risk distribution
        data.forEach(p => {
            stats.riskDistribution[p.riskLevel]++;
        });

        return stats;
    }

    // Render statistics to DOM
    renderStats(containerId = 'analytics-stats') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!this.analyticsData) {
            container.innerHTML = '<div class="loading">Calculating analytics...</div>';
            this.performAnalytics().then(() => {
                this.renderStats(containerId);
            });
            return;
        }

        const { overallStats, kazakhstanStats } = this.analyticsData;
        
        container.innerHTML = `
            <div class="analytics-content">
                <h4>Regional Analytics</h4>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.averageEvaporation.toFixed(2)}</div>
                        <div class="stat-label">Avg Evaporation (mm/day)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.averageTemperature.toFixed(1)}</div>
                        <div class="stat-label">Avg Temp (°C)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.averageHumidity.toFixed(1)}</div>
                        <div class="stat-label">Avg Humidity (%)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.averageWind.toFixed(1)}</div>
                        <div class="stat-label">Avg Wind (m/s)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.maxEvaporation.toFixed(2)}</div>
                        <div class="stat-label">Max Evaporation</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.totalPoints}</div>
                        <div class="stat-label">Monitoring Points</div>
                    </div>
                </div>

                <h5>Kazakhstan Sector Statistics</h5>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${kazakhstanStats.averageEvaporation.toFixed(2)}</div>
                        <div class="stat-label">Avg Evaporation</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${kazakhstanStats.averageAirTemperature.toFixed(1)}</div>
                        <div class="stat-label">Avg Air Temp</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${kazakhstanStats.averageSST.toFixed(1)}</div>
                        <div class="stat-label">Avg SST</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${kazakhstanStats.criticalPoints}</div>
                        <div class="stat-label">Critical Points</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${kazakhstanStats.highRiskPoints}</div>
                        <div class="stat-label">High Risk Points</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${kazakhstanStats.highestEvaporationPoint ? kazakhstanStats.highestEvaporationPoint.evaporation : 'N/A'}</div>
                        <div class="stat-label">Highest Evaporation</div>
                    </div>
                </div>

                <div class="risk-distribution">
                    <h5>Risk Level Distribution:</h5>
                    <div class="distribution-bars">
                        <div class="bar-item">
                            <span class="bar-label">Low:</span>
                            <div class="bar-container">
                                <div class="bar low" style="width: ${(overallStats.riskDistribution.LOW / this.analyticsData.totalPoints * 100)}%"></div>
                            </div>
                            <span class="bar-count">${overallStats.riskDistribution.LOW}</span>
                        </div>
                        <div class="bar-item">
                            <span class="bar-label">Medium:</span>
                            <div class="bar-container">
                                <div class="bar medium" style="width: ${(overallStats.riskDistribution.MEDIUM / this.analyticsData.totalPoints * 100)}%"></div>
                            </div>
                            <span class="bar-count">${overallStats.riskDistribution.MEDIUM}</span>
                        </div>
                        <div class="bar-item">
                            <span class="bar-label">High:</span>
                            <div class="bar-container">
                                <div class="bar high" style="width: ${(overallStats.riskDistribution.HIGH / this.analyticsData.totalPoints * 100)}%"></div>
                            </div>
                            <span class="bar-count">${overallStats.riskDistribution.HIGH}</span>
                        </div>
                        <div class="bar-item">
                            <span class="bar-label">Critical:</span>
                            <div class="bar-container">
                                <div class="bar critical" style="width: ${(overallStats.riskDistribution.CRITICAL / this.analyticsData.totalPoints * 100)}%"></div>
                            </div>
                            <span class="bar-count">${overallStats.riskDistribution.CRITICAL}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Export analytics data
    exportAnalytics() {
        if (!this.analyticsData) {
            return null;
        }

        const exportData = {
            ...this.analyticsData,
            exportDate: new Date().toISOString(),
            methodology: 'Caspian Water Recovery Analytics Suite',
            disclaimer: 'Data includes estimated/modelled values for demonstration purposes'
        };

        return JSON.stringify(exportData, null, 2);
    }

    // Refresh analytics
    async refresh() {
        await this.performAnalytics();
        this.renderStats();
    }

    // Get time series data (for future expansion)
    getTimeSeriesData() {
        // Placeholder for future time-series analytics
        return [];
    }

    // Get correlation analysis
    getCorrelationAnalysis() {
        // Placeholder for correlation between different parameters
        return {
            evaporationVsHumidity: 0.65,
            evaporationVsTemp: 0.72,
            humidityVsCondensation: 0.81
        };
    }
}

// Export for browser usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsManager;
} else {
    window.AnalyticsManager = AnalyticsManager;
                            }
