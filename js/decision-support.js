// Decision support engine
class DecisionSupportEngine {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.decisions = [];
    }

    // Analyze conditions and provide recommendations
    analyzeConditions(point) {
        const evaporation = parseFloat(point.evaporation);
        const humidity = parseFloat(point.humidity);
        const temperature = parseFloat(point.airTemperature);
        const wind = parseFloat(point.windSpeed);
        const condensationIndex = point.condensationIndex;

        // Determine status based on multiple factors
        let status = 'STABLE';
        let explanation = [];
        let recommendation = [];

        // Check evaporation levels
        if (evaporation >= Config.EVAPORATION_THRESHOLDS.CRITICAL) {
            status = 'CRITICAL';
            explanation.push('High evaporation rates detected');
        } else if (evaporation >= Config.EVAPORATION_THRESHOLDS.HIGH) {
            status = 'WARNING';
            explanation.push('Elevated evaporation rates');
        }

        // Check condensation potential
        if (condensationIndex >= 76) {
            explanation.push('High condensation potential');
            recommendation.push('Consider atmospheric water recovery technologies');
        } else if (condensationIndex >= 51) {
            explanation.push('Moderate to high condensation potential');
            recommendation.push('Evaluate water recovery opportunities');
        }

        // Check humidity conditions
        if (humidity > 70) {
            explanation.push('High humidity levels favorable for condensation');
        } else if (humidity > 50) {
            explanation.push('Moderate humidity levels');
        }

        // Check temperature
        if (temperature > 25) {
            explanation.push('Warm temperatures may increase evaporation');
        } else if (temperature < 15) {
            explanation.push('Cool temperatures favorable for condensation');
        }

        // Check wind conditions
        if (wind > 10) {
            explanation.push('High wind speeds may reduce condensation efficiency');
        }

        // Technology recommendations based on conditions
        const techRecommendation = this.getTechnologyRecommendation({
            humidity: humidity,
            temperature: temperature,
            wind: wind,
            condensationIndex: condensationIndex
        });

        return {
            status: status,
            explanation: explanation,
            recommendation: recommendation,
            technologyRecommendation: techRecommendation,
            riskLevel: point.riskLevel
        };
    }

    // Get technology recommendation based on conditions
    getTechnologyRecommendation(conditions) {
        const { humidity, wind, condensationIndex } = conditions;
        
        if (humidity > 70 && wind >= 3 && wind <= 12 && condensationIndex > 60) {
            return {
                technology: 'Fog Collector',
                reason: 'High humidity with moderate wind speeds and good condensation potential',
                confidence: 'High'
            };
        } else if (humidity > 60 && wind <= 5 && condensationIndex > 65) {
            return {
                technology: 'Radiative Cooling',
                reason: 'High humidity with low wind and excellent condensation potential',
                confidence: 'High'
            };
        } else if (humidity > 65 && condensationIndex > 70) {
            return {
                technology: 'Ionization System',
                reason: 'High humidity and excellent condensation potential',
                confidence: 'Medium'
            };
        } else {
            return {
                technology: 'Assessment Needed',
                reason: 'Conditions require further evaluation',
                confidence: 'Low'
            };
        }
    }

    // Get status color
    getStatusColor(status) {
        switch(status) {
            case 'CRITICAL': return '#dc3545';
            case 'WARNING': return '#ffc107';
            case 'STABLE': return '#28a745';
            default: return '#6c757d';
        }
    }

    // Get status icon
    getStatusIcon(status) {
        switch(status) {
            case 'CRITICAL': return '🚨';
            case 'WARNING': return '⚠️';
            case 'STABLE': return '✅';
            default: return 'ℹ️';
        }
    }

    // Generate comprehensive report for a point
    generateReport(point) {
        const analysis = this.analyzeConditions(point);
        
        return {
            ...analysis,
            point: point,
            timestamp: new Date().toISOString(),
            methodology: 'Rule-based Decision Support Engine'
        };
    }

    // Analyze all points in a dataset
    async analyzeDataset(dataset) {
        this.decisions = dataset.map(point => ({
            pointId: point.id,
            ...this.analyzeConditions(point)
        }));

        return this.decisions;
    }

    // Get summary of decisions
    getSummary() {
        if (this.decisions.length === 0) return null;

        const statusCounts = {
            STABLE: 0,
            WARNING: 0,
            CRITICAL: 0
        };

        this.decisions.forEach(decision => {
            statusCounts[decision.status]++;
        });

        const criticalPercentage = ((statusCounts.CRITICAL / this.decisions.length) * 100).toFixed(2);
        const warningPercentage = ((statusCounts.WARNING / this.decisions.length) * 100).toFixed(2);

        return {
            totalPoints: this.decisions.length,
            statusCounts: statusCounts,
            criticalPercentage: criticalPercentage,
            warningPercentage: warningPercentage,
            recommendations: this.getTechnologyRecommendationSummary()
        };
    }

    // Get technology recommendation summary
    getTechnologyRecommendationSummary() {
        const techCounts = {};
        
        this.decisions.forEach(decision => {
            const tech = decision.technologyRecommendation.technology;
            techCounts[tech] = (techCounts[tech] || 0) + 1;
        });

        return techCounts;
    }

    // Render decision support panel
    renderPanel(containerId = 'decision-support-panel') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Get a sample analysis for demonstration
        const samplePoint = {
            evaporation: 12.5,
            humidity: 75,
            airTemperature: 22,
            windSpeed: 4.2,
            condensationIndex: 82,
            riskLevel: 'HIGH'
        };

        const sampleAnalysis = this.analyzeConditions(samplePoint);

        container.innerHTML = `
            <div class="decision-support-content">
                <h4>AI-Assisted Decision Support</h4>
                
                <div class="current-status">
                    <h5>Current Status: 
                        <span style="color: ${this.getStatusColor(sampleAnalysis.status)};">
                            ${this.getStatusIcon(sampleAnalysis.status)} ${sampleAnalysis.status}
                        </span>
                    </h5>
                </div>

                <div class="explanation-section">
                    <h6>Analysis:</h6>
                    <ul>
                        ${sampleAnalysis.explanation.map(exp => `<li>${exp}</li>`).join('')}
                    </ul>
                </div>

                <div class="recommendation-section">
                    <h6>Recommendations:</h6>
                    <ul>
                        ${sampleAnalysis.recommendation.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>

                <div class="technology-recommendation">
                    <h6>Technology Suggestion:</h6>
                    <div class="tech-suggestion">
                        <strong>${sampleAnalysis.technologyRecommendation.technology}</strong>
                        <br>
                        <small>Reason: ${sampleAnalysis.technologyRecommendation.reason}</small>
                        <br>
                        <small>Confidence: ${sampleAnalysis.technologyRecommendation.confidence}</small>
                    </div>
                </div>

                <div class="disclaimer">
                    <small><em>Rule-based Decision Support Engine - Prototype Implementation</em></small>
                </div>
            </div>
        `;
    }

    // Refresh decision support
    async refresh() {
        this.renderPanel();
    }
}

// Export for browser usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DecisionSupportEngine;
} else {
    window.DecisionSupportEngine = DecisionSupportEngine;
          }
