// Map module for Caspian Water Recovery
class MapManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.map = null;
        this.markers = [];
        this.heatmapLayerId = 'evaporation-heatmap';
        this.currentView = 'full'; // 'full' or 'kazakhstan'
        this.markerMode = 'animated'; // 'animated' or 'heatmap'
        this.sourcesLoaded = false;
    }

    // Initialize the map
    init() {
        if (typeof mapboxgl === 'undefined') {
            console.error('Mapbox GL JS not loaded');
            this.showMapFallback();
            return;
        }

        mapboxgl.accessToken = Config.MAPBOX.TOKEN;
        
        this.map = new mapboxgl.Map({
            container: 'map',
            style: Config.MAPBOX.STYLE,
            center: Config.CASPIAN_SEA.CENTER,
            zoom: Config.CASPIAN_SEA.ZOOM_LEVELS.FULL
        });

        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        this.map.on('load', () => {
            this.loadMapData();
            this.setupEventListeners();
        });
    }

    // Show fallback if Mapbox is not loaded
    showMapFallback() {
        const container = document.getElementById('map');
        if (!container) return;
        
        container.innerHTML = `
            <div style="
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #e6f2ff, #f0f8ff);
                border-radius: 16px;
                text-align: center;
                padding: 2rem;
                color: #2c3e50;
            ">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🗺️</div>
                <h3 style="color: #1e3c72; margin-bottom: 0.5rem;">Geospatial View</h3>
                <p style="color: #6c757d; max-width: 400px; text-align: center;">
                    Interactive map requires WebGL support.<br>
                    Try on desktop browser or enable "Desktop site" in mobile Chrome.
                </p>
                <div style="margin-top: 1rem; font-size: 0.9rem; color: #495057;">
                    <strong>Current Status:</strong> Using mock data for demonstration
                </div>
            </div>
        `;
    }

    // Load map data
    async loadMapData() {
        try {
            const points = await this.dataManager.getEvaporationData();
            
            // Add data source
            this.map.addSource('evaporation-points', {
                type: 'geojson',
                data: this.pointsToGeoJSON(points)
            });

            // Add heatmap layer
            this.map.addLayer({
                id: this.heatmapLayerId,
                type: 'heatmap',
                source: 'evaporation-points',
                maxzoom: 15,
                paint: {
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'evaporation'],
                        0, 0,
                        100, 1
                    ],
                    'heatmap-intensity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 1,
                        9, 3
                    ],
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0, 'rgba(33, 102, 172, 0)',
                        0.2, 'rgb(103, 169, 207)',
                        0.4, 'rgb(209, 229, 240)',
                        0.6, 'rgb(253, 219, 199)',
                        0.8, 'rgb(239, 138, 98)',
                        1, 'rgb(178, 24, 43)'
                    ],
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 2,
                        9, 20
                    ],
                    'heatmap-opacity': 0.9
                }
            }, 'waterway-label');

            // Add circle layer for animated markers
            this.map.addLayer({
                id: 'evaporation-markers',
                type: 'circle',
                source: 'evaporation-points',
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['get', 'evaporation'],
                        0, 4,
                        20, 12
                    ],
                    'circle-color': [
                        'match',
                        ['get', 'riskLevel'],
                        'LOW', Config.RISK_LEVELS.LOW.color,
                        'MEDIUM', Config.RISK_LEVELS.MEDIUM.color,
                        'HIGH', Config.RISK_LEVELS.HIGH.color,
                        'CRITICAL', Config.RISK_LEVELS.CRITICAL.color,
                        '#ccc'
                    ],
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': 'white'
                }
            }, 'waterway-label');

            // Add popup interaction
            this.map.on('click', 'evaporation-markers', (e) => {
                const coordinates = e.features[0].geometry.coordinates;
                const properties = e.features[0].properties;
                
                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(this.getPopupContent(properties))
                    .addTo(this.map);
            });

            this.map.on('mouseenter', 'evaporation-markers', () => {
                this.map.getCanvas().style.cursor = 'pointer';
            });

            this.map.on('mouseleave', 'evaporation-markers', () => {
                this.map.getCanvas().style.cursor = '';
            });

            this.sourcesLoaded = true;
        } catch (error) {
            console.error('Error loading map data:', error);
        }
    }

    // Convert points to GeoJSON format
    pointsToGeoJSON(points) {
        return {
            type: 'FeatureCollection',
            features: points.map(point => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [point.longitude, point.latitude]
                },
                properties: {
                    id: point.id,
                    evaporation: parseFloat(point.evaporation),
                    sst: parseFloat(point.sst),
                    airTemperature: parseFloat(point.airTemperature),
                    windSpeed: parseFloat(point.windSpeed),
                    humidity: parseFloat(point.humidity),
                    condensationIndex: point.condensationIndex,
                    riskLevel: point.riskLevel,
                    latitude: point.latitude,
                    longitude: point.longitude,
                    recommendedTechnology: point.recommendedTechnology || 'Assessment Needed'
                }
            }))
        };
    }

    // Get popup content
    getPopupContent(properties) {
        return `
            <div class="popup-content">
                <h3>Evaporation Point</h3>
                <div class="popup-row">
                    <strong>Coordinates:</strong> ${properties.latitude.toFixed(4)}, ${properties.longitude.toFixed(4)}
                </div>
                <div class="popup-row">
                    <strong>Evaporation:</strong> ${properties.evaporation} mm/day
                    <span class="risk-indicator ${properties.riskLevel.toLowerCase()}">${properties.riskLevel}</span>
                </div>
                <div class="popup-row">
                    <strong>SST:</strong> ${properties.sst}°C
                </div>
                <div class="popup-row">
                    <strong>Air Temp:</strong> ${properties.airTemperature}°C
                </div>
                <div class="popup-row">
                    <strong>Wind Speed:</strong> ${properties.windSpeed} m/s
                </div>
                <div class="popup-row">
                    <strong>Humidity:</strong> ${properties.humidity}%
                </div>
                <div class="popup-row">
                    <strong>Condensation Potential:</strong> ${properties.condensationIndex}/100
                </div>
                <div class="popup-row">
                    <strong>Recommended Tech:</strong> ${properties.recommendedTechnology}
                </div>
                <div class="popup-note">
                    <em>Estimated / Modelled Data</em>
                </div>
            </div>
        `;
    }

    // Set view to Kazakhstan focus
    setKazakhstanFocus() {
        this.currentView = 'kazakhstan';
        this.map.flyTo({
            center: [51.5, 45.0], // Center of Kazakhstan sector
            zoom: Config.CASPIAN_SEA.ZOOM_LEVELS.KAZAKHSTAN_FOCUS,
            essential: true
        });
    }

    // Set view to full Caspian
    setFullCaspianView() {
        this.currentView = 'full';
        this.map.flyTo({
            center: Config.CASPIAN_SEA.CENTER,
            zoom: Config.CASPIAN_SEA.ZOOM_LEVELS.FULL,
            essential: true
        });
    }

    // Toggle between heatmap and markers
    toggleMarkerMode(mode) {
        if (!this.map || !this.sourcesLoaded) return;

        this.markerMode = mode;

        if (mode === 'heatmap') {
            this.map.setLayoutProperty(this.heatmapLayerId, 'visibility', 'visible');
            this.map.setLayoutProperty('evaporation-markers', 'visibility', 'none');
        } else {
            this.map.setLayoutProperty(this.heatmapLayerId, 'visibility', 'none');
            this.map.setLayoutProperty('evaporation-markers', 'visibility', 'visible');
        }
    }

    // Fly to specific coordinates
    flyTo(coords) {
        if (this.map) {
            this.map.flyTo({
                center: coords,
                zoom: 10,
                essential: true
            });
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Handle map click for general information
        this.map.on('click', (e) => {
            // Only handle clicks that don't hit a marker
            const features = this.map.queryRenderedFeatures(e.point, {
                layers: ['evaporation-markers']
            });
            
            if (features.length === 0) {
                // Clicked on map but not on a marker
                // Could add general map info here if needed
            }
        });
    }

    // Update data on the map
    async updateMapData() {
        if (!this.map || !this.sourcesLoaded) return;

        try {
            const points = await this.dataManager.getEvaporationData();
            const geojsonData = this.pointsToGeoJSON(points);
            
            this.map.getSource('evaporation-points').setData(geojsonData);
        } catch (error) {
            console.error('Error updating map data:', error);
        }
    }

    // Get current map bounds
    getCurrentBounds() {
        return this.map.getBounds();
    }

    // Get map center
    getCenter() {
        return this.map.getCenter();
    }

    // Get map zoom level
    getZoom() {
        return this.map.getZoom();
    }
}

// Export for browser usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapManager;
} else {
    window.MapManager = MapManager;
                    }
