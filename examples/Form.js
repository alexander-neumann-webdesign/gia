class Form extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			ajaxUrl: '', // URL to send the AJAX request to, often provided by WordPress (e.g., via wp_localize_script or data attribute)
			action: '', // Optional: action parameter for WordPress AJAX (e.g., 'submit_contact_form')
			addMoreFilesText: '+ Add more files',
			removeFileText: '🗑️',
			scrollToTopOnStep: true,
		};

		this.ref = {
			form: null, // The actual <form> element, if the component is a wrapper, or it could be the component element itself
			submitBtn: null,
			successMessage: null,
			errorMessage: null,
			requiredInputs: [],
			dropzone: [],
			conditions: [],
			step: [],
			nextBtn: [],
			prevBtn: [],
			stepIndicator: [],
		};

		this.originalDropzoneLabels = new Map();

		this.setState({
			isSubmitting: false,
			isSuccess: false,
			isError: false,
			requiredInputsFilled: false,
			currentStep: 0,
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

			this.handleNextStep = this.handleNextStep.bind(this);
			this.handlePrevStep = this.handlePrevStep.bind(this);

			const nextBtns = Array.isArray(this.ref.nextBtn) ? this.ref.nextBtn : (this.ref.nextBtn ? [this.ref.nextBtn] : []);
			nextBtns.forEach(btn => btn.addEventListener('click', this.handleNextStep));

			const prevBtns = Array.isArray(this.ref.prevBtn) ? this.ref.prevBtn : (this.ref.prevBtn ? [this.ref.prevBtn] : []);
			prevBtns.forEach(btn => btn.addEventListener('click', this.handlePrevStep));

			if (this.ref.step && (Array.isArray(this.ref.step) ? this.ref.step.length > 0 : true)) {
				this._updateStepUI(this.state.currentStep);
			}

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
			const dt = new DataTransfer();
			if (fileInput.files) {
				for (let i = 0; i < fileInput.files.length; i++) {
					dt.items.add(fileInput.files[i]);
				}
			}
			for (let i = 0; i < event.dataTransfer.files.length; i++) {
				dt.items.add(event.dataTransfer.files[i]);
			}
			fileInput.files = dt.files;
			// Manually dispatch change event so handleFileChange fires
			fileInput.dispatchEvent(new Event('change', { bubbles: true }));
		}
	}

	handleFileChange(event) {
		const fileInput = event.target;
		const dropzone = fileInput.closest('[data-ref="dropzone"]') || fileInput.closest('.form-dropzone');
		if (!dropzone) return;

		this.renderFileList(dropzone, fileInput);
	}

	formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	renderFileList(dropzone, fileInput) {
		const label = dropzone.querySelector('.form-dropzone-label');

		// Remove existing file list if any
		const existingList = dropzone.querySelector('.form-file-list');
		if (existingList) {
			existingList.remove();
		}

		if (fileInput.files && fileInput.files.length > 0) {
			if (label) label.hidden = true;

			const fileList = document.createElement('div');
			fileList.className = 'form-file-list';
			fileList.style.marginTop = '1rem';
			fileList.style.textAlign = 'left';
			fileList.style.position = 'relative';
			fileList.style.zIndex = '10';

			Array.from(fileInput.files).forEach(file => {
				const fileItem = this._createFileItem(file, dropzone, fileInput);
				fileList.appendChild(fileItem);
			});

			const addMoreBtn = document.createElement('button');
			addMoreBtn.type = 'button';
			addMoreBtn.className = 'add-more-files-btn';
			addMoreBtn.textContent = this.options.addMoreFilesText;
			addMoreBtn.style.marginTop = '1rem';
			addMoreBtn.style.padding = '0.5rem 1rem';
			addMoreBtn.style.cursor = 'pointer';
			addMoreBtn.style.position = 'relative';
			addMoreBtn.style.zIndex = '10';

			addMoreBtn.addEventListener('click', (e) => {
				e.preventDefault();
				const tempInput = document.createElement('input');
				tempInput.type = 'file';
				if (fileInput.multiple) tempInput.multiple = true;
				if (fileInput.accept) tempInput.accept = fileInput.accept;

				tempInput.addEventListener('change', (e) => {
					if (tempInput.files && tempInput.files.length > 0) {
						const dt = new DataTransfer();
						if (fileInput.files) {
							for (let i = 0; i < fileInput.files.length; i++) {
								dt.items.add(fileInput.files[i]);
							}
						}
						for (let i = 0; i < tempInput.files.length; i++) {
							dt.items.add(tempInput.files[i]);
						}
						fileInput.files = dt.files;
						fileInput.dispatchEvent(new Event('change', { bubbles: true }));
					}
				});

				tempInput.click();
			});

			fileList.appendChild(addMoreBtn);
			dropzone.appendChild(fileList);
		} else {
			if (label) {
				label.hidden = false;
				const originalText = this.originalDropzoneLabels.get(dropzone);
				if (originalText) {
					label.textContent = originalText;
				}
			}
		}
	}

	_createFileItem(file, dropzone, fileInput) {
		const fileItem = document.createElement('div');
		fileItem.className = 'form-file-item';
		fileItem.style.display = 'flex';
		fileItem.style.justifyContent = 'space-between';
		fileItem.style.alignItems = 'center';
		fileItem.style.padding = '0.5rem';
		fileItem.style.borderBottom = '1px solid #ccc';

		const fileInfo = document.createElement('div');
		fileInfo.className = 'form-file-info';

		const fileName = document.createElement('strong');
		fileName.textContent = file.name;
		fileName.style.display = 'block';

		const fileMeta = document.createElement('small');
		fileMeta.textContent = `${file.type || 'Unknown type'} • ${this.formatFileSize(file.size)}`;
		fileMeta.style.color = '#666';

		fileInfo.appendChild(fileName);
		fileInfo.appendChild(fileMeta);

		const removeBtn = document.createElement('button');
		removeBtn.type = 'button';
		removeBtn.className = 'remove-file-btn';
		removeBtn.textContent = this.options.removeFileText;
		removeBtn.style.background = 'none';
		removeBtn.style.border = 'none';
		removeBtn.style.cursor = 'pointer';
		removeBtn.style.fontSize = '1.2rem';
		removeBtn.setAttribute('aria-label', `Remove ${file.name}`);

		removeBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			e.preventDefault();
			this.removeFile(dropzone, fileInput, file);
		});

		fileItem.appendChild(fileInfo);
		fileItem.appendChild(removeBtn);

		return fileItem;
	}

	removeFile(dropzone, fileInput, fileToRemove) {
		const dt = new DataTransfer();
		if (fileInput.files) {
			for (let i = 0; i < fileInput.files.length; i++) {
				const file = fileInput.files[i];
				if (file !== fileToRemove) {
					dt.items.add(file);
				}
			}
		}
		fileInput.files = dt.files;
		fileInput.dispatchEvent(new Event('change', { bubbles: true }));
	}

	handleNextStep(event) {
		event.preventDefault();

		const steps = Array.isArray(this.ref.step) ? this.ref.step : [this.ref.step];
		if (!steps.length || this.state.currentStep >= steps.length - 1) return;

		const currentStepElement = steps[this.state.currentStep];

		// Validate current step
		const inputsToValidate = currentStepElement.querySelectorAll('input, select, textarea');
		let isStepValid = true;

		for (let i = 0; i < inputsToValidate.length; i++) {
			const input = inputsToValidate[i];
			if (!input.checkValidity()) {
				isStepValid = false;
				input.reportValidity();
				break;
			}
		}

		if (isStepValid) {
			this.setState({ currentStep: this.state.currentStep + 1 });
		}
	}

	handlePrevStep(event) {
		event.preventDefault();
		if (this.state.currentStep > 0) {
			this.setState({ currentStep: this.state.currentStep - 1 });
		}
	}

	_updateStepUI(currentStep) {
		const steps = Array.isArray(this.ref.step) ? this.ref.step : [this.ref.step];
		if (!steps || steps.length === 0) return;

		steps.forEach((step, index) => {
			step.hidden = index !== currentStep;
		});

		const indicators = Array.isArray(this.ref.stepIndicator) ? this.ref.stepIndicator : (this.ref.stepIndicator ? [this.ref.stepIndicator] : []);
		indicators.forEach((indicator, index) => {
			if (index === currentStep) {
				indicator.setAttribute('aria-current', 'step');
				indicator.classList.add('is-active');
			} else {
				indicator.removeAttribute('aria-current');
				indicator.classList.remove('is-active');
			}
		});

		if (this.ref.submitBtn) {
			this.ref.submitBtn.hidden = currentStep !== steps.length - 1;
		}

		if (this.options.scrollToTopOnStep && currentStep > 0) {
			window.setTimeout(() => {
				if (this.formElement) {
					this.formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}, 50);
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
		const nextBtns = Array.isArray(this.ref.nextBtn) ? this.ref.nextBtn : (this.ref.nextBtn ? [this.ref.nextBtn] : []);
		nextBtns.forEach(btn => btn.removeEventListener('click', this.handleNextStep));

		const prevBtns = Array.isArray(this.ref.prevBtn) ? this.ref.prevBtn : (this.ref.prevBtn ? [this.ref.prevBtn] : []);
		prevBtns.forEach(btn => btn.removeEventListener('click', this.handlePrevStep));
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
				this._showConditionElement(el);
			} else {
				this._hideConditionElement(el);
			}
		});
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

		const steps = Array.isArray(this.ref.step) ? this.ref.step : (this.ref.step ? [this.ref.step] : []);
		if (steps.length > 0 && this.state.currentStep < steps.length - 1) {
			this.handleNextStep(event);
			return;
		}

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
			this._resetDropzones();

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

	_resetDropzones() {
		if (!this.ref.dropzone) return;

		const dropzones = Array.isArray(this.ref.dropzone) ? this.ref.dropzone : [this.ref.dropzone];
		dropzones.forEach(dropzone => {
			const label = dropzone.querySelector('.form-dropzone-label');
			const originalText = this.originalDropzoneLabels.get(dropzone);
			if (label && originalText) {
				label.textContent = originalText;
			}

			const existingList = dropzone.querySelector('.form-file-list');
			if (existingList) {
				existingList.remove();
			}
		});
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
	}

	_updateSubmittingUI(isSubmitting) {
		if (this.ref.submitBtn) {
			this.ref.submitBtn.disabled = isSubmitting;
			if (isSubmitting) {
				this.ref.submitBtn.setAttribute('aria-busy', 'true');
				// Inject spinner SVG
				this.ref.submitBtn.insertAdjacentHTML('afterbegin', `
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
				`);

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
				const spinnerIcon = this.ref.submitBtn.querySelector('.form-spinner-icon');
				if (spinnerIcon) {
					spinnerIcon.remove();
				}
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

		if ('currentStep' in stateChanges) {
			this._updateStepUI(stateChanges.currentStep);
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
 *   <div data-ref="successMessage" hidden class="form-success" role="status">
 *     Thank you for your message. It has been sent.
 *   </div>
 *   <div data-ref="errorMessage" hidden class="form-error" role="alert">
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
