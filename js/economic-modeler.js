// Economic modeling module
class EconomicModeler {
    constructor() {
        this.currentScenario = 'base';
        this.parameters = Config.ECONOMIC_DEFAULTS.base;
        this.results = null;
    }

    // Set economic parameters
    setParameters(params) {
        this.parameters = { ...this.parameters, ...params };
    }

    // Calculate economic metrics
    calculateEconomics() {
        const p = this.parameters;
        
        const totalCapex = p.modules * p.capexPerModule;
        const annualOpex = p.annualOpex + p.energyCost + p.maintenance;
        const annualWaterProduction = p.waterProduction;
        
        const costPerCubicMeter = (totalCapex / p.lifetime + annualOpex) / annualWaterProduction;
        const costPerLiter = costPerCubicMeter / 1000;
        const totalAnnualCost = totalCapex / p.lifetime + annualOpex;
        const roi = ((annualWaterProduction * 2 - totalAnnualCost) / totalAnnualCost) * 100; // Assuming $2/m³ revenue
        const paybackPeriod = totalCapex / (annualWaterProduction * 2 - annualOpex - p.energyCost - p.maintenance);
        
        this.results = {
            totalCapex: totalCapex,
            annualOpex: annualOpex,
            annualWaterProduction: annualWaterProduction,
            costPerCubicMeter: costPerCubicMeter,
            costPerLiter: costPerLiter,
            roi: roi,
            paybackPeriod: paybackPeriod > 0 ? paybackPeriod : 'Never',
            totalAnnualCost: totalAnnualCost,
            scenario: this.currentScenario
        };
        
        return this.results;
    }

    // Set scenario (conservative, base, optimistic)
    setScenario(scenario) {
        this.currentScenario = scenario;
        this.parameters = { ...Config.ECONOMIC_DEFAULTS[scenario] };
        return this.calculateEconomics();
    }

    // Get scenario parameters
    getScenarioParams(scenario) {
        return Config.ECONOMIC_DEFAULTS[scenario] || Config.ECONOMIC_DEFAULTS.base;
    }

    // Render economic model to DOM
    renderModel(containerId = 'economic-model') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!this.results) {
            this.calculateEconomics();
        }

        const r = this.results;
        
        container.innerHTML = `
            <div class="economic-model">
                <h4>Economic Model</h4>
                
                <div class="scenario-selector">
                    <h5>Select Scenario:</h5>
                    <div class="toggle-container">
                        <button class="toggle-btn ${this.currentScenario === 'conservative' ? 'active' : ''}" 
                                onclick="app.setEconomicScenario('conservative')">Conservative</button>
                        <button class="toggle-btn ${this.currentScenario === 'base' ? 'active' : ''}" 
                                onclick="app.setEconomicScenario('base')">Base</button>
                        <button class="toggle-btn ${this.currentScenario === 'optimistic' ? 'active' : ''}" 
                                onclick="app.setEconomicScenario('optimistic')">Optimistic</button>
                    </div>
                </div>

                <div class="economic-results">
                    <div class="results-grid">
                        <div class="result-card">
                            <div class="result-value">$${r.totalCapex.toLocaleString()}</div>
                            <div class="result-label">Total CAPEX</div>
                        </div>
                        <div class="result-card">
                            <div class="result-value">$${r.annualOpex.toLocaleString()}</div>
                            <div class="result-label">Annual OPEX</div>
                        </div>
                        <div class="result-card">
                            <div class="result-value">${r.annualWaterProduction.toLocaleString()} m³</div>
                            <div class="result-label">Annual Water Production</div>
                        </div>
                        <div class="result-card">
                            <div class="result-value">$${r.costPerCubicMeter.toFixed(4)}</div>
                            <div class="result-label">Cost per m³</div>
                        </div>
                        <div class="result-card">
                            <div class="result-value">$${r.costPerLiter.toFixed(6)}</div>
                            <div class="result-label">Cost per Liter</div>
                        </div>
                        <div class="result-card">
                            <div class="result-value">${typeof r.roi === 'number' ? r.roi.toFixed(2) : r.roi}%</div>
                            <div class="result-label">ROI</div>
                        </div>
                    </div>
                    
                    ${r.paybackPeriod !== 'Never' ? `
                        <div class="payback-info">
                            <strong>Payback Period:</strong> ${typeof r.paybackPeriod === 'number' ? r.paybackPeriod.toFixed(2) : r.paybackPeriod} years
                        </div>
                    ` : ''}
                </div>

                <div class="assumptions">
                    <h5>Key Assumptions:</h5>
                    <ul>
                        <li>Water sale price: $2 per cubic meter (for ROI calculation)</li>
                        <li>Project lifetime: ${this.parameters.lifetime} years</li>
                        <li>Energy costs included in OPEX</li>
                        <li>Maintenance costs annualized</li>
                    </ul>
                </div>

                <div class="disclaimer">
                    <small><em>Prototype Economic Model - Based on estimated parameters and assumptions</em></small>
                </div>
            </div>
        `;
    }

    // Update parameters via input
    updateParameter(paramName, value) {
        this.parameters[paramName] = parseFloat(value);
        this.calculateEconomics();
        this.renderModel();
    }

    // Get current results
    getResults() {
        if (!this.results) {
            this.calculateEconomics();
        }
        return this.results;
    }

    // Reset to defaults
    resetToDefaults() {
        this.parameters = { ...Config.ECONOMIC_DEFAULTS.base };
        this.currentScenario = 'base';
        this.calculateEconomics();
        this.renderModel();
    }

    // Export results as JSON
    exportResults() {
        if (!this.results) {
            this.calculateEconomics();
        }
        
        const exportData = {
            ...this.results,
            parameters: this.parameters,
            timestamp: new Date().toISOString(),
            disclaimer: "Prototype economic model - estimates only"
        };
        
        return JSON.stringify(exportData, null, 2);
    }
}
