// Condensation potential index calculator
class CondensationIndexCalculator {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.indexes = [];
    }

    // Calculate condensation potential index
    calculateIndex(humidity, temperature, windSpeed, evaporation) {
        // Weighted scoring for condensation potential
        const humidityScore = (parseFloat(humidity) / 100) * 40; // 40% weight
        const tempScore = this.calculateTemperatureSuitability(parseFloat(temperature)); // 25% weight
        const windScore = this.calculateWindSuitability(parseFloat(windSpeed)); // 20% weight
        const evaporationScore = Math.min(15, parseFloat(evaporation) / 2); // 15% weight
        
        const total = humidityScore + tempScore + windScore + evaporationScore;
        return Math.round(Math.min(100, Math.max(0, total)));
    }

    // Calculate temperature suitability score
    calculateTemperatureSuitability(temp) {
        // Optimal range around 15-25°C for condensation
        const optimalRange = [15, 25];
        if (temp >= optimalRange[0] && temp <= optimalRange[1]) {
            return 25; // Maximum score for optimal temperature
        } else {
            // Score decreases as temperature moves away from optimal
            const distanceFromOptimal = Math.min(
                Math.abs(temp - optimalRange[0]),
                Math.abs(temp - optimalRange[1])
            );
            return Math.max(0, 25 - (distanceFromOptimal * 2));
        }
    }

    // Calculate wind suitability score
    calculateWindSuitability(wind) {
        // Lower wind speeds are better for condensation
        // Max score at 0 wind, decreasing to 0 at 15 m/s
        return Math.max(0, 20 - (wind * 1.33));
    }

    // Get condensation category
    getCategory(index) {
        const categories = Config.CONDENSATION_CATEGORIES;
        
        if (index >= categories.VERY_HIGH.min) return categories.VERY_HIGH.label;
        if (index >= categories.HIGH.min) return categories.HIGH.label;
        if (index >= categories.MODERATE.min) return categories.MODERATE.label;
        return categories.LOW.label;
    }

    // Get category color
    getCategoryColor(index) {
        const category = this.getCategory(index);
        switch(category) {
            case 'LOW': return '#28a745';
            case 'MODERATE': return '#ffc107';
            case 'HIGH': return '#fd7e14';
            case 'VERY HIGH': return '#dc3545';
            default: return '#6c757d';
        }
    }

    // Analyze condensation potential across all data points
    async analyzePotential() {
        try {
            const allPoints = await this.dataManager.getEvaporationData();
            this.indexes = allPoints.map(point => ({
                ...point,
                condensationIndex: this.calculateIndex(
                    point.humidity,
                    point.airTemperature,
                    point.windSpeed,
                    point.evaporation
                )
            }));

            return this.indexes;
        } catch (error) {
            console.error('Error analyzing condensation potential:', error);
            return [];
        }
    }

    // Get summary statistics
    getSummary() {
        if (this.indexes.length === 0) return null;

        const avgIndex = this.indexes.reduce((sum, idx) => sum + idx.condensationIndex, 0) / this.indexes.length;
        const maxIndex = Math.max(...this.indexes.map(idx => idx.condensationIndex));
        const minIndex = Math.min(...this.indexes.map(idx => idx.condensationIndex));

        // Count by category
        const counts = {
            low: 0,
            moderate: 0,
            high: 0,
            veryHigh: 0
        };

        this.indexes.forEach(idx => {
            const category = this.getCategory(idx.condensationIndex);
            switch(category) {
                case 'LOW': counts.low++; break;
                case 'MODERATE': counts.moderate++; break;
                case 'HIGH': counts.high++; break;
                case 'VERY HIGH': counts.veryHigh++; break;
            }
        });

        return {
            average: avgIndex.toFixed(2),
            maximum: maxIndex,
            minimum: minIndex,
            counts: counts,
            totalPoints: this.indexes.length
        };
    }

    // Render condensation analysis to DOM
    renderAnalysis(containerId = 'condensation-analysis') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const summary = this.getSummary();
        if (!summary) {
            container.innerHTML = '<div class="loading">Analyzing condensation potential...</div>';
            return;
        }

        container.innerHTML = `
            <div class="condensation-summary">
                <h4>Condensation Potential Analysis</h4>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${summary.average}</div>
                        <div class="stat-label">Avg Index</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${summary.maximum}</div>
                        <div class="stat-label">Max Index</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${summary.totalPoints}</div>
                        <div class="stat-label">Total Points</div>
                    </div>
                </div>
                
                <div class="category-breakdown">
                    <h5>Category Distribution:</h5>
                    <div class="category-item">
                        <span class="category-label">Low (0-25):</span>
                        <span class="category-count">${summary.counts.low}</span>
                    </div>
                    <div class="category-item">
                        <span class="category-label">Moderate (26-50):</span>
                        <span class="category-count">${summary.counts.moderate}</span>
                    </div>
                    <div class="category-item">
                        <span class="category-label">High (51-75):</span>
                        <span class="category-count">${summary.counts.high}</span>
                    </div>
                    <div class="category-item">
                        <span class="category-label">Very High (76-100):</span>
                        <span class="category-count">${summary.counts.veryHigh}</span>
                    </div>
                </div>
                
                <div class="disclaimer">
                    <small><em>Prototype Decision-Support Index based on meteorological conditions</em></small>
                </div>
            </div>
        `;
    }

    // Refresh analysis
    async refresh() {
        await this.analyzePotential();
        this.renderAnalysis();
    }
}
