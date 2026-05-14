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

	mount() {
		this.renderQRCode();
	}

	renderQRCode() {
		try {
			// Using window.qrcode from qrcode-generator
			const generator = window.qrcode || (typeof require !== 'undefined' ? require('qrcode-generator') : null);
			if (!generator) {
				console.error('qrcode-generator library not found.');
				return;
			}

			const qr = generator(this.state.typeNumber, this.state.errorCorrectionLevel);
			qr.addData(this.state.contents);
			qr.make();
			this.element.innerHTML = qr.createSvgTag();
		} catch (error) {
			console.error('Error generating QR code:', error);
			this.element.innerHTML = '<span class="error">Failed to generate QR Code</span>';
		}
	}

	stateChange(stateChanges) {
		if ('contents' in stateChanges || 'typeNumber' in stateChanges || 'errorCorrectionLevel' in stateChanges) {
			this.renderQRCode();
		}
	}
}

// In case it's used globally in standard scripts
if (typeof gia !== 'undefined') {
	gia.register(QRCode);
} else {
	window.QRCode = QRCode;
}
