const map = L.map('map').setView([25.2048, 55.2708], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © OpenStreetMap contributors',
}).addTo(map);

async function checkFlight() {
    const flightNum = document.getElementById("flightInput").value;
    const res = await fetch(`http://localhost:3000/flight?flightNumber=${flightNum}`);
    const data = await res.json();

    const resultDiv = document.getElementById("result");

    if (data.departure) {
        resultDiv.innerHTML = `
            <h2>${data.airline.name} ${data.flight.iata}</h2>
            <p><strong>From:</strong> ${data.departure.airport} (${data.departure.iata})</p>
            <p><strong>To:</strong> ${data.arrival.airport} (${data.arrival.iata})</p>
            <p><strong>Departure:</strong> ${data.departure.scheduled}</p>
            <p><strong>Arrival:</strong> ${data.arrival.scheduled}</p>
            <p><strong>Status:</strong> ${data.flight_status}</p>
        `;
    } else {
        resultDiv.innerHTML = "Flight not found.";
    }
}