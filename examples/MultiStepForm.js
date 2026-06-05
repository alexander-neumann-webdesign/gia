class MultiStepForm extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			scrollToTopOnStep: true,
		};

		this.ref = {
			form: null,
			step: [],
			nextBtn: [],
			prevBtn: [],
			stepIndicator: [],
			submitBtn: null,
		};

		this.setState({
			currentStep: 0,
		});

		this._updateIndicatorsState = this._updateIndicatorsState.bind(this);
	}

	mount() {
		if (this.element instanceof HTMLFormElement) {
			this.formElement = this.element;
		} else if (this.ref.form) {
			this.formElement = this.ref.form;
		} else {
			this.formElement = this.element.querySelector('form');
		}

		if (this.formElement) {
			this.handleSubmit = this.handleSubmit.bind(this);
			this.formElement.addEventListener('submit', this.handleSubmit);

			this.handleNextStep = this.handleNextStep.bind(this);
			this.handlePrevStep = this.handlePrevStep.bind(this);
			this.handleStepIndicatorClick = this.handleStepIndicatorClick.bind(this);

			const nextBtns = Array.isArray(this.ref.nextBtn) ? this.ref.nextBtn : (this.ref.nextBtn ? [this.ref.nextBtn] : []);
			nextBtns.forEach(btn => btn.addEventListener('click', this.handleNextStep));

			const prevBtns = Array.isArray(this.ref.prevBtn) ? this.ref.prevBtn : (this.ref.prevBtn ? [this.ref.prevBtn] : []);
			prevBtns.forEach(btn => btn.addEventListener('click', this.handlePrevStep));

			const stepIndicators = Array.isArray(this.ref.stepIndicator) ? this.ref.stepIndicator : (this.ref.stepIndicator ? [this.ref.stepIndicator] : []);
			stepIndicators.forEach((indicator, index) => {
				indicator.addEventListener('click', (event) => this.handleStepIndicatorClick(event, index));
			});

			if (this.ref.step && (Array.isArray(this.ref.step) ? this.ref.step.length > 0 : true)) {
				this._updateStepUI(this.state.currentStep);
			}

			// Re-evaluate validity when inputs change
			this.formElement.addEventListener('change', this._updateIndicatorsState);
			this.formElement.addEventListener('input', this._updateIndicatorsState);

			this._updateIndicatorsState();
		} else {
			console.warn("MultiStepForm component: No form element found.");
		}
	}

	unmount() {
		if (this.formElement) {
			this.formElement.removeEventListener('submit', this.handleSubmit);
			this.formElement.removeEventListener('change', this._updateIndicatorsState);
			this.formElement.removeEventListener('input', this._updateIndicatorsState);
		}

		const nextBtns = Array.isArray(this.ref.nextBtn) ? this.ref.nextBtn : (this.ref.nextBtn ? [this.ref.nextBtn] : []);
		nextBtns.forEach(btn => btn.removeEventListener('click', this.handleNextStep));

		const prevBtns = Array.isArray(this.ref.prevBtn) ? this.ref.prevBtn : (this.ref.prevBtn ? [this.ref.prevBtn] : []);
		prevBtns.forEach(btn => btn.removeEventListener('click', this.handlePrevStep));
	}

	handleSubmit(event) {
		const steps = Array.isArray(this.ref.step) ? this.ref.step : (this.ref.step ? [this.ref.step] : []);
		if (steps.length > 0 && this.state.currentStep < steps.length - 1) {
			event.preventDefault();
			event.stopImmediatePropagation();
			this.handleNextStep(event);
			return;
		}
		// If on the last step, let the event pass through to the inner Form or native submit
	}

	_isStepValid(stepIndex, report = false) {
		const steps = Array.isArray(this.ref.step) ? this.ref.step : (this.ref.step ? [this.ref.step] : []);
		if (!steps || stepIndex < 0 || stepIndex >= steps.length) return true;

		const stepElement = steps[stepIndex];
		const inputsToValidate = stepElement.querySelectorAll('input, select, textarea');

		for (let i = 0; i < inputsToValidate.length; i++) {
			const input = inputsToValidate[i];
			if (!input.checkValidity()) {
				if (report) {
					input.reportValidity();
				}
				return false;
			}
		}
		return true;
	}

	_updateIndicatorsState() {
		const indicators = Array.isArray(this.ref.stepIndicator) ? this.ref.stepIndicator : (this.ref.stepIndicator ? [this.ref.stepIndicator] : []);
		let canNavigate = true;

		indicators.forEach((indicator, index) => {
			if (index > 0 && !this._isStepValid(index - 1)) {
				canNavigate = false;
			}

			if (canNavigate) {
				indicator.classList.remove('is-disabled');
				if (indicator instanceof HTMLButtonElement) {
					indicator.disabled = false;
				}
			} else {
				indicator.classList.add('is-disabled');
				if (indicator instanceof HTMLButtonElement) {
					indicator.disabled = true;
				}
			}
		});

		if (this.ref.submitBtn) {
			const steps = Array.isArray(this.ref.step) ? this.ref.step : (this.ref.step ? [this.ref.step] : []);
			let allValid = true;
			for (let i = 0; i < steps.length; i++) {
				if (!this._isStepValid(i)) {
					allValid = false;
					break;
				}
			}

			if (allValid) {
				this.ref.submitBtn.disabled = false;
				this.ref.submitBtn.classList.remove('is-disabled');
			} else {
				this.ref.submitBtn.disabled = true;
				this.ref.submitBtn.classList.add('is-disabled');
			}
		}
	}

	handleStepIndicatorClick(event, index) {
		event.preventDefault();
		if (!event.currentTarget.disabled && !event.currentTarget.classList.contains('is-disabled')) {
			this.setStep(index);
		}
	}

	handleNextStep(event) {
		event.preventDefault();

		const steps = Array.isArray(this.ref.step) ? this.ref.step : [this.ref.step];
		if (!steps.length || this.state.currentStep >= steps.length - 1) return;

		if (this._isStepValid(this.state.currentStep, true)) {
			this.setStep(this.state.currentStep + 1);
		}
	}

	handlePrevStep(event) {
		event.preventDefault();
		if (this.state.currentStep > 0) {
			this.setStep(this.state.currentStep - 1);
		}
	}

	setStep(nextStep) {
		if (this.state.currentStep === nextStep) return;

		if (document.startViewTransition) {
			this.element.style.viewTransitionName = 'multi-step-form';
			const transition = document.startViewTransition(() => {
				this._updateStepUI(nextStep);
				this.setState({ currentStep: nextStep });
			});

			transition.finally(() => {
				this.element.style.viewTransitionName = '';
			});
		} else {
			this._updateStepUI(nextStep);
			this.setState({ currentStep: nextStep });
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

	stateChange(stateChanges) {
		if ('currentStep' in stateChanges) {
			this._updateStepUI(stateChanges.currentStep);
		}
	}
}

gia.register(MultiStepForm);
