class MapLibreMap extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			projection: null, // e.g. 'globe'
			centerCoords: null, // [lng, lat]
			initialZoomLevel: 1,
			mapStyle: {
				version: 8,
				sources: {
					osm: {
						type: 'raster',
						tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
						tileSize: 256,
						maxzoom: 19,
						attribution: '&copy; OpenStreetMap Contributors'
					}
				},
				layers: [{
					id: 'osm',
					type: 'raster',
					source: 'osm',
					minzoom: 0
				}]
			},
			locations: [] // Array of [lng, lat] or {lng: 12.55, lat: 55.66, title: "Title"}
		};

		this.map = null;
		this.markers = [];
	}

	async require() {
		// Delay initialization until the map container is near the viewport
		// and the main thread is idle (meaning other components have initialized)
		await new Promise(resolve => {
			const initWhenIdle = () => {
				if ('requestIdleCallback' in window) {
					window.requestIdleCallback(resolve);
				} else {
					setTimeout(resolve, 0);
				}
			};

			const intersectionCallback = (entries) => {
				if (entries[0].isIntersecting) {
					this.unobserveIntersection(this.element, intersectionCallback);
					initWhenIdle();
				}
			};
			this.observeIntersection(this.element, intersectionCallback);
		});

		await Promise.all([
			this.loadScript('maplibre-js', 'maplibregl'),
			this.loadStyle('maplibre-css')
		]);
	}

	_calculateCenterFromLocations() {
		let minLng = Infinity, maxLng = -Infinity;
		let minLat = Infinity, maxLat = -Infinity;

		for (const location of this.options.locations) {
			let lng, lat;
			if (Array.isArray(location)) {
				[lng, lat] = location;
			} else {
				lng = location.lng;
				lat = location.lat;
			}

			if (lng < minLng) minLng = lng;
			if (lng > maxLng) maxLng = lng;
			if (lat < minLat) minLat = lat;
			if (lat > maxLat) maxLat = lat;
		}

		return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
	}

	mount() {
		let center = this.options.centerCoords;

		if (!center && this.options.locations && this.options.locations.length > 0) {
			// Calculate the center based on bounding box
			center = this._calculateCenterFromLocations();
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

		this.map.addControl(new maplibregl.NavigationControl());

		if (this.options.projection) {
			this.map.on('style.load', () => {
				this.map.setProjection({
					type: this.options.projection
				});
			});
		}

		if (this.options.locations) {
			this._addMarkers();
		}

		this.observeResize(this.element, () => {
			if (this.map) {
				this.map.resize();
			}
		});
	}

	_addMarkers() {
		for (const location of this.options.locations) {
			let lngLat, title;

			if (Array.isArray(location)) {
				lngLat = location;
			} else {
				lngLat = [location.lng, location.lat];
				title = location.title;
			}

			const marker = new maplibregl.Marker()
				.setLngLat(lngLat);

			if (title) {
				const popup = new maplibregl.Popup({ offset: 25 }).setText(title);
				marker.setPopup(popup);
			}

			marker.addTo(this.map);
			this.markers.push(marker);
		}
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

/*
========================================
EXPECTED HTML
========================================

<head>
  <!-- Include MapLibre GL JS library script with data-src for lazy loading and specific ID -->
  <script id="maplibre-js" data-src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
  <!-- Include MapLibre GL CSS -->
  <link id="maplibre-css" rel="stylesheet" data-href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css" />
</head>

<body>
  <!-- Note: the options attribute value must be valid JSON, so strictly use double quotes for strings and keys -->
  <div data-component="MapLibreMap"
       data-options='{"centerCoords": [12.550343, 55.665957], "initialZoomLevel": 6, "locations": [{"lng": 12.550343, "lat": 55.665957, "title": "Copenhagen Central"}, {"lng": 12.56, "lat": 55.67, "title": "Another Point"}]}'
       style="width: 100%; height: 500px;">
  </div>
</body>
*/
