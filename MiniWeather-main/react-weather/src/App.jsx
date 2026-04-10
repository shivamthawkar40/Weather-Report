import { useEffect, useMemo, useState } from 'react';

const icons = {
  0: 'fa-sun',
  1: 'fa-cloud-sun',
  2: 'fa-cloud',
  3: 'fa-cloud',
  61: 'fa-cloud-rain',
  71: 'fa-snowflake',
  95: 'fa-bolt'
};

const weatherLabels = {
  0: 'Clear',
  1: 'Partly cloudy',
  2: 'Cloudy',
  3: 'Overcast',
  61: 'Rainy',
  71: 'Snowy',
  95: 'Stormy'
};

const themeMap = {
  0: 'clear',
  1: 'cloudy',
  2: 'cloudy',
  3: 'cloudy',
  61: 'rainy',
  71: 'snowy',
  95: 'stormy'
};

const formatDate = (isoDate) => {
  return new Date(isoDate).toLocaleDateString('en', { weekday: 'short' });
};

const convertTemp = (celsius, unit) => {
  if (unit === 'F') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
};

function App() {
  const [city, setCity] = useState('');
  const [locationName, setLocationName] = useState('---');
  const [unit, setUnit] = useState('C');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);

  const theme = useMemo(() => themeMap[weather?.weatherCode] || 'default', [weather]);

  useEffect(() => {
    loadCity('New York');
  }, []);

  const showError = (message) => {
    setError(message);
    setLoading(false);
  };

  const loadCity = async (searchCity) => {
    if (!searchCity) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchCity)}&format=json&limit=1`
      );
      const data = await response.json();

      if (!data[0]) {
        showError('City not found. Please try again.');
        return;
      }

      const { lat, lon, display_name } = data[0];
      const displayCity = display_name.split(',')[0];
      await loadWeather(lat, lon, displayCity);
    } catch (err) {
      showError('Unable to fetch location data.');
    }
  };

  const loadWeather = async (lat, lon, displayCity) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,uv_index&daily=weathercode,temperature_2m_max&timezone=auto`
      );
      const data = await response.json();

      if (!data.current_weather) {
        showError('Weather data is unavailable.');
        return;
      }

      const current = data.current_weather;
      const hourlyIndex = data.hourly.time.findIndex((time) => time === current.time);
      const humidity = hourlyIndex >= 0 ? data.hourly.relativehumidity_2m[hourlyIndex] : null;
      const uv = hourlyIndex >= 0 ? data.hourly.uv_index[hourlyIndex] : null;

      setWeather({
        temperature: current.temperature,
        weatherCode: current.weathercode,
        condition: weatherLabels[current.weathercode] || 'Weather',
        windSpeed: current.windspeed,
        humidity,
        uvIndex: uv
      });

      const days = data.daily.time.slice(1, 4).map((day, index) => ({
        date: day,
        temperature: data.daily.temperature_2m_max[index + 1],
        weatherCode: data.daily.weathercode[index + 1]
      }));

      setForecast(days);
      setLocationName(displayCity || 'Your Location');
    } catch (err) {
      showError('Unable to fetch weather data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocation = () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        loadWeather(position.coords.latitude, position.coords.longitude, 'Your Location');
      },
      () => {
        showError('Unable to get your location.');
      }
    );
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      loadCity(city.trim());
    }
  };

  const renderDetail = (label, value, suffix = '') => (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value ?? '--'}{suffix}</span>
    </div>
  );

  return (
    <div className={`app ${theme}`}>
      <div className="page-shell">
        <header className="header">
          <div className="brand-block">
            <span className="brand-tag">MiniWeather</span>
            <h1>
              <i className="fas fa-cloud-sun"></i> Weather Dashboard
            </h1>
          </div>

          <p className="subtitle">Search any city, use your current location, and see a 3-day forecast.</p>

          <div className="controls">
            <div className="search-box">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter city name..."
              />
              <button className="action-btn" onClick={() => loadCity(city.trim())}>
                <i className="fas fa-search"></i>
              </button>
              <button className="action-btn" onClick={handleLocation}>
                <i className="fas fa-location-crosshairs"></i>
              </button>
            </div>

            <div className="unit-toggle">
              <button className={unit === 'C' ? 'active' : ''} onClick={() => setUnit('C')}>
                °C
              </button>
              <button className={unit === 'F' ? 'active' : ''} onClick={() => setUnit('F')}>
                °F
              </button>
            </div>
          </div>
        </header>

        <main className="main">
          {loading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Loading weather...</p>
            </div>
          )}

          <section className="card current-card glass">
            <div className="current-top">
              <div>
                <h2>{locationName}</h2>
                <p className="condition-text">{weather?.condition || 'Waiting for data'}</p>
              </div>
              <div className="weather-icon">
                <i className={`fas ${icons[weather?.weatherCode] || 'fa-cloud'}`}></i>
              </div>
            </div>

            <div className="current-main">
              <div className="temp-block">
                <span className="temp-value">{weather ? convertTemp(weather.temperature, unit) : '--'}</span>
                <span className="temp-unit">°{unit}</span>
              </div>
              <div className="weather-meta">
                <p>Weather speaks. Your city listens.</p>
              </div>
            </div>

            <div className="details-grid">
              {renderDetail('Feels like', weather ? convertTemp(weather.temperature, unit) : '--', `°${unit}`)}
              {renderDetail('Humidity', weather?.humidity ?? '--', '%')}
              {renderDetail('Wind speed', weather?.windSpeed ?? '--', ' km/h')}
              {renderDetail('UV index', weather?.uvIndex ?? '--')}
            </div>

            <p className="updated">Updated {new Date().toLocaleTimeString()}</p>
          </section>

          <section className="card forecast-card glass">
            <div className="forecast-header">
              <div>
                <h3>3-Day Outlook</h3>
                <p>Tap one of the city chips for instant weather.</p>
              </div>
              <div className="city-chips">
                {['New York', 'London', 'Tokyo', 'Mumbai'].map((item) => (
                  <button key={item} className="chip" onClick={() => loadCity(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="forecast-grid">
              {forecast.length > 0 ? (
                forecast.map((day) => (
                  <div key={day.date} className="forecast-tile">
                    <p>{formatDate(day.date)}</p>
                    <i className={`fas ${icons[day.weatherCode] || 'fa-cloud'}`}></i>
                    <h3>{convertTemp(day.temperature, unit)}°</h3>
                  </div>
                ))
              ) : (
                <div className="forecast-empty">
                  <p>No forecast yet. Search a city or use the location button.</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {error && (
        <div className="error-overlay">
          <div className="error-box">
            <p>{error}</p>
            <button className="action-btn" onClick={() => setError('')}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
