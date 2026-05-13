class OpenStreetMap extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			locations: [], // Array of objects like: { lat: 51.505, lng: -0.09, title: "London" }
			centerCoords: null, // { lat: 51.505, lng: -0.09 }
			initialZoomLevel: 13,
		};
	}

	async require() {
		// Asynchronously load the Leaflet script and style
		try {
			await Promise.all([
				this.loadScript("leaflet-js", "L"),
				this.loadStyle("leaflet-css")
			]);
		} catch (error) {
			console.error("OpenStreetMap: Failed to load Leaflet.", error);
		}
	}

	mount() {
		if (typeof window.L === "undefined") {
			console.error("OpenStreetMap: Leaflet (L) is not defined on window.");
			return;
		}

		let center = this.options.centerCoords;

		if (!center) {
			if (this.options.locations && this.options.locations.length > 0) {
				// Calculate center from locations
				let sumLat = 0;
				let sumLng = 0;
				for (let i = 0; i < this.options.locations.length; i++) {
					sumLat += this.options.locations[i].lat;
					sumLng += this.options.locations[i].lng;
				}
				center = {
					lat: sumLat / this.options.locations.length,
					lng: sumLng / this.options.locations.length
				};
			} else {
				// Default fallback center (e.g., somewhere generic if no locations provided)
				center = { lat: 0, lng: 0 };
				console.warn("OpenStreetMap: No centerCoords or locations provided. Defaulting to [0, 0].");
			}
		}

		// Initialize map
		this.map = L.map(this.element).setView([center.lat, center.lng], this.options.initialZoomLevel);

		// Add OpenStreetMap tile layer
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(this.map);

		// Add markers
		if (this.options.locations && this.options.locations.length > 0) {
			for (let i = 0; i < this.options.locations.length; i++) {
				const loc = this.options.locations[i];
				const marker = L.marker([loc.lat, loc.lng]).addTo(this.map);
				if (loc.title) {
					marker.bindPopup(loc.title);
				}
			}
		}
	}

	unmount() {
		if (this.map) {
			this.map.remove();
			this.map = null;
		}
	}
}

gia.register(OpenStreetMap);

/**
 * Expected HTML Structure:
 *
 * <!-- Required External Resources in <head> or before component: -->
 * <!-- <link id="leaflet-css" rel="stylesheet" data-href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" /> -->
 *
 * <!-- Required External Script (usually at end of <body>): -->
 * <!-- <script id="leaflet-js" data-src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script> -->
 *
 * <div
 *   data-component="OpenStreetMap"
 *   data-options='{"locations": [{"lat": 51.505, "lng": -0.09, "title": "London"}, {"lat": 51.51, "lng": -0.1, "title": "Another Point"}], "initialZoomLevel": 12}'
 *   style="height: 400px; width: 100%;">
 * </div>
 *
 * Suggested SCSS:
 *
 * [data-component="OpenStreetMap"] {
 *   // Ensure the map container has a height, otherwise Leaflet won't render properly.
 *   min-height: 400px;
 *   background: #eee;
 * }
 */
