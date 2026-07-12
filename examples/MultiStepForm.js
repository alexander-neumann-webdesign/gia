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

	_getArray(refValue) {
		return Array.isArray(refValue) ? refValue : (refValue ? [refValue] : []);
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

			const nextBtns = this._getArray(this.ref.nextBtn);
			for (let i = 0; i < nextBtns.length; i++) {
				nextBtns[i].addEventListener('click', this.handleNextStep);
			}

			const prevBtns = this._getArray(this.ref.prevBtn);
			for (let i = 0; i < prevBtns.length; i++) {
				prevBtns[i].addEventListener('click', this.handlePrevStep);
			}

			const stepIndicators = this._getArray(this.ref.stepIndicator);
			for (let i = 0; i < stepIndicators.length; i++) {
				stepIndicators[i].addEventListener('click', this.handleStepIndicatorClick);
			}

			if (this.ref.step && (this._getArray(this.ref.step).length > 0)) {
				gia.mutate(() => {
					this._updateStepUI(this.state.currentStep);
				});
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

		const nextBtns = this._getArray(this.ref.nextBtn);
		for (let i = 0; i < nextBtns.length; i++) {
			nextBtns[i].removeEventListener('click', this.handleNextStep);
		}

		const prevBtns = this._getArray(this.ref.prevBtn);
		for (let i = 0; i < prevBtns.length; i++) {
			prevBtns[i].removeEventListener('click', this.handlePrevStep);
		}

		const stepIndicators = this._getArray(this.ref.stepIndicator);
		for (let i = 0; i < stepIndicators.length; i++) {
			stepIndicators[i].removeEventListener('click', this.handleStepIndicatorClick);
		}
	}

	handleSubmit(event) {
		const steps = this._getArray(this.ref.step);
		if (steps.length > 0 && this.state.currentStep < steps.length - 1) {
			event.preventDefault();
			event.stopImmediatePropagation();
			this.handleNextStep(event);
			return;
		}
		// If on the last step, let the event pass through to the inner Form or native submit
	}

	_isStepValid(stepIndex, report = false) {
		const steps = this._getArray(this.ref.step);
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
		const indicators = this._getArray(this.ref.stepIndicator);
		let canNavigate = true;
		const indicatorStates = [];

		for (let index = 0; index < indicators.length; index++) {
			if (index > 0 && !this._isStepValid(index - 1)) {
				canNavigate = false;
			}
			indicatorStates.push(canNavigate);
		}

		let allValid = true;
		if (this.ref.submitBtn) {
			const steps = this._getArray(this.ref.step);
			for (let i = 0; i < steps.length; i++) {
				if (!this._isStepValid(i)) {
					allValid = false;
					break;
				}
			}
		}

		gia.mutate(() => {
			for (let index = 0; index < indicators.length; index++) {
				const indicator = indicators[index];
				if (indicatorStates[index]) {
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
			}

			if (this.ref.submitBtn) {
				if (allValid) {
					this.ref.submitBtn.disabled = false;
					this.ref.submitBtn.classList.remove('is-disabled');
				} else {
					this.ref.submitBtn.disabled = true;
					this.ref.submitBtn.classList.add('is-disabled');
				}
			}
		});
	}

	handleStepIndicatorClick(event) {
		event.preventDefault();
		if (!event.currentTarget.disabled && !event.currentTarget.classList.contains('is-disabled')) {
			const index = this._getArray(this.ref.stepIndicator).indexOf(event.currentTarget);
			this.setStep(index);
		}
	}

	handleNextStep(event) {
		event.preventDefault();

		const steps = this._getArray(this.ref.step);
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
			gia.mutate(() => {
				this.element.style.viewTransitionName = 'multi-step-form';
				
				gia.measure(() => {
					const transition = document.startViewTransition(() => {
						this._isViewTransitioning = true;
						this.setState({ currentStep: nextStep });
						this._isViewTransitioning = false;
					});

					transition.finally(() => {
						gia.mutate(() => {
							this.element.style.viewTransitionName = '';
						});
					});
				});
			});
		} else {
			this.setState({ currentStep: nextStep });
		}
	}

	_updateStepUI(currentStep) {
		const steps = this._getArray(this.ref.step);
		if (!steps || steps.length === 0) return;

		for (let i = 0; i < steps.length; i++) {
			steps[i].hidden = i !== currentStep;
		}

		const indicators = this._getArray(this.ref.stepIndicator);
		for (let i = 0; i < indicators.length; i++) {
			const indicator = indicators[i];
			if (i === currentStep) {
				indicator.setAttribute('aria-current', 'step');
				indicator.classList.add('is-active');
			} else {
				indicator.removeAttribute('aria-current');
				indicator.classList.remove('is-active');
			}
		}

		if (this.ref.submitBtn) {
			this.ref.submitBtn.hidden = currentStep !== steps.length - 1;
		}

		if (this.options.scrollToTopOnStep && currentStep > 0) {
			window.setTimeout(() => {
				gia.mutate(() => {
					if (this.formElement) {
						this.formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
					}
				});
			}, 50);
		}
	}

	stateChange(stateChanges) {
		if ('currentStep' in stateChanges) {
			if (this._isViewTransitioning) {
				this._updateStepUI(stateChanges.currentStep);
			} else {
				gia.mutate(() => {
					this._updateStepUI(stateChanges.currentStep);
				});
			}
		}
	}
}

gia.register(MultiStepForm);
