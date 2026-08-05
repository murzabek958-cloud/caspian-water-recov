// Configuration file for API keys and settings
const Config = {
    // Mapbox configuration
    MAPBOX: {
        TOKEN: window.ENV?.MAPBOX_ACCESS_TOKEN || 
               localStorage.getItem('MAPBOX_ACCESS_TOKEN') || 
               'pk.eyJ1IjoibWFudXJrYXlldiIsImEiOiJjbXNjdGx3YWMwd3o1MnpzNXd4ZTB3a20xIn0.TFkYBesFueHqrCjX6wzUSw',
        STYLE: 'mapbox://styles/mapbox/satellite-streets-v11'
    },
    
    // OpenWeatherMap configuration
    OPENWEATHER: {
        API_KEY: window.ENV?.OPENWEATHER_API_KEY || 
                 localStorage.getItem('OPENWEATHER_API_KEY') || 
                 'your_api_key_here',
        BASE_URL: 'https://api.openweathermap.org/data/2.5'
    },
    
    // Caspian Sea coordinates and boundaries
    CASPIAN_SEA: {
        CENTER: [48.5, 51.5], // lat, lng
        ZOOM_LEVELS: {
            FULL: 5,
            KAZAKHSTAN_FOCUS: 6
        },
        BOUNDARIES: {
            NORTH: 46.5,
            SOUTH: 36.5,
            WEST: 46.5,
            EAST: 56.5
        }
    },
    
    // Evaporation thresholds (mm/day)
    EVAPORATION_THRESHOLDS: {
        LOW: 5,
        MEDIUM: 10,
        HIGH: 14,
        CRITICAL: 20
    },
    
    // Risk levels
    RISK_LEVELS: {
        LOW: { name: 'LOW', color: '#28a745', threshold: 0 },
        MEDIUM: { name: 'MEDIUM', color: '#ffc107', threshold: 5 },
        HIGH: { name: 'HIGH', color: '#fd7e14', threshold: 10 },
        CRITICAL: { name: 'CRITICAL', color: '#dc3545', threshold: 14 }
    },
    
    // Condensation potential categories
    CONDENSATION_CATEGORIES: {
        LOW: { min: 0, max: 25, label: 'LOW' },
        MODERATE: { min: 26, max: 50, label: 'MODERATE' },
        HIGH: { min: 51, max: 75, label: 'HIGH' },
        VERY_HIGH: { min: 76, max: 100, label: 'VERY HIGH' }
    },
    
    // Technology options
    TECHNOLOGIES: [
        {
            id: 'fog-collector',
            name: 'Fog Collector',
            description: 'Passive fog collection using mesh barriers',
            suitableConditions: ['High humidity', 'Moderate wind'],
            humidityThreshold: 70,
            windMin: 3,
            windMax: 15,
            waterYield: '0.5-2 L/m²/day',
            capex: '$50-100/m²',
            opex: '$5-10/year/m²',
            scalability: 'Small to medium scale'
        },
        {
            id: 'radiative-cooling',
            name: 'Radiative Cooling',
            description: 'Atmospheric water generation through radiative cooling',
            suitableConditions: ['Clear skies', 'High humidity', 'Low wind'],
            humidityThreshold: 60,
            windMin: 0,
            windMax: 5,
            waterYield: '0.1-1 L/m²/day',
            capex: '$100-200/m²',
            opex: '$10-20/year/m²',
            scalability: 'Medium to large scale'
        },
        {
            id: 'ionization',
            name: 'Ionization System',
            description: 'Atmospheric water capture through ionization technology',
            suitableConditions: ['High humidity', 'Stable conditions'],
            humidityThreshold: 65,
            windMin: 0,
            windMax: 8,
            waterYield: '1-3 L/m²/day',
            capex: '$200-400/m²',
            opex: '$20-40/year/m²',
            scalability: 'Large scale'
        }
    ],
    
    // Default economic parameters
    ECONOMIC_DEFAULTS: {
        conservative: {
            modules: 10,
            capexPerModule: 50000,
            annualOpex: 5000,
            waterProduction: 10000,
            energyCost: 1000,
            maintenance: 2000,
            lifetime: 10
        },
        base: {
            modules: 20,
            capexPerModule: 75000,
            annualOpex: 8000,
            waterProduction: 25000,
            energyCost: 1500,
            maintenance: 3000,
            lifetime: 15
        },
        optimistic: {
            modules: 50,
            capexPerModule: 100000,
            annualOpex: 12000,
            waterProduction: 50000,
            energyCost: 2000,
            maintenance: 5000,
            lifetime: 20
        }
    }
};

// Export for use in other modules (Node.js compatibility)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
} else {
    // For browser usage
    window.Config = Config;
}
