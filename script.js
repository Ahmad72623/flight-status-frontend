const map = L.map('map').setView([25.2048, 55.2708], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © OpenStreetMap contributors',
}).addTo(map);

let currentMarker = null;
let currentCallsign = null;
let refreshInterval = null;

// Airline prefix mapper
function getCallsign(iataFlight) {
    const airlinePrefixes = {
        EK: "UAE", QR: "QTR", BA: "BAW", LH: "DLH", AF: "AFR", EY: "ETD",
        KL: "KLM", TK: "THY", DL: "DAL", UA: "UAL", AA: "AAL", B6: "JBU",
        SV: "SVA", MS: "MSR"
    };

    const prefix = iataFlight.slice(0, 2).toUpperCase();
    const number = iataFlight.slice(2);
    const mappedPrefix = airlinePrefixes[prefix];
    return mappedPrefix ? mappedPrefix + number : iataFlight.toUpperCase();
}

async function checkFlight() {
    const flightNum = document.getElementById("flightInput").value.trim();
    if (!flightNum) {
        alert("Please enter a flight number (e.g., EK203)");
        return;
    }

    const resultDiv = document.getElementById("result");

    try {
        const res = await fetch(`https://flight-status-backend-amgneka5cneeh0bp.uaenorth-01.azurewebsites.net/flight?flightNumber=${flightNum}`);
        if (!res.ok) {
            resultDiv.innerHTML = " Flight not found or not flying right now.";
            return;
        }

        const data = await res.json();

        resultDiv.innerHTML = `
            <h2>${data.airline.name} ${data.flight.iata}</h2>
            <p><strong>From:</strong> ${data.departure.airport} (${data.departure.iata})</p>
            <p><strong>To:</strong> ${data.arrival.airport} (${data.arrival.iata})</p>
            <p><strong>Departure:</strong> ${data.departure.scheduled}</p>
            <p><strong>Arrival:</strong> ${data.arrival.scheduled}</p>
            <p><strong>Status:</strong> ${data.flight_status}</p>
        `;

        // Get mapped callsign
        const callsign = getCallsign(data.flight.iata);
        currentCallsign = callsign;

        
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(() => loadLiveFlightPosition(currentCallsign), 60000); // every 30 sec we refresh


        loadLiveFlightPosition(callsign); // initial plot
    } catch (err) {
        console.error("Backend error:", err);
        resultDiv.innerHTML = " Server error. Please try again later.";
    }
}

async function loadLiveFlightPosition(flightCode) {
    try {
        const res = await fetch('https://opensky-network.org/api/states/all');
        const data = await res.json();

        const matchedFlights = data.states.filter(state => {
            if (!state[1]) return false;
            const cleanedCallsign = state[1].replace(/\s+/g, '').toUpperCase();
            return cleanedCallsign.includes(flightCode.toUpperCase());
        });

        if (matchedFlights.length > 0) {
            const flight = matchedFlights[0];
            const lat = flight[6];
            const lon = flight[5];
            const callsign = flight[1].trim();

            if (currentMarker) map.removeLayer(currentMarker);

            currentMarker = L.marker([lat, lon])
                .addTo(map)
                .bindPopup(`✈️ ${callsign} live position`)
                .openPopup();

            map.setView([lat, lon], 6);

            console.log(` Updated ${callsign} at [${lat}, ${lon}]`);
        } else {
            console.warn(" No matching flight found in OpenSky right now.");
        }
    } catch (error) {
        console.error("Error fetching OpenSky data:", error);
    }
}
