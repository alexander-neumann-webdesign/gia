class QRCode extends gia.Component {
	constructor(element) {
		super(element);
		this.options = {
			contents: this.element.getAttribute('data-contents') || 'https://example.com',
			typeNumber: parseInt(this.element.getAttribute('data-type-number')) || 4,
			errorCorrectionLevel: this.element.getAttribute('data-error-correction-level') || 'L',
		};

		this.setState({
			contents: this.options.contents,
			typeNumber: this.options.typeNumber,
			errorCorrectionLevel: this.options.errorCorrectionLevel
		});
	}

	async require() {
		// Load the script via our built-in loadScript helper.
		// Note: qrcode-generator assigns `qrcode` directly to the window in most environments.
		await this.loadScript('qrcode-generator-js', 'qrcode');
	}

	mount() {
		this.renderQRCode();
	}

	renderQRCode() {
		try {
			// In some setups, the variable might be in global scope but not explicitly window.qrcode
			// Wait until qrcode is actually defined as a function.
			const checkAndRender = () => {
				let generator;
				try {
					generator = window.qrcode || qrcode;
				} catch (e) {
					// qrcode is not defined yet
				}

				if (typeof generator === 'function') {
					const qr = generator(this.state.typeNumber, this.state.errorCorrectionLevel);
					qr.addData(this.state.contents);
					qr.make();
					const svgDoc = new DOMParser().parseFromString(qr.createSvgTag(), 'image/svg+xml');
					gia.mutate(() => {
						this.element.replaceChildren();
						this.element.appendChild(svgDoc.documentElement);
					});
				} else {
					setTimeout(checkAndRender, 100);
				}
			};

			checkAndRender();
		} catch (error) {
			console.error('Error generating QR code:', error);
			const errorSpan = document.createElement('span');
			errorSpan.className = 'error';
			errorSpan.textContent = 'Failed to generate QR Code';
			gia.mutate(() => {
				this.element.replaceChildren();
				this.element.appendChild(errorSpan);
			});
		}
	}

	stateChange(stateChanges) {
		if ('contents' in stateChanges || 'typeNumber' in stateChanges || 'errorCorrectionLevel' in stateChanges) {
			this.renderQRCode();
		}
	}
}

gia.register(QRCode);

/*
========================================
EXPECTED HTML
========================================

<head>
  <!-- Include qrcode-generator library script with data-src for lazy loading and specific ID -->
  <script id="qrcode-generator-js" data-src="https://unpkg.com/qrcode-generator@1.4.4/qrcode.js"></script>
</head>

<body>
  <div data-component="QRCode"
       data-contents="https://github.com/web-padawan/awesome-web-components"
       data-type-number="4"
       data-error-correction-level="L">
  </div>
</body>
*/
