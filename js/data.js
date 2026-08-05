// Data management module for Caspian Water Recovery
class DataManager {
    constructor() {
        this.evaporationData = [];
        this.weatherData = {};
        this.historicalData = {};
        this.gridPoints = [];
        this.loading = false;
    }

    // Load Caspian grid data from JSON file
    async loadCaspianGrid() {
        try {
            // JSON файлын жүктеу
            const response = await fetch('./data/caspian_grid.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();
            
            // Бұл форматта болса: [{"lat": 36.5, "lon": 49.0, ...}]
            this.gridPoints = jsonData.map(point => ({
                id: `point_${point.lat}_${point.lon}`,
                latitude: point.lat,
                longitude: point.lon,
                evaporation: point.evaporation,
                sst: point.sst,
                airTemperature: point.temp,
                windSpeed: point.wind,
                humidity: point.humidity,
                condensationIndex: this.calculateCondensationIndex(
                    point.humidity,
                    point.temp,
                    point.wind,
                    point.evaporation
                ),
                riskLevel: this.getRiskLevel(point.evaporation),
                recommendedTechnology: this.recommendTechnology({
                    humidity: point.humidity,
                    windSpeed: point.wind,
                    condensationIndex: this.calculateCondensationIndex(
                        point.humidity,
                        point.temp,
                        point.wind,
                        point.evaporation
                    )
                }),
                timestamp: new Date().toISOString()
            }));
            
            console.log(`✅ Loaded ${this.gridPoints.length} grid points from JSON`);
            return this.gridPoints;
        } catch (error) {
            console.error('❌ Error loading grid data from JSON:', error);
            console.log('🔄 Falling back to generated grid...');
            // Егер JSON жүктелмесе, generateCaspianGrid() қолданылады
            this.gridPoints = this.generateCaspianGrid();
            return this.gridPoints;
        }
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

    // Recommend technology based on conditions
    recommendTechnology(conditions) {
        const { humidity, windSpeed, condensationIndex } = conditions;

        // Logic to recommend technology
        if (humidity > 70 && windSpeed >= 3 && windSpeed <= 12 && condensationIndex > 60) {
            return 'Fog Collector';
        } else if (humidity > 60 && windSpeed <= 5 && condensationIndex > 65) {
            return 'Radiative Cooling';
        } else if (humidity > 65 && condensationIndex > 70) {
            return 'Ionization System';
        }
        
        return 'Assessment Needed';
    }

    // Generate Caspian Sea grid points (fallback method)
    generateCaspianGrid() {
        const points = [];
        
        // Бұл резерв әдіс - егер JSON файлы жоқ болса
        for (let lat = 36.5; lat <= 47.0; lat += 1.17) {
            for (let lon = 49.0; lon <= 54.5; lon += 0.39) {
                // Skip points outside the sea (basic filtering)
                if (this.isInCaspianSea(lat, lon)) {
                    const evaporation = this.generateEvaporationValue(lat, lon);
                    const sst = this.generateSST(lat, lon);
                    const airTemp = this.generateAirTemperature(lat, lon);
                    const windSpeed = this.generateWindSpeed(lat, lon);
                    const humidity = this.generateHumidity(lat, lon);
                    
                    points.push({
                        id: `point_${lat}_${lon}`,
                        latitude: lat,
                        longitude: lon,
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
        
        console.log(`🔄 Generated ${points.length} grid points`);
        return points;
    }

    // Simple check if coordinates are likely in Caspian Sea
    isInCaspianSea(lat, lng) {
        // Basic bounding box with some exclusions
        return lat >= 36.5 && lat <= 47.0 && lng >= 46.5 && lng <= 56.5;
    }

    // Generate realistic evaporation values based on location (fallback)
    generateEvaporationValue(lat, lng) {
        // Higher evaporation in southern parts, near coasts
        let baseValue = 8;
        
        // Southern regions have higher evaporation
        if (lat < 40) baseValue += Math.random() * 6;
        else if (lat > 43) baseValue -= Math.random() * 3;
        
        // Add random variation
        return Math.max(2, baseValue + (Math.random() * 8 - 2)).toFixed(2);
    }

    // Generate Sea Surface Temperature (fallback)
    generateSST(lat, lng) {
        // SST varies by season and location
        const baseTemp = 15 + (lat - 36) * 0.5; // warmer in south
        return (baseTemp + Math.random() * 8 - 4).toFixed(2);
    }

    // Generate Air Temperature (fallback)
    generateAirTemperature(lat, lng) {
        const baseTemp = 20 + (lat - 36) * 0.3; // warmer in south
        return (baseTemp + Math.random() * 10 - 5).toFixed(2);
    }

    // Generate Wind Speed (fallback)
    generateWindSpeed(lat, lng) {
        return (Math.random() * 15).toFixed(2);
    }

    // Generate Humidity (fallback)
    generateHumidity(lat, lng) {
        const baseHumidity = 60 - (lat - 36) * 1.5; // more humid in north
        return Math.max(20, Math.min(95, baseHumidity + Math.random() * 20 - 10)).toFixed(2);
    }

    // Get evaporation data for specific region
    async getEvaporationData(region = 'all') {
        if (this.gridPoints.length === 0) {
            await this.loadCaspianGrid();
        }
        
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
        if (this.gridPoints.length === 0) {
            await this.loadCaspianGrid();
        }
        
        return this.gridPoints
            .sort((a, b) => parseFloat(b.evaporation) - parseFloat(a.evaporation))
            .slice(0, 5)
            .map((point, index) => ({
                ...point,
                rank: index + 1,
                recommendedTechnology: point.recommendedTechnology || this.recommendTechnology(point)
            }));
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
