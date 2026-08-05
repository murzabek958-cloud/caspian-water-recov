// Data management module for Caspian Water Recovery
class DataManager {
    constructor() {
        this.evaporationData = [];
        this.weatherData = {};
        this.historicalData = {};
        this.gridPoints = [];
        this.loading = false;
    }

    // Generate Caspian Sea grid points
    generateCaspianGrid() {
        const points = [];
        // Create a grid covering the Caspian Sea area
        for (let lat = 36.5; lat <= 46.5; lat += 0.5) {
            for (let lng = 46.5; lng <= 56.5; lng += 0.5) {
                // Skip points outside the sea (basic filtering)
                if (this.isInCaspianSea(lat, lng)) {
                    const evaporation = this.generateEvaporationValue(lat, lng);
                    const sst = this.generateSST(lat, lng);
                    const airTemp = this.generateAirTemperature(lat, lng);
                    const windSpeed = this.generateWindSpeed(lat, lng);
                    const humidity = this.generateHumidity(lat, lng);
                    
                    points.push({
                        id: `point_${lat}_${lng}`,
                        latitude: lat,
                        longitude: lng,
                        evaporation: evaporation,
                        sst: sst,
                        airTemperature: airTemp,
                        windSpeed: windSpeed,
                        humidity: humidity,
                        condensationIndex: this.calculateCondensationIndex(humidity, airTemp, windSpeed, evaporation),
                        riskLevel: this.getRiskLevel(evaporation),
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
        return points;
    }

    // Simple check if coordinates are likely in Caspian Sea
    isInCaspianSea(lat, lng) {
        // Basic bounding box with some exclusions
        return lat >= 36.5 && lat <= 46.5 && lng >= 46.5 && lng <= 56.5;
    }

    // Generate realistic evaporation values based on location
    generateEvaporationValue(lat, lng) {
        // Higher evaporation in southern parts, near coasts
        let baseValue = 8;
        
        // Southern regions have higher evaporation
        if (lat < 40) baseValue += Math.random() * 6;
        else if (lat > 43) baseValue -= Math.random() * 3;
        
        // Add random variation
        return Math.max(2, baseValue + (Math.random() * 8 - 2)).toFixed(2);
    }

    // Generate Sea Surface Temperature
    generateSST(lat, lng) {
        // SST varies by season and location
        const baseTemp = 15 + (lat - 36) * 0.5; // warmer in south
        return (baseTemp + Math.random() * 8 - 4).toFixed(2);
    }

    // Generate Air Temperature
    generateAirTemperature(lat, lng) {
        const baseTemp = 20 + (lat - 36) * 0.3; // warmer in south
        return (baseTemp + Math.random() * 10 - 5).toFixed(2);
    }

    // Generate Wind Speed
    generateWindSpeed(lat, lng) {
        return (Math.random() * 15).toFixed(2);
    }

    // Generate Humidity
    generateHumidity(lat, lng) {
        const baseHumidity = 60 - (lat - 36) * 1.5; // more humid in north
        return Math.max(20, Math.min(95, baseHumidity + Math.random() * 20 - 10)).toFixed(2);
    }

    // Calculate condensation potential index
    calculateCondensationIndex(humidity, temp, wind, evaporation) {
        // Weighted scoring for condensation potential
        const humidityScore = (humidity / 100) * 40; // 40% weight
        const tempScore = Math.max(0, (30 - Math.abs(temp - 20)) / 30) * 25; // 25% weight
        const windScore = Math.max(0, (15 - wind) / 15) * 20; // 20% weight
        const evaporationScore = Math.min(15, evaporation / 2); // 15% weight
        
        const total = humidityScore + tempScore + windScore + evaporationScore;
        return Math.round(total);
    }

    // Get risk level based on evaporation
    getRiskLevel(evaporation) {
        const evap = parseFloat(evaporation);
        if (evap >= Config.EVAPORATION_THRESHOLDS.CRITICAL) return 'CRITICAL';
        if (evap >= Config.EVAPORATION_THRESHOLDS.HIGH) return 'HIGH';
        if (evap >= Config.EVAPORATION_THRESHOLDS.MEDIUM) return 'MEDIUM';
        return 'LOW';
    }

    // Load Caspian grid data
    async loadCaspianGrid() {
        if (this.gridPoints.length === 0) {
            this.gridPoints = this.generateCaspianGrid();
        }
        return this.gridPoints;
    }

    // Get evaporation data for specific region
    async getEvaporationData(region = 'all') {
        await this.loadCaspianGrid();
        
        if (region === 'kazakhstan') {
            // Filter for Kazakhstan sector (roughly northern part)
            return this.gridPoints.filter(point => 
                point.latitude >= 43 && point.longitude >= 50
            );
        }
        
        return this.gridPoints;
    }

    // Get city weather data
    async getCityWeather(cityName) {
        // In a real implementation, this would call OpenWeatherMap API
        // For demo, we'll return mock data
        const mockWeather = {
            'Aktau': {
                name: 'Aktau',
                coord: { lat: 43.65, lon: 51.18 },
                main: {
                    temp: 22.5,
                    humidity: 65,
                    pressure: 1013
                },
                wind: {
                    speed: 8.2,
                    deg: 180
                },
                weather: [{ description: 'Partly cloudy' }],
                dt: Date.now()
            },
            'Atyrau': {
                name: 'Atyrau',
                coord: { lat: 47.11, lon: 51.93 },
                main: {
                    temp: 24.8,
                    humidity: 58,
                    pressure: 1015
                },
                wind: {
                    speed: 6.5,
                    deg: 270
                },
                weather: [{ description: 'Sunny' }],
                dt: Date.now()
            },
            'Baku': {
                name: 'Baku',
                coord: { lat: 40.41, lon: 49.86 },
                main: {
                    temp: 26.3,
                    humidity: 72,
                    pressure: 1010
                },
                wind: {
                    speed: 12.1,
                    deg: 90
                },
                weather: [{ description: 'Windy' }],
                dt: Date.now()
            }
        };

        return mockWeather[cityName] || null;
    }

    // Get hotspot data (top 5 highest evaporation points)
    async getHotspots() {
        await this.loadCaspianGrid();
        return this.gridPoints
            .sort((a, b) => parseFloat(b.evaporation) - parseFloat(a.evaporation))
            .slice(0, 5)
            .map((point, index) => ({
                ...point,
                rank: index + 1,
                recommendedTechnology: this.recommendTechnology(point)
            }));
    }

    // Recommend technology based on conditions
    recommendTechnology(point) {
        const humidity = parseFloat(point.humidity);
        const windSpeed = parseFloat(point.windSpeed);
        const condensationIndex = point.condensationIndex;

        // Logic to recommend technology
        if (humidity > 70 && windSpeed >= 3 && windSpeed <= 12) {
            return 'Fog Collector';
        } else if (humidity > 60 && windSpeed <= 5 && condensationIndex > 60) {
            return 'Radiative Cooling';
        } else if (humidity > 65 && condensationIndex > 70) {
            return 'Ionization System';
        }
        
        return 'Assessment Needed';
    }

    // Get summary statistics for Kazakhstan sector
    async getKazakhstanStats() {
        const kazakhstanData = await this.getEvaporationData('kazakhstan');
        
        if (kazakhstanData.length === 0) {
            return {
                averageEvaporation: 0,
                averageAirTemperature: 0,
                averageSST: 0,
                averageWindSpeed: 0,
                averageHumidity: 0,
                criticalPoints: 0,
                highRiskPoints: 0,
                highestEvaporationPoint: null
            };
        }

        const stats = {
            averageEvaporation: 0,
            averageAirTemperature: 0,
            averageSST: 0,
            averageWindSpeed: 0,
            averageHumidity: 0,
            criticalPoints: 0,
            highRiskPoints: 0,
            highestEvaporationPoint: null
        };

        // Calculate averages
        stats.averageEvaporation = kazakhstanData.reduce((sum, p) => sum + parseFloat(p.evaporation), 0) / kazakhstanData.length;
        stats.averageAirTemperature = kazakhstanData.reduce((sum, p) => sum + parseFloat(p.airTemperature), 0) / kazakhstanData.length;
        stats.averageSST = kazakhstanData.reduce((sum, p) => sum + parseFloat(p.sst), 0) / kazakhstanData.length;
        stats.averageWindSpeed = kazakhstanData.reduce((sum, p) => sum + parseFloat(p.windSpeed), 0) / kazakhstanData.length;
        stats.averageHumidity = kazakhstanData.reduce((sum, p) => sum + parseFloat(p.humidity), 0) / kazakhstanData.length;

        // Count risk levels
        stats.criticalPoints = kazakhstanData.filter(p => p.riskLevel === 'CRITICAL').length;
        stats.highRiskPoints = kazakhstanData.filter(p => p.riskLevel === 'HIGH').length;

        // Find highest evaporation point
        stats.highestEvaporationPoint = kazakhstanData.reduce((highest, current) => 
            parseFloat(current.evaporation) > parseFloat(highest.evaporation) ? current : highest
        );

        return stats;
    }

    // Get NASA POWER data (mock implementation)
    async getNasaPowerData(latitude, longitude) {
        // This would normally call the NASA POWER API
        // For demo purposes, return mock data
        return {
            inputs: {
                parameters: ["T2M", "RH2M", "WS2M", "ALLSKY_SFC_SW_DWN"],
                community: "RE",
                lon: longitude,
                lat: latitude,
                start: "20230101",
                end: "20231231"
            },
            outputs: {
                daily: {
                    T2M: [22.5, 23.1, 21.8, 24.2, 22.9],
                    RH2M: [65.2, 62.8, 68.1, 59.5, 66.3],
                    WS2M: [8.2, 7.8, 9.1, 6.5, 8.9],
                    ALLSKY_SFC_SW_DWN: [285.3, 291.2, 278.9, 295.1, 282.7]
                }
            },
            headers: {
                "start": "20230101",
                "end": "20231231",
                "parameter_0": "T2M",
                "parameter_1": "RH2M",
                "parameter_2": "WS2M",
                "parameter_3": "ALLSKY_SFC_SW_DWN"
            }
        };
    }
}

// Export for browser usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} else {
    window.DataManager = DataManager;
    }
