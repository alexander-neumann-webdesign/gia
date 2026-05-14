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
		};

		this.setState({
			isSubmitting: false,
			isSuccess: false,
			isError: false,
			requiredInputsFilled: false,
		});

		this.originalSubmitBtnHTML = '';
		this.spinnerAnimation = null;
	}

	mount() {
		// If the component is attached to the <form> itself
		if (this.element.tagName === 'FORM') {
			this.formElement = this.element;
		} else if (this.ref.form) {
			this.formElement = this.ref.form;
		} else {
			this.formElement = this.element.querySelector('form');
		}

		if (this.formElement) {
			this.formElement.addEventListener('submit', this.handleSubmit);

			this.ref.requiredInputs = this.formElement.querySelectorAll('[required]');
			this.ref.requiredInputs.forEach((input) => {
				input.addEventListener('change', this.handleInputChange);
				input.addEventListener('input', this.handleInputChange);
			});

			this.handleInputChange();
		} else {
			console.warn("Form component: No form element found.");
		}

		if (this.ref.submitBtn) {
			this.originalSubmitBtnHTML = this.ref.submitBtn.innerHTML;
		}
	}

	unmount() {
		if (this.formElement) {
			this.formElement.removeEventListener('submit', this.handleSubmit);
		}
		this.ref.requiredInputs.forEach((input) => {
			input.removeEventListener('change', this.handleInputChange);
			input.removeEventListener('input', this.handleInputChange);
		});
	}

	handleInputChange() {
		let requiredInputMissing = false;
		this.ref.requiredInputs.forEach((input) => {
			if (input.type === "checkbox") {
				if (!input.checked || input.value === "") {
					requiredInputMissing = true;
					input.classList.add("input-missing");
				} else {
					input.classList.remove("input-missing");
				}
			} else {
				if (!input.value || input.value === "") {
					requiredInputMissing = true;
					input.classList.add("input-missing");
				} else {
					input.classList.remove("input-missing");
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

		// HTML5 Validation
		if (!this.formElement.checkValidity()) {
			this.formElement.reportValidity();
			return;
		}

		this.setState({
			isSubmitting: true,
			isSuccess: false,
			isError: false
		});

		let rawData = new FormData(this.formElement);
		let data = new FormData();

		// 1. Automatically fix duplicate field names
		let uniqueKeys = [...new Set(rawData.keys())];

		uniqueKeys.forEach((key) => {
			let values = rawData.getAll(key);

			if (values.length > 1 && !key.endsWith("[]")) {
				values.forEach((value) => {
					data.append(key + "[]", value);
				});
			} else {
				values.forEach((value) => {
					data.append(key, value);
				});
			}
		});

		// 2. Smart Detection Logic for Name and Email
		let detectedName = "";
		const nameInput = this.formElement.querySelector('[autocomplete="name"]');
		if (nameInput && nameInput.value.trim() !== "") {
			detectedName = nameInput.value;
		} else {
			const givenNameInput = this.formElement.querySelector('[autocomplete="given-name"]');
			const familyNameInput = this.formElement.querySelector('[autocomplete="family-name"]');
			let parts = [];
			if (givenNameInput && givenNameInput.value) parts.push(givenNameInput.value);
			if (familyNameInput && familyNameInput.value) parts.push(familyNameInput.value);
			if (parts.length > 0) detectedName = parts.join(" ");
		}

		let detectedEmail = "";
		const emailInput = this.formElement.querySelector('[autocomplete="email"]');
		if (emailInput && emailInput.value.trim() !== "") {
			detectedEmail = emailInput.value;
		} else {
			const fallbackEmail = this.formElement.querySelector('input[type="email"], input[name*="email" i], input[name*="e-mail" i]');
			if (fallbackEmail && fallbackEmail.value) {
				detectedEmail = fallbackEmail.value;
			}
		}

		if (detectedName) data.append("detected-name", detectedName);
		if (detectedEmail) data.append("detected-email", detectedEmail);

		// If an action is provided in options, append it for WordPress AJAX compatibility
		if (this.options.action) {
			data.append('action', this.options.action);
		}

		// Use the option URL, or fallback to the form's action attribute
		const url = this.options.ajaxUrl || this.formElement.getAttribute('action');

		if (!url) {
			console.error("Form component: No AJAX URL provided.");
			this.setState({ isSubmitting: false, isError: true });
			return;
		}

		try {
			// Always use POST, as a GET request cannot have a body and WordPress AJAX usually expects POST
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

			// Assume success if the request succeeded, though WordPress AJAX often returns { success: true/false }
			if (result.success !== false) {
				this.setState({ isSubmitting: false, isSuccess: true });
				this.formElement.reset();
			} else {
				throw new Error(result.data || "Form submission failed");
			}

		} catch (error) {
			console.error("Form component error:", error);
			this.setState({ isSubmitting: false, isError: true });
		}
	}

	stateChange(stateChanges) {
		if ('isSubmitting' in stateChanges) {
			if (this.ref.submitBtn) {
				this.ref.submitBtn.disabled = stateChanges.isSubmitting;
				if (stateChanges.isSubmitting) {
					this.ref.submitBtn.setAttribute('aria-busy', 'true');
					// Inject spinner SVG
					this.ref.submitBtn.innerHTML = `
						<svg class="form-spinner-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right: 0.5rem; vertical-align: middle;">
							<line x1="12" y1="2" x2="12" y2="6"></line>
							<line x1="12" y1="18" x2="12" y2="22"></line>
							<line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
							<line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
							<line x1="2" y1="12" x2="6" y2="12"></line>
							<line x1="18" y1="12" x2="22" y2="12"></line>
							<line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
							<line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
						</svg>
						${this.originalSubmitBtnHTML}
					`;

					// Animate spinner
					const spinnerIcon = this.ref.submitBtn.querySelector('.form-spinner-icon');
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
				} else {
					this.ref.submitBtn.removeAttribute('aria-busy');
					// Restore original HTML
					if (this.spinnerAnimation) {
						this.spinnerAnimation.cancel();
						this.spinnerAnimation = null;
					}
					this.ref.submitBtn.innerHTML = this.originalSubmitBtnHTML;
				}
			}

			if (this.formElement) {
				if (stateChanges.isSubmitting) {
					this.formElement.classList.add('is-submitting');
				} else {
					this.formElement.classList.remove('is-submitting');
				}
			}
		}

		if ('isSuccess' in stateChanges) {
			if (this.ref.successMessage) {
				this.ref.successMessage.hidden = !stateChanges.isSuccess;
				if (stateChanges.isSuccess) {
					window.setTimeout(() => {
						this.ref.successMessage.scrollIntoView({ behavior: "smooth", block: "center" });
					}, 300);
				}
			}
		}

		if ('isError' in stateChanges) {
			if (this.ref.errorMessage) {
				this.ref.errorMessage.hidden = !stateChanges.isError;
				if (stateChanges.isError) {
					window.setTimeout(() => {
						this.ref.errorMessage.scrollIntoView({ behavior: "smooth", block: "center" });
					}, 300);
				}
			}
		}
	}
}

gia.register(Form);

/**
 * Expected HTML Structure:
 *
 * <div data-component="Form" data-options='{"ajaxUrl": "/wp-admin/admin-ajax.php", "action": "my_contact_form"}'>
 *   <form data-ref="form" method="POST">
 *     <div class="form-group">
 *       <label for="name">Name</label>
 *       <input type="text" id="name" name="name" required />
 *     </div>
 *     <div class="form-group">
 *       <label for="email">Email</label>
 *       <input type="email" id="email" name="email" required />
 *     </div>
 *     <div class="form-group">
 *       <label for="message">Message</label>
 *       <textarea id="message" name="message" required></textarea>
 *     </div>
 *     <button type="submit" data-ref="submitBtn">Send Message</button>
 *   </form>
 *
 *   <div data-ref="successMessage" hidden class="form-success">
 *     Thank you for your message. It has been sent.
 *   </div>
 *   <div data-ref="errorMessage" hidden class="form-error">
 *     There was an error trying to send your message. Please try again later.
 *   </div>
 * </div>
 *
 * Suggested SCSS:
 *
 * .form-success {
 *   color: green;
 *   padding: 1rem;
 *   border: 1px solid green;
 *   margin-top: 1rem;
 * }
 *
 * .form-error {
 *   color: red;
 *   padding: 1rem;
 *   border: 1px solid red;
 *   margin-top: 1rem;
 * }
 *
 * .is-submitting {
 *   opacity: 0.5;
 *   pointer-events: none;
 * }
 *
 * .form-spinner-icon {
 *   margin-right: 0.5rem;
 *   vertical-align: middle;
 * }
 *
 * .input-missing {
 *   border-color: red;
 * }
 *
 * [hidden] {
 *   display: none !important;
 * }
 */
