# 🌤️ Weather Dashboard

A real-time weather dashboard built with **HTML, CSS and vanilla JavaScript**. It fetches live data from the free [Open-Meteo](https://open-meteo.com) REST API using the Fetch API and `async/await`, then parses and renders the nested JSON response dynamically.

## Features

- Search weather by **city name**
- Live **temperature, feels-like, humidity, wind speed and pressure**
- **5-day forecast** with daily high/low and weather icons
- **°C / °F toggle** (preference saved in `localStorage`)
- **"Use my location"** button via the Geolocation API
- Dynamic background for day, night and rainy conditions
- Comprehensive **error handling**:
  - Network failures (offline, DNS, blocked requests)
  - HTTP errors (4xx / 5xx)
  - City not found
  - Empty input and denied location access
- Loading spinner while data is being fetched
- Responsive layout for desktop and mobile
- Remembers the last searched city

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Markup   | HTML5                               |
| Styling  | CSS3 (Grid, Flexbox, custom properties) |
| Logic    | JavaScript (ES6+), Fetch API, async/await |
| Data     | Open-Meteo Geocoding & Forecast APIs |

## Project Structure

```
weather-dashboard/
├── index.html   # Page structure
├── style.css    # Styling and responsive layout
├── script.js    # API calls, error handling, rendering
└── README.md
```

## Getting Started

No installation or API key is required.

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/weather-dashboard.git
   cd weather-dashboard
   ```
2. Open `index.html` in your browser, or run it with the VS Code **Live Server** extension.
3. Type a city name and press **Search**.

## How It Works

1. **Geocoding:** the city name is sent to the Open-Meteo Geocoding API, which returns its latitude and longitude.
   ```
   GET https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1
   ```
2. **Forecast:** the coordinates are used to request current conditions and a 5-day forecast.
   ```
   GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=...&daily=...
   ```
3. **Rendering:** values are read from the nested JSON (`data.current`, `data.daily`) and inserted into the DOM. Weather codes are mapped to descriptions and emoji icons.

## Error Handling

| Scenario            | Handling                                              |
| ------------------- | ----------------------------------------------------- |
| No internet / blocked | `fetch` rejection is caught and a friendly message is shown |
| HTTP 4xx / 5xx      | `response.ok` is checked manually                     |
| Unknown city        | Empty `results` array triggers a "city not found" message |
| Invalid JSON        | `response.json()` is wrapped in `try/catch`           |
| Location denied     | Geolocation error callback shows guidance             |

## Troubleshooting

- **"Network error" message:** check your internet connection, disable ad blockers or privacy extensions, or try a different network. Some college and office networks block unfamiliar API domains.
- **Page has no styling:** make sure `index.html`, `style.css` and `script.js` are in the same folder with these exact names.

## Future Improvements

- Hourly forecast chart
- City autocomplete suggestions
- Saved favorite cities
- Air quality and UV index

## Acknowledgements

- Weather data by [Open-Meteo](https://open-meteo.com) (free for non-commercial use)

## License

This project is open source and available under the [MIT License](LICENSE).
