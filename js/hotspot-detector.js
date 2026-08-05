// Hotspot detection module
class HotspotDetector {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.topHotspots = [];
    }

    // Detect top 5 hotspots
    async detectHotspots() {
        try {
            this.topHotspots = await this.dataManager.getHotspots();
            return this.topHotspots;
        } catch (error) {
            console.error('Error detecting hotspots:', error);
            return [];
        }
    }

    // Get hotspot card HTML
    getHotspotCard(hotspot, index) {
        const condensationCategory = this.getCondensationCategory(hotspot.condensationIndex);
        
        return `
            <div class="hotspot-card" onclick="app.goToHotspot(${index})">
                <div class="hotspot-rank">#${hotspot.rank}</div>
                <div class="hotspot-location">Lat: ${hotspot.latitude.toFixed(4)}, Lng: ${hotspot.longitude.toFixed(4)}</div>
                <div class="hotspot-details">
                    <div><strong>Evaporation:</strong> ${hotspot.evaporation} mm/day</div>
                    <div><strong>Risk:</strong> 
                        <span class="risk-indicator ${hotspot.riskLevel.toLowerCase()}">${hotspot.riskLevel}</span>
                    </div>
                    <div><strong>Condensation Potential:</strong> ${hotspot.condensationIndex}/100 (${condensationCategory})</div>
                    <div><strong>Recommended:</strong> ${hotspot.recommendedTechnology}</div>
                </div>
            </div>
        `;
    }

    // Get condensation category based on index
    getCondensationCategory(index) {
        const categories = Config.CONDENSATION_CATEGORIES;
        
        if (index >= categories.VERY_HIGH.min) return categories.VERY_HIGH.label;
        if (index >= categories.HIGH.min) return categories.HIGH.label;
        if (index >= categories.MODERATE.min) return categories.MODERATE.label;
        return categories.LOW.label;
    }

    // Render hotspots to DOM
    renderHotspots(containerId = 'hotspots-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.topHotspots.length === 0) {
            container.innerHTML = '<div class="loading">Detecting hotspots...</div>';
            return;
        }

        const hotspotsHTML = this.topHotspots.map((hotspot, index) => 
            this.getHotspotCard(hotspot, index)
        ).join('');

        container.innerHTML = hotspotsHTML;
    }

    // Get hotspot by index
    getHotspotByIndex(index) {
        if (index >= 0 && index < this.topHotspots.length) {
            return this.topHotspots[index];
        }
        return null;
    }

    // Refresh hotspots
    async refresh() {
        await this.detectHotspots();
        this.renderHotspots();
    }

    // Get summary statistics for hotspots
    getHotspotSummary() {
        if (this.topHotspots.length === 0) {
            return {
                totalHotspots: 0,
                avgEvaporation: 0,
                highestEvaporation: 0,
                avgCondensation: 0
            };
        }

        const avgEvaporation = this.topHotspots.reduce((sum, hs) => sum + parseFloat(hs.evaporation), 0) / this.topHotspots.length;
        const highestEvaporation = Math.max(...this.topHotspots.map(hs => parseFloat(hs.evaporation)));
        const avgCondensation = this.topHotspots.reduce((sum, hs) => sum + hs.condensationIndex, 0) / this.topHotspots.length;

        return {
            totalHotspots: this.topHotspots.length,
            avgEvaporation: avgEvaporation.toFixed(2),
            highestEvaporation: highestEvaporation.toFixed(2),
            avgCondensation: avgCondensation.toFixed(2)
        };
    }
}
