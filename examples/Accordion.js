class Accordion extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			closeOthers: false, // If true, only one accordion item can be open at a time within the same group
			icon: 'plus', // 'plus', 'arrow', or 'none'
		};

		this.ref = {
			summary: null // Optional: if you specifically want to reference the summary
		};

		this.isDetails = this.element instanceof HTMLDetailsElement;
		if (!this.isDetails) {
			console.warn("Accordion: Component should be attached to a <details> element.");
		}

		// Initial state is correctly set from element initially or open attribute
		this.setState({
			isOpen: this.element.hasAttribute('open')
		});
	}

	getIconSvg(iconType) {
		if (iconType === 'plus') {
			return `
				<svg class="accordion-icon accordion-icon--plus" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<line x1="12" y1="5" x2="12" y2="19" class="vertical-line"></line>
					<line x1="5" y1="12" x2="19" y2="12" class="horizontal-line"></line>
				</svg>
			`;
		} else if (iconType === 'arrow') {
			return `
				<svg class="accordion-icon accordion-icon--arrow" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<polyline points="6 9 12 15 18 9"></polyline>
				</svg>
			`;
		}
		return '';
	}

	mount() {
		if (!this.isDetails) return;

		// Inject icon into summary if not present and icon !== 'none'
		const summary = this.element.querySelector('summary');
		if (summary && this.options.icon !== 'none') {
			if (!summary.querySelector('.accordion-icon')) {
				summary.insertAdjacentHTML('beforeend', this.getIconSvg(this.options.icon));
			}
		}

		this.element.addEventListener('toggle', this.handleToggle);

		if (this.options.closeOthers) {
			window.addEventListener('accordion:open', this.handleAccordionOpen);
		}

		this.maybeStartOpened = this.maybeStartOpened.bind(this);

		// Initial state based on URL hash or DOM
		let shouldBeOpen = this.element.open;
		const hash = window.location.hash;

		if (hash && this.element.id && hash === `#${this.element.id}`) {
			shouldBeOpen = true;

			// Optional: Scroll to the element if requested by hash
			setTimeout(() => {
				this.element.scrollIntoView({ behavior: 'smooth' });
			}, 100);
		}

		if (this.element.id && window.swup) {
			window.swup.hooks.on("scroll:end", this.maybeStartOpened);
		}

		this.setState({ isOpen: shouldBeOpen });
	}

	maybeStartOpened() {
		if (window.location.hash && this.element.id === window.location.hash.substring(1)) {
			if (!this.state.isOpen) {
				this.setState({ isOpen: true });

				setTimeout(() => {
					this.element.scrollIntoView({ behavior: 'smooth' });
				}, 100);
			}
		}
	}

	unmount() {
		if (this.element.id && window.swup) {
			window.swup.hooks.off("scroll:end", this.maybeStartOpened);
		}

		if (this.isDetails) {
			this.element.removeEventListener('toggle', this.handleToggle);
		}

		if (this.options.closeOthers) {
			window.removeEventListener('accordion:open', this.handleAccordionOpen);
		}
	}

	handleToggle(event) {
		// Only update state if it doesn't match the element's actual state
		// This prevents infinite loops since stateChange might alter element.open
		if (this.state.isOpen !== this.element.open) {
			this.setState({ isOpen: this.element.open });

			// Refresh ScrollTrigger after the transition is expected to complete
			// A 500ms timeout roughly matches the suggested CSS transition duration
			if (window.ScrollTrigger) {
				setTimeout(() => {
					window.ScrollTrigger.refresh();
				}, 500);
			}
		}
	}

	handleAccordionOpen(event) {
		const { instance, parent } = event.detail;

		if (instance !== this && parent === this.element.parentElement && this.state.isOpen) {
			this.setState({ isOpen: false });
		}
	}

	stateChange(stateChanges) {
		if ('isOpen' in stateChanges) {
			const { isOpen } = stateChanges;

			// Sync DOM if necessary
			if (this.element.open !== isOpen) {
				this.element.open = isOpen;
			}

			// Dispatch event for other accordions
			if (isOpen && this.options.closeOthers) {
				const customEvent = new CustomEvent('accordion:open', {
					detail: { instance: this, parent: this.element.parentElement }
				});
				window.dispatchEvent(customEvent);
			}

			// Dispatch a window resize event to trigger layout updates
			// (e.g., for embla-carousel or other scripts that rely on window resizing)
			// ⚡ BOLT OPTIMIZATION: Defer resize event dispatch out of the stateChange (rAF) cycle
			// Dispatching synchronously inside rAF causes layout thrashing if listeners perform layout reads.
			setTimeout(() => {
				window.dispatchEvent(new Event('resize'));
			}, 0);
		}
		this.element.removeAttribute('data-is-open');
	}
}

gia.register(Accordion);

/**
 * Expected HTML Structure:
 *
 * <div class="block block-accordions col-12" itemscope="" itemtype="https://schema.org/FAQPage"><details class="accordion" data-component="Accordion" id="wie-finde-ich-die-passende-lamellenstore" itemscope="" itemprop="mainEntity" itemtype="https://schema.org/Question"><summary data-ref="title"><div class="flex-row h3"><p itemprop="name">Wie finde ich die passende Lamellenstore?</p><svg xmlns="http://www.w3.org/2000/svg" viewBox="8.3 12.52 18.4 9.95">
 * 							<path d="m9.05 13.27 8.45 8.45 8.45-8.45" style="fill:none;stroke:#0bd596;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px"></path>
 * 						</svg></div></summary><div class="content" data-ref="contentWrapper" itemscope="" itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"><div class="text wysiwyg" itemprop="text"><p>Um den idealen Lamellenstore für Ihr Haus auszuwählen, sollten Sie den Einsatzzweck klar definieren – ob primär als Sonnen-, Sicht-, Wärme-, Einbruch- oder Lärmschutz. Messen Sie die Masse Ihrer Fenster und Türen genau aus und berücksichtigen Sie dabei den benötigten Platz für das Lamellenpaket und die Führungsschienen.</p><p>Die Montageart ist ebenfalls entscheidend: Wollen Sie den Store vor der Fassade, auf dem Fenster oder unsichtbar im Sturz integrieren? Wählen Sie das passende Material für die Lamellen – Aluminium ist langlebig und vielseitig, während Kunststoff preiswerter ist. Bedenken Sie auch die gewünschte Bedienungsart, von der klassischen Gurtbedienung bis zur smarten Steuerung per App oder Sprachbefehl. Achten Sie abschließend darauf, dass Farbe und Design der Store harmonisch zur Architektur Ihres Hauses passen. Ein Fachbetrieb kann Sie hierbei optimal beraten.</p><p><strong>Wir beraten Sie gerne kostenlos, schnell und umfassend.</strong><br>Um den idealen Lamellenstore für Ihre individuellen Anforderungen zu finden, empfehlen wir Ihnen eine persönliche Beratung. Dort können Sie verschiedene Modelle begutachten, sich über die technischen Details informieren und alle Ihre Fragen klären.</p><p><strong>Sie sind Architekt oder Planer?</strong><br>Wir bieten Ihnen eine exklusive <a href="https://www.griesser.com/at/de/partner-architekten/architekten/">Architekten-Beratung</a> und unterstützen Sie gerne bei Ihrem nächsten Projekt.</p></div></div></details><details class="accordion" data-component="Accordion" id="welche-lamellenstorentypen-gibt-es" itemscope="" itemprop="mainEntity" itemtype="https://schema.org/Question"><summary data-ref="title"><div class="flex-row h3"><p itemprop="name">Welche Lamellenstorentypen gibt es?</p><svg xmlns="http://www.w3.org/2000/svg" viewBox="8.3 12.52 18.4 9.95">
 * 							<path d="m9.05 13.27 8.45 8.45 8.45-8.45" style="fill:none;stroke:#0bd596;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px"></path>
 * 						</svg></div></summary><div class="content" data-ref="contentWrapper" itemscope="" itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"><div class="text wysiwyg" itemprop="text"><p>Bei Griesser unterscheiden wir primär zwischen fünf Hauptkategorien, die jeweils spezifische Bedürfnisse abdecken:</p><ul><li><strong>Ganzmetallstoren</strong>: Die robusteste Lösung für höchste Sicherheitsansprüche. Bei diesem Typ sind alle mechanischen Bauteile in den Führungsschienen integriert und vor Witterung geschützt. Dank der integrierten Hochschiebesicherung bieten sie einen hervorragenden Einbruchschutz. (Metalunic)</li><li><strong>Verbundraffstoren</strong>: Der Klassiker. Die Lamellen sind durch hochfeste Verbindungselemente verbunden, was sie besonders robust und langlebig macht. (Grinotex, Lamisol)</li><li><strong>Flachlamellenstoren</strong>: Diese zeichnen sich durch eine sehr geringe Pakethöhe im hochgezogenen Zustand aus – ideal, wenn nur wenig Platz im Sturz vorhanden ist. (Aluflex)</li><li><strong>Klassische Raffstoren</strong>: Unsere vielseitigen Allrounder, die durch gebördelte Lamellen besonders windstabil und langlebig sind. Sie bieten ein exzellentes Preis-Leistungs-Verhältnis und lassen sich durch ihre kompakte Bauweise in fast jede Fassade integrieren. (Solomatic)</li><li><strong>Sinus-Lamellen</strong>: Unsere Innovation für maximale Tageslichtnutzung. Die geschwungene Form lenkt das Licht blendfrei tief in den Raum, während sie gleichzeitig vor Hitze schützt.</li></ul></div></div></details><details class="accordion" data-component="Accordion" id="welches-sind-die-vor-und-nachteile-von-lamellenstoren" itemscope="" itemprop="mainEntity" itemtype="https://schema.org/Question"><summary data-ref="title"><div class="flex-row h3"><p itemprop="name">Welches sind die Vor- und Nachteile von Lamellenstoren</p><svg xmlns="http://www.w3.org/2000/svg" viewBox="8.3 12.52 18.4 9.95">
 * 							<path d="m9.05 13.27 8.45 8.45 8.45-8.45" style="fill:none;stroke:#0bd596;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px"></path>
 * 						</svg></div></summary><div class="content" data-ref="contentWrapper" itemscope="" itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"><div class="text wysiwyg" itemprop="text"><p>Lamellenstoren sind die flexibelste Lösung für den Sonnenschutz, haben aber je nach Einsatzort spezifische Eigenschaften:</p><p><strong>Vorteile</strong>:</p><ul><li>Präzise Lichtsteuerung: Sie können den Lichteinfall stufenlos regulieren, ohne den Raum komplett zu verdunkeln.</li><li>Hitzeschutz: Durch das Abhalten der Sonnenstrahlen vor der Fensterscheibe bleibt das Raumklima im Sommer angenehm kühl.</li><li>Sichtschutz: Sie schützen Ihre Privatsphäre, erlauben Ihnen aber dennoch den Blick nach draussen.</li></ul><p><strong>Nachteile</strong>:</p><ul><li>Windanfälligkeit: Im Vergleich zu <a href="https://www.griesser.com/at/de/produkte/rolllaeden/">Rollläden</a> müssen Lamellenstoren bei starkem Wind (Sturm) hochgefahren werden (sofern kein spezielles windstabiles System verbaut ist).</li><li>Reinigungsaufwand: Die einzelnen Lamellen benötigen etwas mehr Aufmerksamkeit bei der Reinigung als eine glatte Rollladenfläche.</li></ul></div></div></details><details class="accordion" data-component="Accordion" id="wie-pflege-ich-lamellenstoren" itemscope="" itemprop="mainEntity" itemtype="https://schema.org/Question"><summary data-ref="title"><div class="flex-row h3"><p itemprop="name">Wie pflege ich Lamellenstoren?</p><svg xmlns="http://www.w3.org/2000/svg" viewBox="8.3 12.52 18.4 9.95">
 * 							<path d="m9.05 13.27 8.45 8.45 8.45-8.45" style="fill:none;stroke:#0bd596;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px"></path>
 * 						</svg></div></summary><div class="content" data-ref="contentWrapper" itemscope="" itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"><div class="text wysiwyg" itemprop="text"><p>Eine regelmässige Pflege verlängert die Lebensdauer Ihrer Anlage erheblich und sorgt für eine dauerhaft schöne Optik:</p><ul><li>Reinigung: Verwenden Sie klares Wasser oder eine milde Seifenlauge. Wischen Sie die Lamellen mit einem weichen Schwamm oder Tuch ab. Vermeiden Sie aggressive Reinigungsmittel oder Hochdruckreiniger, da diese die Beschichtung beschädigen können.</li><li>Mechanik: Entfernen Sie regelmässig Schmutz und Laub aus den Führungsschienen, damit der Behang reibungslos gleitet.</li><li>Wartung: Prüfen Sie gelegentlich die Aufzugsbänder und Leiterkordeln auf Verschleiss.</li></ul></div></div></details></div>
 *
 * Suggested SCSS:
 *
 * // Ensure interpolate-size is available globally for parsers
 * :root {
 *   interpolate-size: allow-keywords;
 * }
 *
 * details[data-component="Accordion"] {
 *   @supports (interpolate-size: allow-keywords) {
 *     &::details-content {
 *       transition: height 0.5s ease, opacity 0.5s ease, display 0.5s ease allow-discrete, content-visibility 0.5s ease allow-discrete;
 *       height: 0;
 *       opacity: 0;
 *       overflow: clip;
 *       display: block;
 *     }
 *   }
 *
 *   &[open]::details-content {
 *     height: auto;
 *     opacity: 1;
 *   }
 *
 *   summary {
 *     cursor: pointer;
 *     user-select: none;
 *     // Remove default marker if desired
 *     // list-style: none;
 *     // &::-webkit-details-marker { display: none; }
 *   }
 * }
 */
