// maplibre.js v5
// ===================================================
// Airports + Restaurants + Attractions + Globe/Map toggle + Distance
// Works on Mac M4 — Safe MapTiler key

const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/streets/style.json?key=${window.MAPTILER_KEY}`,
  center: [137.9150899566626, 36.25956997955441],
  zoom: 0,
});

map.addControl(new maplibregl.NavigationControl());

let isGlobe = true;
let airportsVisible = true;
let restaurantMarkers = [];
let attractionMarkers = [];
let airportMarkers = [];
let selectedPoints = [];

// Correct globe projection (v5 API)
map.on('style.load', () => {
  map.setProjection({ type: 'globe' });
});

// Toggle globe / flat
document.getElementById('toggle-view').addEventListener('click', () => {
  isGlobe = !isGlobe;
  map.setProjection({ type: isGlobe ? 'globe' : 'mercator' });
  document.getElementById('toggle-view').textContent = isGlobe
    ? 'Switch to Flat Map 🗺'
    : 'Switch to Globe 🌍';
});

// Load airports
(async function loadAirports() {
  const csv = await fetch(
    'https://davidmegginson.github.io/ourairports-data/airports.csv'
  ).then((r) => r.text());

  const strip = (s) => s.replace(/^"|"$/g, '');

  const airports = csv
    .trim()
    .split('\n')
    .slice(1)
    .map((l) => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/))
    .map((c) => ({
      type: strip(c[2]),
      name: strip(c[3]),
      lat: +strip(c[4]),
      lon: +strip(c[5]),
      city: strip(c[10]),
      iata: strip(c[13]),
    }))
    .filter(
      (a) =>
        a.type === 'large_airport' &&
        a.iata &&
        Number.isFinite(a.lat) &&
        Number.isFinite(a.lon)
    );

  console.log(`✅ Loaded ${airports.length} airports`);

  airports.forEach((a) => {
    const marker = new maplibregl.Marker({ color: 'orange' })
      .setLngLat([a.lon, a.lat])
      .setPopup(
        new maplibregl.Popup().setHTML(
          `<b>${a.iata}</b><br>${a.city}<br>${a.name}<br>
           <button onclick="selectPoint(${a.lon}, ${a.lat}, '${a.iata}')">Select Point</button>`
        )
      )
      .addTo(map);

    airportMarkers.push(marker);
  });

  window._airports = airports;
})();

// Toggle airports ON/OFF
document.getElementById('toggle-airports').addEventListener('click', () => {
  airportsVisible = !airportsVisible;
  airportMarkers.forEach((m) =>
    airportsVisible ? (m.getElement().style.display = '') : (m.getElement().style.display = 'none')
  );
  document.getElementById('toggle-airports').textContent = airportsVisible
    ? 'Hide Airports'
    : 'Show Airports';
});

// Search bar
document.getElementById('globe-search').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;

  const q = e.target.value.trim().toUpperCase();
  const hit =
    window._airports.find((a) => a.iata === q) ||
    window._airports.find((a) => a.city?.toUpperCase() === q) ||
    window._airports.find((a) => a.name.toUpperCase().includes(q));

  if (hit) {
    map.flyTo({ center: [hit.lon, hit.lat], zoom: 7 });
  } else {
    alert('No match 😢');
  }
});

// Show restaurants
document.getElementById('toggle-restaurants').addEventListener('click', async () => {
  if (restaurantMarkers.length > 0) {
    restaurantMarkers.forEach((m) => m.remove());
    restaurantMarkers = [];
    document.getElementById('toggle-restaurants').textContent = 'Show Restaurants 🍽';
    return;
  }

  const bbox = map.getBounds();
  const query = `
    [out:json];
    (
      node["amenity"="restaurant"](${bbox.getSouth()},${bbox.getWest()},${bbox.getNorth()},${bbox.getEast()});
    );
    out;
  `;

  console.log('Fetching restaurants...');
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  const data = await fetch(url).then((r) => r.json());

  console.log(`✅ Found ${data.elements.length} restaurants`);

  data.elements.forEach((r) => {
    const m = new maplibregl.Marker({ color: 'red' })
      .setLngLat([r.lon, r.lat])
      .setPopup(
        new maplibregl.Popup().setHTML(
          `<b>${r.tags?.name || 'Unnamed'}</b><br>
           Cuisine: ${r.tags?.cuisine || 'Unknown'}<br>
           Hours: ${r.tags?.opening_hours || 'N/A'}<br>
           <button onclick="selectPoint(${r.lon}, ${r.lat}, '${r.tags?.name || 'Restaurant'}')">Select Point</button>`
        )
      )
      .addTo(map);

    restaurantMarkers.push(m);
  });

  document.getElementById('toggle-restaurants').textContent = 'Hide Restaurants 🍽';
});

// Show attractions
document.getElementById('toggle-attractions').addEventListener('click', async () => {
  if (attractionMarkers.length > 0) {
    attractionMarkers.forEach((m) => m.remove());
    attractionMarkers = [];
    document.getElementById('toggle-attractions').textContent = 'Show Attractions 🎡';
    return;
  }

  const bbox = map.getBounds();
  const query = `
    [out:json];
    (
      node["tourism"="attraction"](${bbox.getSouth()},${bbox.getWest()},${bbox.getNorth()},${bbox.getEast()});
    );
    out;
  `;

  console.log('Fetching attractions...');
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  const data = await fetch(url).then((r) => r.json());

  console.log(`✅ Found ${data.elements.length} attractions`);

  data.elements.forEach((r) => {
    const m = new maplibregl.Marker({ color: 'purple' })
      .setLngLat([r.lon, r.lat])
      .setPopup(
        new maplibregl.Popup().setHTML(
          `<b>${r.tags?.name || 'Unnamed Attraction'}</b><br>
           <button onclick="selectPoint(${r.lon}, ${r.lat}, '${r.tags?.name || 'Attraction'}')">Select Point</button>`
        )
      )
      .addTo(map);

    attractionMarkers.push(m);
  });

  document.getElementById('toggle-attractions').textContent = 'Hide Attractions 🎡';
});

// Select ANY point → show distance
window.selectPoint = function (lon, lat, label = 'Point') {
  selectedPoints.push({ lon, lat, label });

  if (selectedPoints.length === 2) {
    const p1 = selectedPoints[0];
    const p2 = selectedPoints[1];

    const distanceKm = haversineDistance([p1.lon, p1.lat], [p2.lon, p2.lat]);

    alert(`Distance between "${p1.label}" and "${p2.label}": ${distanceKm.toFixed(2)} km`);

    // Reset
    selectedPoints = [];
  } else {
    alert(`Selected "${label}". Select another point.`);
  }
};

// Haversine formula
function haversineDistance([lon1, lat1], [lon2, lat2]) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
