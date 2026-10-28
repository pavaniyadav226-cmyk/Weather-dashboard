// ---------- Config ----------
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const form = $("search-form");
const input = $("city-input");
const searchBtn = $("search-btn");
const geoBtn = $("geo-btn");
const statusEl = $("status");
const currentEl = $("current");
const forecastSection = $("forecast-section");
const forecastEl = $("forecast");
const unitC = $("unit-c");
const unitF = $("unit-f");

// ---------- State ----------
let unit = localStorage.getItem("unit") || "celsius";
let lastPlace = null; // { latitude, longitude, label }

// WMO weather codes -> [description, emoji]
const WEATHER_CODES = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"], 48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Heavy drizzle", "🌦️"],
  56: ["Freezing drizzle", "🌧️"], 57: ["Freezing drizzle", "🌧️"],
  61: ["Light rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"], 67: ["Freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy snow", "❄️"], 77: ["Snow grains", "❄️"],
  80: ["Rain showers", "🌦️"], 81: ["Heavy showers", "🌧️"], 82: ["Violent showers", "⛈️"],
  85: ["Snow showers", "🌨️"], 86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm with hail", "⛈️"], 99: ["Severe thunderstorm", "⛈️"],
};
const describe = (code) => WEATHER_CODES[code] || ["Unknown", "❓"];
const isRainy = (code) => [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code);

// ---------- UI helpers ----------
function setStatus(message, type = "") {
  statusEl.className = "status" + (type === "error" ? " error" : "");
  statusEl.innerHTML = "";
  if (type === "loading") {
    const s = document.createElement("span");
    s.className = "spinner";
    statusEl.appendChild(s);
  }
  statusEl.appendChild(document.createTextNode(message));
}

function setBusy(busy) {
  searchBtn.disabled = busy;
  geoBtn.disabled = busy;
  if (busy) setStatus("Loading weather data…", "loading");
}

function updateUnitButtons() {
  unitC.classList.toggle("active", unit === "celsius");
  unitF.classList.toggle("active", unit === "fahrenheit");
}

// ---------- API layer ----------
async function fetchJSON(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new Error("Network error. Please check your internet connection.");
  }
  if (!response.ok) {
    throw new Error(`Server error (${response.status}). Please try again later.`);
  }
  try {
    return await response.json();
  } catch (err) {
    throw new Error("Received an invalid response from the server.");
  }
}

async function getCoordinates(city) {
  const url = `${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const data = await fetchJSON(url);
  if (!data.results || data.results.length === 0) {
    throw new Error(`City "${city}" not found. Check the spelling and try again.`);
  }
  const { latitude, longitude, name, admin1, country } = data.results[0];
  return { latitude, longitude, label: [name, admin1, country].filter(Boolean).join(", ") };
}

async function getWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,pressure_msl",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: 5,
    temperature_unit: unit,
    wind_speed_unit: unit === "fahrenheit" ? "mph" : "kmh",
  });
  return fetchJSON(`${WEATHER_URL}?${params}`);
}

// ---------- Rendering ----------
function renderCurrent(label, data) {
  const { current, current_units: u } = data;
  const [text, emoji] = describe(current.weather_code);

  $("location").textContent = label;
  $("condition").textContent = text;
  $("icon").textContent = emoji;
  $("temp").textContent = `${Math.round(current.temperature_2m)}${u.temperature_2m}`;
  $("feels").textContent = `${Math.round(current.apparent_temperature)}${u.apparent_temperature}`;
  $("humidity").textContent = `${current.relative_humidity_2m}${u.relative_humidity_2m}`;
  $("wind").textContent = `${current.wind_speed_10m} ${u.wind_speed_10m}`;
  $("pressure").textContent = `${Math.round(current.pressure_msl)} ${u.pressure_msl}`;
  $("updated").textContent = "Local time: " + new Date(current.time).toLocaleString("en-US", {
    weekday: "short", hour: "numeric", minute: "2-digit",
  });

  document.body.classList.toggle("night", current.is_day === 0);
  document.body.classList.toggle("rain", current.is_day === 1 && isRainy(current.weather_code));
  currentEl.classList.remove("hidden");
}

function renderForecast(data) {
  const { daily, daily_units: u } = data;
  forecastEl.innerHTML = "";
  daily.time.forEach((date, i) => {
    const [text, emoji] = describe(daily.weather_code[i]);
    const dayName = new Date(date + "T00:00").toLocaleDateString("en-US", { weekday: "short" });
    const card = document.createElement("div");
    card.className = "day";
    card.innerHTML = `
      <div>${dayName}</div>
      <div class="emoji" title="${text}">${emoji}</div>
      <div><strong>${Math.round(daily.temperature_2m_max[i])}${u.temperature_2m_max}</strong></div>
      <div class="muted">${Math.round(daily.temperature_2m_min[i])}${u.temperature_2m_min}</div>
    `;
    forecastEl.appendChild(card);
  });
  forecastSection.classList.remove("hidden");
}

// ---------- Main flows ----------
async function showWeather(place) {
  const weather = await getWeather(place.latitude, place.longitude);
  lastPlace = place;
  renderCurrent(place.label, weather);
  renderForecast(weather);
  setStatus("");
}

function showFailure(err) {
  currentEl.classList.add("hidden");
  forecastSection.classList.add("hidden");
  setStatus(err.message, "error");
}

async function searchCity(city) {
  setBusy(true);
  try {
    const place = await getCoordinates(city);
    await showWeather(place);
    localStorage.setItem("lastCity", city);
  } catch (err) {
    showFailure(err);
  } finally {
    setBusy(false);
  }
}

function useMyLocation() {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported by your browser.", "error");
    return;
  }
  setBusy(true);
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        await showWeather({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: "Your location",
        });
      } catch (err) {
        showFailure(err);
      } finally {
        setBusy(false);
      }
    },
    () => {
      setBusy(false);
      setStatus("Couldn't get your location. Please allow location access or search by city.", "error");
    },
    { timeout: 10000 }
  );
}

async function changeUnit(newUnit) {
  if (newUnit === unit) return;
  unit = newUnit;
  localStorage.setItem("unit", unit);
  updateUnitButtons();
  if (!lastPlace) return;
  setBusy(true);
  try {
    await showWeather(lastPlace);
  } catch (err) {
    showFailure(err);
  } finally {
    setBusy(false);
  }
}

// ---------- Events ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = input.value.trim();
  if (!city) return setStatus("Please enter a city name.", "error");
  searchCity(city);
});
geoBtn.addEventListener("click", useMyLocation);
unitC.addEventListener("click", () => changeUnit("celsius"));
unitF.addEventListener("click", () => changeUnit("fahrenheit"));

window.addEventListener("DOMContentLoaded", () => {
  updateUnitButtons();
  const city = localStorage.getItem("lastCity") || "Hyderabad";
  input.value = city;
  searchCity(city);
});