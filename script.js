const WEATHER_API_TOKEN = "47efd47a8c058eaaf312d3358aa92a91";
const loadingMessage = document.querySelector(".loading-message");
const showLoading = () => loadingMessage.style.display = "block";
const hideLoading = () => loadingMessage.style.display = "none";
const cityInput = document.querySelector(".city_Name");
const weatherCardsDiv = document.querySelector(".forecast_Cards");
const currentWeatherDiv = document.querySelector(".current_Details");
const recentCitiesDropdown = document.querySelector(".recent_Cities");


const constructWeatherDisplay = (region, forecastDetails, Count) => { // Function for main weather card
    const tempInCelsius = (forecastDetails.main.temp - 273.15).toFixed(2);
    const dateText = forecastDetails.dt_txt.split(" ")[0];
    const humidityHtml = `<div class="weather-detail"><img src="icons/humidity.png" alt="humidity-icon" class="weather-icon"><h4>Humidity : ${forecastDetails.main.humidity}%</h4></div>`;
    const windHtml = `<div class="weather-detail"><img src="icons/wind.png" alt="wind-icon" class="weather-icon"><h4>Wind : ${forecastDetails.wind.speed}M/S</h4></div>`;
    const weatherIconUrl = `https://openweathermap.org/img/wn/${forecastDetails.weather[0].icon}@2x.png`;

    if (Count === 0) {
        return `
            <div class="details">
                <h2>${region} (${dateText})</h2>
                <h4 class="temph4">${tempInCelsius}°C</h4>
                ${humidityHtml}
                ${windHtml}
            </div>
            <div class="icon">
                <img src="${weatherIconUrl}" alt="weather-icon">
                <h4>${forecastDetails.weather[0].description}</h4>
            </div>`;
    } else {
        return `
            <li class="card">
                <h3>${dateText}</h3>
                <img src="${weatherIconUrl}" alt="weather-icon">
                <h4>Temp: ${tempInCelsius}°C</h4>
                <h4>Wind: ${forecastDetails.wind.speed} M/S</h4>
                <h4>Humidity: ${forecastDetails.main.humidity}%</h4>
            </li>`;
    }
};


const addCityToDropdown = (region) => {  // Function to add city to session storage and update dropdown
    let recentCities = JSON.parse(sessionStorage.getItem("recentCities")) || [];
    if (!recentCities.includes(region)) {
        recentCities.push(region);
        sessionStorage.setItem("recentCities", JSON.stringify(recentCities));
        updateDropdown();
    }
};


const updateDropdown = () => { // Function to update the dropdown 
    let recentCities = JSON.parse(sessionStorage.getItem("recentCities")) || [];
    recentCitiesDropdown.style.display = recentCities.length > 0 ? "block" : "none";
    recentCitiesDropdown.innerHTML = recentCities.map(city => `<option value="${city}">${city}</option>`).join("");
};


const retrieveWeatherData = async (region, lat, lon) => {  // Function to get weather details
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_TOKEN}`);
        if (!res.ok) throw new Error("Unable to fetch weather details. Please try again.");
        
        const data = await res.json();
        const uniqueForecastDays = [];
        const weatherForecastArray = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            return !uniqueForecastDays.includes(forecastDate) && uniqueForecastDays.push(forecastDate);
        });

        // Clear previous data after search
        cityInput.value = "";
        weatherCardsDiv.innerHTML = "";
        currentWeatherDiv.innerHTML = "";

        // Populate the weather data
        weatherForecastArray.forEach((forecastDetails, Count) => {
            const displayHtml = constructWeatherDisplay(region, forecastDetails, Count);
            Count === 0 ? currentWeatherDiv.insertAdjacentHTML("beforeend", displayHtml) : weatherCardsDiv.insertAdjacentHTML("beforeend", displayHtml);
        });
    } catch {
        alert("An error occurred while fetching the weather details!");
    }
};



const getCityLatLon = () => {   // Function to get city coordinates based on city name input
    const region = cityInput.value.trim();
    if (!region) return alert("Please enter a city name!");
    showLoading(); // Show loading message
    fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${region}&limit=1&appid=${WEATHER_API_TOKEN}`)
        .then(res => {
            if (!res.ok) throw new Error("Unable to fetch coordinates. Please try again.");
            return res.json();
        })
        .then(data => {
            if (!data.length) return alert(`No coordinates found for ${region}`);
            const { name, lat, lon } = data[0];
            retrieveWeatherData(name, lat, lon);
            addCityToDropdown(name);
            hideLoading(); 
        })
        .catch(error => {
            alert("An error occurred: " + error.message);
            hideLoading(); 
        });
};


const fetchUserLocation = () => {  // Function to get user coordinates using geolocation
    showLoading(); 
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            fetch(`http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${WEATHER_API_TOKEN}`)
                .then(res => {
                    if (!res.ok) throw new Error("Unable to fetch city name based on location.");
                    return res.json();
                })
                .then(data => {
                    const { name } = data[0];
                    retrieveWeatherData(name, latitude, longitude);
                    hideLoading(); 
                })
                .catch(() => {
                    alert("An error occurred while fetching the city!");
                    hideLoading(); 
                });
        },
        error => {
            alert(error.code === error.PERMISSION_DENIED ? "Request denied. Please reset location services!" : "An error occurred while getting your location: " + error.message);
            hideLoading(); 
        }
    );
};

document.querySelector(".city_Search").addEventListener("click", getCityLatLon); // Event listener for city search button
document.querySelector(".location_Search").addEventListener("click", fetchUserLocation); // Event listener for location search button
recentCitiesDropdown.addEventListener("change", e => {
    const selectedCity = e.target.value;
    fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${selectedCity}&limit=1&appid=${WEATHER_API_TOKEN}`)
        .then(res => {
            if (!res.ok) throw new Error("Unable to fetch coordinates for the selected city.");
            return res.json();
        })
        .then(data => {
            if (!data.length) return alert(`No coordinates found for ${selectedCity}`);
            const { name, lat, lon } = data[0];
            retrieveWeatherData(name, lat, lon);
        })
        .catch(error => alert("An error occurred: " + error.message));
});

// Initialize dropdown on page load
document.addEventListener("DOMContentLoaded", updateDropdown);
