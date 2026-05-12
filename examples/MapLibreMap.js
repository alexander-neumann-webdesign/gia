class MapLibreMap extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			centerCoords: null, // [lng, lat]
			initialZoomLevel: 1,
			mapStyle: 'https://demotiles.maplibre.org/style.json',
			locations: [] // Array of [lng, lat]
		};

		this.map = null;
		this.markers = [];
	}

	async require() {
		await this.loadScript('maplibre-js', 'maplibregl');
	}

	mount() {
		let center = this.options.centerCoords;

		if (!center && this.options.locations && this.options.locations.length > 0) {
			// Calculate the center based on bounding box
			let minLng = Infinity, maxLng = -Infinity;
			let minLat = Infinity, maxLat = -Infinity;

			for (const location of this.options.locations) {
				const [lng, lat] = location;
				if (lng < minLng) minLng = lng;
				if (lng > maxLng) maxLng = lng;
				if (lat < minLat) minLat = lat;
				if (lat > maxLat) maxLat = lat;
			}

			center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
		} else if (!center) {
			// Default fallback center
			center = [0, 0];
		}

		this.map = new maplibregl.Map({
			container: this.element,
			style: this.options.mapStyle,
			center: center,
			zoom: this.options.initialZoomLevel
		});

		if (this.options.locations) {
			for (const location of this.options.locations) {
				const marker = new maplibregl.Marker()
					.setLngLat(location)
					.addTo(this.map);
				this.markers.push(marker);
			}
		}

		this.observeResize(this.element, () => {
			if (this.map) {
				this.map.resize();
			}
		});
	}

	unmount() {
		if (this.map) {
			this.map.remove();
			this.map = null;
		}
		this.markers = [];
	}
}

gia.register(MapLibreMap);

/**
 * Expected HTML Structure:
 *
 * <head>
 *   <!-- Include MapLibre GL JS library script with data-src for lazy loading and specific ID -->
 *   <script id="maplibre-js" data-src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
 *   <!-- Include MapLibre GL CSS -->
 *   <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css" />
 * </head>
 *
 * <body>
 *   <!-- Note: the options attribute value must be valid JSON, so strictly use double quotes for strings and keys -->
 *   <div data-component="MapLibreMap"
 *        data-options='{"centerCoords": [12.550343, 55.665957], "initialZoomLevel": 6, "locations": [[12.550343, 55.665957], [12.56, 55.67]]}'
 *        style="width: 100%; height: 500px;">
 *   </div>
 * </body>
 */
