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
		};

		this.setState({
			isSubmitting: false,
			isSuccess: false,
			isError: false,
		});

		this.handleSubmit = this.handleSubmit.bind(this);
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
		} else {
			console.warn("Form component: No form element found.");
		}
	}

	unmount() {
		if (this.formElement) {
			this.formElement.removeEventListener('submit', this.handleSubmit);
		}
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

		const formData = new FormData(this.formElement);

		// If an action is provided in options, append it for WordPress AJAX compatibility
		if (this.options.action) {
			formData.append('action', this.options.action);
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
				body: formData,
				headers: {
					'Accept': 'application/json'
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
				} else {
					this.ref.submitBtn.removeAttribute('aria-busy');
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
			}
		}

		if ('isError' in stateChanges) {
			if (this.ref.errorMessage) {
				this.ref.errorMessage.hidden = !stateChanges.isError;
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
 * [hidden] {
 *   display: none !important;
 * }
 */
