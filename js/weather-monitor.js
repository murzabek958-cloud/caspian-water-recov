// Weather monitoring module
class WeatherMonitor {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.cities = [
            { name: 'Aktau', lat: 43.65, lon: 51.18 },
            { name: 'Atyrau', lat: 47.11, lon: 51.93 },
            { name: 'Baku', lat: 40.41, lon: 49.86 },
            { name: 'Makhachkala', lat: 42.97, lon: 47.51 },
            { name: 'Astrakhan', lat: 46.35, lon: 48.05 }
        ];
        this.weatherData = {};
    }

    // Get weather data for all monitored cities
    async getAllCityWeather() {
        const weatherPromises = this.cities.map(async city => {
            try {
                const data = await this.dataManager.getCityWeather(city.name);
                if (data) {
                    this.weatherData[city.name] = {
                        ...data,
                        lastUpdated: new Date().toISOString()
                    };
                }
            } catch (error) {
                console.error(`Error fetching weather for ${city.name}:`, error);
                // Use mock data if API fails
                this.weatherData[city.name] = this.getMockWeather(city.name);
            }
        });

        await Promise.all(weatherPromises);
        return this.weatherData;
    }

    // Get mock weather data for fallback
    getMockWeather(cityName) {
        const baseWeather = {
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
            },
            'Makhachkala': {
                name: 'Makhachkala',
                coord: { lat: 42.97, lon: 47.51 },
                main: {
                    temp: 25.1,
                    humidity: 68,
                    pressure: 1012
                },
                wind: {
                    speed: 7.8,
                    deg: 135
                },
                weather: [{ description: 'Clear sky' }],
                dt: Date.now()
            },
            'Astrakhan': {
                name: 'Astrakhan',
                coord: { lat: 46.35, lon: 48.05 },
                main: {
                    temp: 23.7,
                    humidity: 62,
                    pressure: 1014
                },
                wind: {
                    speed: 5.9,
                    deg: 315
                },
                weather: [{ description: 'Cloudy' }],
                dt: Date.now()
            }
        };

        return baseWeather[cityName] || baseWeather['Aktau'];
    }

    // Get weather card HTML
    getWeatherCard(cityData) {
        const weather = cityData;
        const temp = Math.round(weather.main.temp);
        const humidity = weather.main.humidity;
        const wind = Math.round(weather.wind.speed);
        
        return `
            <div class="weather-card" onclick="app.flyToWeatherCity('${weather.name}')">
                <div class="weather-city">${weather.name}</div>
                <div class="weather-temp">${temp}°C</div>
                <div class="weather-condition">${weather.weather[0].description}</div>
                <div class="weather-details">
                    <div>Humidity: ${humidity}%</div>
                    <div>Wind: ${wind} m/s</div>
                </div>
                <div class="weather-coords">
                    ${weather.coord.lat.toFixed(2)}, ${weather.coord.lon.toFixed(2)}
                </div>
            </div>
        `;
    }

    // Render weather cards to DOM
    renderWeatherCards(containerId = 'weather-monitor') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="loading">Loading weather data...</div>';

        this.getAllCityWeather().then(() => {
            const weatherHTML = Object.values(this.weatherData)
                .map(cityData => this.getWeatherCard(cityData))
                .join('');

            container.innerHTML = `
                <div class="weather-cards">
                    ${weatherHTML}
                </div>
                <div class="weather-disclaimer">
                    <small><em>Real-time weather data from OpenWeatherMap API</em></small>
                </div>
            `;
        }).catch(error => {
            console.error('Error rendering weather:', error);
            container.innerHTML = `
                <div class="error-message">
                    Error loading weather data. Using mock data for demonstration.
                </div>
            `;
            // Render with mock data
            const mockHTML = this.cities.map(city => {
                const mockData = this.getMockWeather(city.name);
                return this.getWeatherCard(mockData);
            }).join('');

            container.innerHTML = `
                <div class="weather-cards">
                    ${mockHTML}
                </div>
                <div class="weather-disclaimer">
                    <small><em>Demonstration data - API integration requires valid keys</em></small>
                </div>
            `;
        });
    }

    // Refresh weather data
    refresh() {
        this.renderWeatherCards();
    }

    // Get weather data for a specific city
    getCityWeatherData(cityName) {
        return this.weatherData[cityName] || this.getMockWeather(cityName);
    }

    // Fly to a city on the map
    flyToCity(cityName) {
        const city = this.cities.find(c => c.name === cityName);
        if (city) {
            app.mapManager.flyTo([city.lon, city.lat]);
        }
    }

    // Update single city weather (for future API calls)
    async updateCityWeather(cityName) {
        try {
            const data = await this.dataManager.getCityWeather(cityName);
            if (data) {
                this.weatherData[cityName] = {
                    ...data,
                    lastUpdated: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error(`Error updating weather for ${cityName}:`, error);
        }
    }
}
