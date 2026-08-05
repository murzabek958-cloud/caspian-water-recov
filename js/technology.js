// Technology selection module
class TechnologySelector {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.technologies = Config.TECHNOLOGIES;
    }

    // Get all available technologies
    getTechnologies() {
        return this.technologies;
    }

    // Evaluate technology suitability for given conditions
    evaluateTechnologySuitability(technology, conditions) {
        const { humidity, windSpeed, condensationIndex, evaporation } = conditions;
        
        let score = 0;
        let reasons = [];
        
        // Humidity check
        if (humidity >= technology.humidityThreshold) {
            score += 25;
            reasons.push(`✓ Humidity (${humidity}%) ≥ ${technology.humidityThreshold}%`);
        } else {
            score += 10;
            reasons.push(`⚠ Humidity (${humidity}%) < ${technology.humidityThreshold}%`);
        }

        // Wind check
        if (windSpeed >= technology.windMin && windSpeed <= technology.windMax) {
            score += 25;
            reasons.push(`✓ Wind (${windSpeed} m/s) within range ${technology.windMin}-${technology.windMax} m/s`);
        } else {
            score += 5;
            reasons.push(`⚠ Wind (${windSpeed} m/s) outside optimal range ${technology.windMin}-${technology.windMax} m/s`);
        }

        // Condensation potential
        if (condensationIndex >= 60) {
            score += 20;
            reasons.push(`✓ High condensation potential (${condensationIndex}/100)`);
        } else if (condensationIndex >= 40) {
            score += 15;
            reasons.push(`~ Moderate condensation potential (${condensationIndex}/100)`);
        } else {
            score += 5;
            reasons.push(`⚠ Low condensation potential (${condensationIndex}/100)`);
        }

        // Evaporation consideration
        if (evaporation >= 10) {
            score += 20;
            reasons.push(`✓ High evaporation (${evaporation} mm/day) indicates water availability`);
        } else {
            score += 10;
            reasons.push(`~ Moderate evaporation (${evaporation} mm/day)`);
        }

        return {
            technology: technology.name,
            score: Math.round(score),
            reasons: reasons,
            suitability: this.getSuitabilityLevel(score),
            waterYield: technology.waterYield,
            capex: technology.capex,
            opex: technology.opex,
            scalability: technology.scalability
        };
    }

    // Get suitability level based on score
    getSuitabilityLevel(score) {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Poor';
    }

    // Recommend technologies for a specific location
    recommendTechnologiesForLocation(locationData) {
        const conditions = {
            humidity: parseFloat(locationData.humidity),
            windSpeed: parseFloat(locationData.windSpeed),
            condensationIndex: locationData.condensationIndex,
            evaporation: parseFloat(locationData.evaporation)
        };

        return this.technologies.map(tech => 
            this.evaluateTechnologySuitability(tech, conditions)
        ).sort((a, b) => b.score - a.score);
    }

    // Get technology card HTML
    getTechnologyCard(techEvaluation, index = 0) {
        const scoreColor = this.getScoreColor(techEvaluation.score);
        
        return `
            <div class="tech-card">
                <div class="tech-name">${techEvaluation.technology}</div>
                <div class="tech-score" style="color: ${scoreColor}; font-weight: bold;">
                    Suitability Score: ${techEvaluation.score}/100 (${techEvaluation.suitability})
                </div>
                <div class="tech-reasons">
                    <strong>Reasons:</strong>
                    <ul>
                        ${techEvaluation.reasons.map(reason => `<li>${reason}</li>`).join('')}
                    </ul>
                </div>
                <div class="tech-specs">
                    <div><strong>Water Yield:</strong> ${techEvaluation.waterYield}</div>
                    <div><strong>CAPEX:</strong> ${techEvaluation.capex}</div>
                    <div><strong>OPEX:</strong> ${techEvaluation.opex}</div>
                    <div><strong>Scalability:</strong> ${techEvaluation.scalability}</div>
                </div>
            </div>
        `;
    }

    // Get score color
    getScoreColor(score) {
        if (score >= 80) return '#28a745';
        if (score >= 60) return '#28a745';
        if (score >= 40) return '#ffc107';
        return '#dc3545';
    }

    // Render technology comparison
    renderComparison(containerId = 'technology-comparison', locationData = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!locationData) {
            // Show general technology overview
            container.innerHTML = `
                <div class="technology-overview">
                    <h4>Available Technologies</h4>
                    ${this.technologies.map(tech => `
                        <div class="tech-card">
                            <div class="tech-name">${tech.name}</div>
                            <div class="tech-description">${tech.description}</div>
                            <div class="tech-conditions">
                                <strong>Suitable Conditions:</strong>
                                <ul>
                                    ${tech.suitableConditions.map(condition => `<li>${condition}</li>`).join('')}
                                </ul>
                            </div>
                            <div class="tech-specs">
                                <div><strong>Water Yield:</strong> ${tech.waterYield}</div>
                                <div><strong>CAPEX:</strong> ${tech.capex}</div>
                                <div><strong>OPEX:</strong> ${tech.opex}</div>
                                <div><strong>Scalability:</strong> ${tech.scalability}</div>
                            </div>
                        </div>
                    `).join('')}
                    <div class="disclaimer">
                        <small><em>Technology recommendations are preliminary assessments requiring field validation</em></small>
                    </div>
                </div>
            `;
        } else {
            // Show technology recommendations for specific location
            const recommendations = this.recommendTechnologiesForLocation(locationData);
            
            container.innerHTML = `
                <div class="technology-recommendations">
                    <h4>Technology Recommendations for Selected Location</h4>
                    <div class="location-info">
                        <strong>Coordinates:</strong> ${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}
                        <br>
                        <strong>Evaporation:</strong> ${locationData.evaporation} mm/day
                        <br>
                        <strong>Humidity:</strong> ${locationData.humidity}%
                        <br>
                        <strong>Wind Speed:</strong> ${locationData.windSpeed} m/s
                        <br>
                        <strong>Condensation Index:</strong> ${locationData.condensationIndex}/100
                    </div>
                    <div class="recommendations-list">
                        ${recommendations.map((rec, index) => this.getTechnologyCard(rec, index + 1)).join('')}
                    </div>
                    <div class="disclaimer">
                        <small><em>Recommendations are preliminary assessments. Field trials recommended before implementation.</em></small>
                    </div>
                </div>
            `;
        }
    }

    // Get best technology for given conditions
    getBestTechnology(conditions) {
        const evaluations = this.technologies.map(tech => 
            this.evaluateTechnologySuitability(tech, conditions)
        );
        
        return evaluations.sort((a, b) => b.score - a.score)[0];
    }

    // Refresh technology display
    refresh(locationData = null) {
        this.renderComparison('technology-comparison', locationData);
    }
}

// Export for browser usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TechnologySelector;
} else {
    window.TechnologySelector = TechnologySelector;
    }
