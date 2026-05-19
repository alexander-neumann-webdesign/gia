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
			dropzone: [],
			conditions: [],
		};

		this.originalDropzoneLabels = new Map();

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

		if (this.ref.submitBtn) {
			this.originalSubmitBtnHTML = this.ref.submitBtn.innerHTML;
		}

		if (this.ref.successMessage && !this.ref.successMessage.hasAttribute('role')) {
			this.ref.successMessage.setAttribute('role', 'status');
		}

		if (this.ref.errorMessage && !this.ref.errorMessage.hasAttribute('role')) {
			this.ref.errorMessage.setAttribute('role', 'alert');
		}

		if (this.ref.dropzone) {
			const dropzones = Array.isArray(this.ref.dropzone) ? this.ref.dropzone : [this.ref.dropzone];
			dropzones.forEach((dropzone) => {
				dropzone.addEventListener('dragover', this.handleDragOver);
				dropzone.addEventListener('dragleave', this.handleDragLeave);
				dropzone.addEventListener('drop', this.handleDrop);

				const fileInput = dropzone.querySelector('input[type="file"]');
				if (fileInput) {
					fileInput.addEventListener('change', this.handleFileChange);
				}

				const label = dropzone.querySelector('.form-dropzone-label');
				if (label) {
					this.originalDropzoneLabels.set(dropzone, label.textContent);
				}
			});
		}
	}

	handleDragOver(event) {
		event.preventDefault();
		const dropzone = event.currentTarget;
		dropzone.classList.add('is-dragover');
	}

	handleDragLeave(event) {
		event.preventDefault();
		const dropzone = event.currentTarget;
		dropzone.classList.remove('is-dragover');
	}

	handleDrop(event) {
		event.preventDefault();
		const dropzone = event.currentTarget;
		dropzone.classList.remove('is-dragover');

		const fileInput = dropzone.querySelector('input[type="file"]');
		if (fileInput && event.dataTransfer.files.length > 0) {
			fileInput.files = event.dataTransfer.files;
			// Manually dispatch change event so handleFileChange fires
			fileInput.dispatchEvent(new Event('change', { bubbles: true }));
		}
	}

	handleFileChange(event) {
		const fileInput = event.target;
		const dropzone = fileInput.closest('[data-ref="dropzone"]') || fileInput.closest('.form-dropzone');
		if (!dropzone) return;

		const label = dropzone.querySelector('.form-dropzone-label');
		if (label) {
			if (fileInput.files && fileInput.files.length > 1) {
				label.textContent = `${fileInput.files.length} files selected`;
			} else if (fileInput.files && fileInput.files.length === 1) {
				label.textContent = fileInput.files[0].name;
			} else {
				// Restore original
				const originalText = this.originalDropzoneLabels.get(dropzone);
				if (originalText) {
					label.textContent = originalText;
				}
			}
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
		if (this.ref.dropzone) {
			const dropzones = Array.isArray(this.ref.dropzone) ? this.ref.dropzone : [this.ref.dropzone];
			dropzones.forEach((dropzone) => {
				dropzone.removeEventListener('dragover', this.handleDragOver);
				dropzone.removeEventListener('dragleave', this.handleDragLeave);
				dropzone.removeEventListener('drop', this.handleDrop);

				const fileInput = dropzone.querySelector('input[type="file"]');
				if (fileInput) {
					fileInput.removeEventListener('change', this.handleFileChange);
				}
			});
		}
	}

	evaluateConditions() {
		if (!this.ref.conditions || this.ref.conditions.length === 0) return;

		let formData = new FormData(this.formElement);

		this.ref.conditions.forEach(el => {
			const conditionString = el.getAttribute('data-condition');
			if (!conditionString) return;

			// Support "fieldName:expectedValue" format
			const parts = conditionString.split(':');
			const fieldName = parts[0];
			const expectedValue = parts.length > 1 ? parts.slice(1).join(':') : undefined;

			const actualValues = formData.getAll(fieldName);

			let conditionMet = false;

			if (expectedValue !== undefined) {
				conditionMet = actualValues.includes(expectedValue);
			} else {
				// If no expected value is specified, just check if the field has ANY value
				conditionMet = actualValues.some(val => val !== "");
			}

			if (conditionMet) {
				el.hidden = false;
				const inputs = el.querySelectorAll('input, select, textarea');
				inputs.forEach(input => {
					if (input.hasAttribute('data-disabled-by-condition')) {
						input.disabled = false;
						input.removeAttribute('data-disabled-by-condition');
					}
				});
			} else {
				el.hidden = true;
				const inputs = el.querySelectorAll('input, select, textarea');
				inputs.forEach(input => {
					if (!input.disabled) {
						input.disabled = true;
						input.setAttribute('data-disabled-by-condition', 'true');
					}
				});
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

				// Reset dropzone labels
				if (this.ref.dropzone) {
					const dropzones = Array.isArray(this.ref.dropzone) ? this.ref.dropzone : [this.ref.dropzone];
					dropzones.forEach(dropzone => {
						const label = dropzone.querySelector('.form-dropzone-label');
						const originalText = this.originalDropzoneLabels.get(dropzone);
						if (label && originalText) {
							label.textContent = originalText;
						}
					});
				}
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
 *     <div class="form-group">
 *       <label><input type="checkbox" name="subscribe" value="yes" /> Subscribe to newsletter</label>
 *     </div>
 *     <div class="form-group" data-condition="subscribe:yes">
 *       <label for="newsletter_email">Newsletter Email</label>
 *       <input type="email" id="newsletter_email" name="newsletter_email" required />
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
