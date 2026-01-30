const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");
const loading = document.getElementById("loading");

const currentTemp = document.getElementById("current-temp");
const currentCondition = document.getElementById("current-condition");
const currentIcon = document.getElementById("current-icon");
const currentLocation = document.getElementById("current-location");

const feelsLike = document.getElementById("feels-like");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const uvIndex = document.getElementById("uv-index");
const lastUpdated = document.getElementById("last-updated");

const dailyCards = document.getElementById("daily-cards");

const icons = {
    0:"fa-sun",1:"fa-cloud-sun",2:"fa-cloud",3:"fa-cloud",
    61:"fa-cloud-rain",71:"fa-snowflake",95:"fa-bolt"
};

document.addEventListener("DOMContentLoaded", () => loadCity("New York"));

searchBtn.onclick = () => loadCity(cityInput.value.trim());
locationBtn.onclick = getLocation;

async function loadCity(city) {
    if (!city) return;
    loading.style.display = "block";

    const geo = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${city}&format=json&limit=1`
    ).then(r => r.json());

    if (!geo[0]) return;

    const { lat, lon, display_name } = geo[0];
    loadWeather(lat, lon, display_name.split(",")[0]);
}

async function loadWeather(lat, lon, name) {
    const data = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max&timezone=auto`
    ).then(r => r.json());

    const c = data.current_weather;

    currentTemp.textContent = Math.round(c.temperature);
    currentCondition.textContent = "Weather";
    currentIcon.innerHTML = `<i class="fas ${icons[c.weathercode] || 'fa-cloud'}"></i>`;
    currentLocation.textContent = name;

    dailyCards.innerHTML = "";
    for (let i = 1; i <= 3; i++) {
        dailyCards.innerHTML += `
            <div class="forecast-card">
                <p>${new Date(data.daily.time[i]).toLocaleDateString('en',{weekday:'short'})}</p>
                <i class="fas ${icons[data.daily.weathercode[i]] || 'fa-cloud'}"></i>
                <h3>${Math.round(data.daily.temperature_2m_max[i])}°</h3>
            </div>`;
    }

    lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString()}`;
    loading.style.display = "none";
}

function getLocation() {
    navigator.geolocation.getCurrentPosition(pos => {
        loadWeather(pos.coords.latitude, pos.coords.longitude, "Your Location");
    });
}
