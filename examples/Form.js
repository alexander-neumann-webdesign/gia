class Form extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			ajaxUrl: '', // URL to send the AJAX request to, often provided by WordPress (e.g., via wp_localize_script or data attribute)
			action: '', // Optional: action parameter for WordPress AJAX (e.g., 'submit_contact_form')
		};

		this.ref = {
			form: null, // The actual <form> element, if the component is a wrapper, or it could be the component element itself
			submitBtn: null,
			successMessage: null,
			errorMessage: null,
			requiredInputs: [],
			conditions: [],
		};

		this.setState({
			isSubmitting: false,
			isSuccess: false,
			isError: false,
			requiredInputsFilled: false,
		});

		this.spinnerAnimation = null;
	}

	mount() {
		// If the component is attached to the <form> itself
		if (this.element instanceof HTMLFormElement) {
			this.formElement = this.element;
		} else if (this.ref.form) {
			this.formElement = this.ref.form;
		} else {
			this.formElement = this.element.querySelector('form');
		}

		// Accessibility: Enhance form feedback with live region roles
		if (this.ref.successMessage && !this.ref.successMessage.hasAttribute('role')) {
			this.ref.successMessage.setAttribute('role', 'status');
		}
		if (this.ref.errorMessage && !this.ref.errorMessage.hasAttribute('role')) {
			this.ref.errorMessage.setAttribute('role', 'alert');
		}

		if (this.formElement) {
			this.formElement.addEventListener('submit', this.handleSubmit);

			this.ref.requiredInputs = this.formElement.querySelectorAll('[required]');
			this.ref.requiredInputs.forEach((input) => {
				input.addEventListener('change', this.handleInputChange);
				input.addEventListener('input', this.handleInputChange);
			});

			this.ref.conditions = Array.from(this.formElement.querySelectorAll('[data-condition]'));
			if (this.ref.conditions.length > 0) {
				this.evaluateConditions = this.evaluateConditions.bind(this);
				this.formElement.addEventListener('change', this.evaluateConditions);
				this.formElement.addEventListener('input', this.evaluateConditions);
				this.evaluateConditions();
			}

			this.handleInputChange();
		} else {
			console.warn("Form component: No form element found.");
		}

		if (this.ref.successMessage && !this.ref.successMessage.hasAttribute('role')) {
			this.ref.successMessage.setAttribute('role', 'status');
		}

		if (this.ref.errorMessage && !this.ref.errorMessage.hasAttribute('role')) {
			this.ref.errorMessage.setAttribute('role', 'alert');
		}
	}

	unmount() {
		if (this.formElement) {
			this.formElement.removeEventListener('submit', this.handleSubmit);
			if (this.evaluateConditions) {
				this.formElement.removeEventListener('change', this.evaluateConditions);
				this.formElement.removeEventListener('input', this.evaluateConditions);
			}
		}
		this.ref.requiredInputs.forEach((input) => {
			input.removeEventListener('change', this.handleInputChange);
			input.removeEventListener('input', this.handleInputChange);
		});
	}

	evaluateConditions() {
		if (!this.ref.conditions || this.ref.conditions.length === 0) return;

		let formData = new FormData(this.formElement);

		this.ref.conditions.forEach(el => {
			const conditionString = el.getAttribute('data-condition');
			if (!conditionString) return;

			const conditionMet = this._checkCondition(conditionString, formData);

			if (conditionMet) {
				this._showConditionElement(el);
			} else {
				this._hideConditionElement(el);
			}
		});
	}

	_checkCondition(conditionString, formData) {
		// Support "fieldName:expectedValue" format
		const parts = conditionString.split(':');
		const fieldName = parts[0];
		const expectedValue = parts.length > 1 ? parts.slice(1).join(':') : undefined;

		const actualValues = formData.getAll(fieldName);

		if (expectedValue !== undefined) {
			return actualValues.includes(expectedValue);
		} else {
			// If no expected value is specified, just check if the field has ANY value
			return actualValues.some(val => val !== "");
		}
	}

	_showConditionElement(el) {
		el.hidden = false;
		const inputs = el.querySelectorAll('input, select, textarea');
		inputs.forEach(input => {
			if (input.hasAttribute('data-disabled-by-condition')) {
				input.disabled = false;
				input.removeAttribute('data-disabled-by-condition');
			}
		});
	}

	_hideConditionElement(el) {
		el.hidden = true;
		const inputs = el.querySelectorAll('input, select, textarea');
		inputs.forEach(input => {
			if (!input.disabled) {
				input.disabled = true;
				input.setAttribute('data-disabled-by-condition', 'true');
			}
		});
	}

	handleInputChange() {
		let requiredInputMissing = false;
		this.ref.requiredInputs.forEach((input) => {
			if (input.type === "checkbox") {
				if (!input.checked || input.value === "") {
					requiredInputMissing = true;
					input.classList.add("input-missing");
					input.setAttribute("aria-invalid", "true");
				} else {
					input.classList.remove("input-missing");
					input.removeAttribute("aria-invalid");
				}
			} else {
				if (!input.value || input.value === "") {
					requiredInputMissing = true;
					input.classList.add("input-missing");
					input.setAttribute("aria-invalid", "true");
				} else {
					input.classList.remove("input-missing");
					input.removeAttribute("aria-invalid");
				}
			}
		});

		this.setState({
			requiredInputsFilled: !requiredInputMissing,
		});
	}

	async handleSubmit(event) {
		event.preventDefault();

		if (this.state.isSubmitting) return;

		if (!this._validateForm()) return;

		this.setState({
			isSubmitting: true,
			isSuccess: false,
			isError: false
		});

		const data = this._prepareFormData();
		const url = this.options.ajaxUrl || this.formElement.getAttribute('action');

		if (!url) {
			console.error("Form component: No AJAX URL provided.");
			this.setState({ isSubmitting: false, isError: true });
			return;
		}

		try {
			await this._submitRequest(url, data);

			this.setState({ isSubmitting: false, isSuccess: true });
			this.formElement.reset();

		} catch (error) {
			console.error("Form component error:", error);
			this.setState({ isSubmitting: false, isError: true });
		}
	}

	_validateForm() {
		if (!this.formElement.checkValidity()) {
			this.formElement.reportValidity();
			return false;
		}
		return true;
	}

	_prepareFormData() {
		let rawData = new FormData(this.formElement);
		let data = new FormData();

		this._normalizeFormData(rawData, data);
		this._detectNameAndEmail(data);

		if (this.options.action) {
			data.append('action', this.options.action);
		}

		return data;
	}

	async _submitRequest(url, data) {
		let method = (this.formElement.getAttribute('method') || 'POST').toUpperCase();
		if (method !== 'POST') {
			console.warn("Form component: Forcing method to POST for AJAX submission.");
			method = 'POST';
		}

		const response = await fetch(url, {
			method: method,
			body: data,
			headers: {
				'Accept': 'application/json',
				'Cache-Control': 'no-cache'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.success === false) {
			throw new Error(result.data || "Form submission failed");
		}

		return result;
	}

	_normalizeFormData(rawData, data) {
		// 1. Automatically fix duplicate field names
		let uniqueKeys = [...new Set(rawData.keys())];

		for (let i = 0; i < uniqueKeys.length; i++) {
			const key = uniqueKeys[i];
			let values = rawData.getAll(key);

			if (values.length > 1 && !key.endsWith("[]")) {
				for (let j = 0; j < values.length; j++) {
					data.append(key + "[]", values[j]);
				}
			} else {
				for (let j = 0; j < values.length; j++) {
					data.append(key, values[j]);
				}
			}
		}
	}

	_detectNameAndEmail(data) {
		// 2. Smart Detection Logic for Name and Email
		const detectedName = this._detectName();
		const detectedEmail = this._detectEmail();

		if (detectedName) data.append("detected-name", detectedName);
		if (detectedEmail) data.append("detected-email", detectedEmail);
	}

	_detectName() {
		const nameInput = this.formElement.querySelector('[autocomplete="name"]');
		if (nameInput && nameInput.value.trim() !== "") {
			return nameInput.value;
		}
		const givenNameInput = this.formElement.querySelector('[autocomplete="given-name"]');
		const familyNameInput = this.formElement.querySelector('[autocomplete="family-name"]');
		let parts = [];
		if (givenNameInput && givenNameInput.value) parts.push(givenNameInput.value);
		if (familyNameInput && familyNameInput.value) parts.push(familyNameInput.value);
		if (parts.length > 0) return parts.join(" ");
		return "";
	}

	_detectEmail() {
		const emailInput = this.formElement.querySelector('[autocomplete="email"]');
		if (emailInput && emailInput.value.trim() !== "") {
			return emailInput.value;
		}
		const fallbackEmail = this.formElement.querySelector('input[type="email"], input[name*="email" i], input[name*="e-mail" i]');
		if (fallbackEmail && fallbackEmail.value) {
			return fallbackEmail.value;
		}
		return "";
	}

	_updateSubmittingUI(isSubmitting) {
		if (this.ref.submitBtn) {
			this.ref.submitBtn.disabled = isSubmitting;
			if (isSubmitting) {
				this.ref.submitBtn.setAttribute('aria-busy', 'true');
				this._addSpinner(this.ref.submitBtn);
			} else {
				this.ref.submitBtn.removeAttribute('aria-busy');
				this._removeSpinner(this.ref.submitBtn);
			}
		}

		if (this.formElement) {
			if (isSubmitting) {
				this.formElement.classList.add('is-submitting');
			} else {
				this.formElement.classList.remove('is-submitting');
			}
		}
	}

	_addSpinner(btn) {
		const svgNS = "http://www.w3.org/2000/svg";
		const svg = document.createElementNS(svgNS, "svg");
		svg.setAttribute("class", "form-spinner-icon");
		svg.setAttribute("width", "16");
		svg.setAttribute("height", "16");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");
		svg.setAttribute("aria-hidden", "true");
		svg.style.marginRight = "0.5rem";
		svg.style.verticalAlign = "middle";

		const lines = [
			{x1: "12", y1: "2", x2: "12", y2: "6"},
			{x1: "12", y1: "18", x2: "12", y2: "22"},
			{x1: "4.93", y1: "4.93", x2: "7.76", y2: "7.76"},
			{x1: "16.24", y1: "16.24", x2: "19.07", y2: "19.07"},
			{x1: "2", y1: "12", x2: "6", y2: "12"},
			{x1: "18", y1: "12", x2: "22", y2: "12"},
			{x1: "4.93", y1: "19.07", x2: "7.76", y2: "16.24"},
			{x1: "16.24", y1: "7.76", x2: "19.07", y2: "4.93"}
		];

		lines.forEach(attr => {
			const line = document.createElementNS(svgNS, "line");
			Object.entries(attr).forEach(([k, v]) => line.setAttribute(k, v));
			svg.appendChild(line);
		});

		btn.insertBefore(svg, btn.firstChild);

		// Animate spinner
		const spinnerIcon = btn.querySelector('.form-spinner-icon');
		if (spinnerIcon && typeof spinnerIcon.animate === 'function') {
			this.spinnerAnimation = spinnerIcon.animate([
				{ transform: 'rotate(0deg)' },
				{ transform: 'rotate(360deg)' }
			], {
				duration: 1000,
				iterations: Infinity,
				easing: 'linear'
			});
		}
	}

	_removeSpinner(btn) {
		// Restore original HTML
		if (this.spinnerAnimation) {
			this.spinnerAnimation.cancel();
			this.spinnerAnimation = null;
		}
		const spinnerIcon = btn.querySelector('.form-spinner-icon');
		if (spinnerIcon) {
			spinnerIcon.remove();
		}
	}

	_showMessage(element, isVisible) {
		if (element) {
			element.hidden = !isVisible;
			if (isVisible) {
				window.setTimeout(() => {
					element.scrollIntoView({ behavior: "smooth", block: "center" });
				}, 300);
			}
		}
	}

	stateChange(stateChanges) {
		if ('isSubmitting' in stateChanges) {
			this._updateSubmittingUI(stateChanges.isSubmitting);
		}

		if ('isSuccess' in stateChanges) {
			this._showMessage(this.ref.successMessage, stateChanges.isSuccess);
		}

		if ('isError' in stateChanges) {
			this._showMessage(this.ref.errorMessage, stateChanges.isError);
		}
	}
}

gia.register(Form);

/*
========================================
EXPECTED HTML
========================================

<div data-component="Form" data-options='{"ajaxUrl": "/wp-admin/admin-ajax.php", "action": "my_contact_form"}'>
  <form data-ref="form" method="POST">
    <div class="form-group">
      <label for="name">Name</label>
      <input type="text" id="name" name="name" required />
    </div>
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required />
    </div>
    <div class="form-group">
      <label for="message">Message</label>
      <textarea id="message" name="message" required></textarea>
    </div>
    <div class="form-group">
      <label><input type="checkbox" name="subscribe" value="yes" /> Subscribe to newsletter</label>
    </div>
    <div class="form-group" data-condition="subscribe:yes">
      <label for="newsletter_email">Newsletter Email</label>
      <input type="email" id="newsletter_email" name="newsletter_email" required />
    </div>
    <button type="submit" data-ref="submitBtn">Send Message</button>
  </form>

  <div data-ref="successMessage" hidden class="form-success" role="status">
    Thank you for your message. It has been sent.
  </div>
  <div data-ref="errorMessage" hidden class="form-error" role="alert">
    There was an error trying to send your message. Please try again later.
  </div>
</div>

========================================
SUGGESTED SCSS
========================================

.form-success {
  color: green;
  padding: 1rem;
  border: 1px solid green;
  margin-top: 1rem;
}

.form-error {
  color: red;
  padding: 1rem;
  border: 1px solid red;
  margin-top: 1rem;
}

.is-submitting {
  opacity: 0.5;
  pointer-events: none;
}

.form-spinner-icon {
  margin-right: 0.5rem;
  vertical-align: middle;
}

.input-missing {
  border-color: red;
}

[hidden] {
  display: none !important;
}
*/
