class UploadField extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			addMoreFilesText: '+ Add more files',
			removeFileText: '🗑️',
		};

		this.originalDropzoneLabels = new Map();
	}

	mount() {
		this.element.setAttribute('tabindex', '0');
		this.element.addEventListener('keydown', this.handleKeyDown);
		this.element.addEventListener('click', this.handleClick);
		this.element.addEventListener('dragover', this.handleDragOver);
		this.element.addEventListener('dragleave', this.handleDragLeave);
		this.element.addEventListener('drop', this.handleDrop);

		const fileInput = this.element.querySelector('input[type="file"]');
		if (fileInput) {
			fileInput.addEventListener('change', this.handleFileChange);
			fileInput.addEventListener('focus', this.handleFocus);
			fileInput.addEventListener('blur', this.handleBlur);
		}

		const label = this.element.querySelector('.form-dropzone-label');
		if (label) {
			this.originalDropzoneLabels.set(this.element, label.textContent);
		}

		this.formElement = this.element.closest('form');
		if (this.formElement) {
			this.formElement.addEventListener('reset', this.handleFormReset);
		}
	}

	unmount() {
		this.element.removeEventListener('keydown', this.handleKeyDown);
		this.element.removeEventListener('click', this.handleClick);
		this.element.removeEventListener('dragover', this.handleDragOver);
		this.element.removeEventListener('dragleave', this.handleDragLeave);
		this.element.removeEventListener('drop', this.handleDrop);

		const fileInput = this.element.querySelector('input[type="file"]');
		if (fileInput) {
			fileInput.removeEventListener('change', this.handleFileChange);
			fileInput.removeEventListener('focus', this.handleFocus);
			fileInput.removeEventListener('blur', this.handleBlur);
		}

		if (this.formElement) {
			this.formElement.removeEventListener('reset', this.handleFormReset);
		}
	}


	handleKeyDown(event) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			const fileInput = this.element.querySelector('input[type="file"]');
			if (fileInput) {
				fileInput.click();
			}
		}
	}

	handleClick(event) {
		const fileInput = this.element.querySelector('input[type="file"]');
		// Only trigger if click wasn't already on the input or a remove button
		if (fileInput && event.target !== fileInput && !event.target.closest('.remove-file-btn') && !event.target.closest('.add-more-files-btn')) {
			fileInput.click();
		}
	}

	handleFocus() {
		gia.mutate(() => {
			this.element.classList.add('is-focused');
		});
	}

	handleBlur() {
		gia.mutate(() => {
			this.element.classList.remove('is-focused');
		});
	}

	handleFormReset() {
		// Restore initial label
		const label = this.element.querySelector('.form-dropzone-label');
		const originalText = this.originalDropzoneLabels.get(this.element);

		// Remove existing file list
		const existingList = this.element.querySelector('.form-file-list');

		gia.mutate(() => {
			if (label && originalText) {
				label.hidden = false;
				label.textContent = originalText;
			}

			if (existingList) {
				existingList.remove();
			}
		});
	}

	handleDragOver(event) {
		event.preventDefault();
		const dropzone = event.currentTarget;
		gia.mutate(() => {
			dropzone.classList.add('is-dragover');
		});
	}

	handleDragLeave(event) {
		event.preventDefault();
		const dropzone = event.currentTarget;
		gia.mutate(() => {
			dropzone.classList.remove('is-dragover');
		});
	}

	handleDrop(event) {
		event.preventDefault();
		const dropzone = event.currentTarget;
		gia.mutate(() => {
			dropzone.classList.remove('is-dragover');
		});

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
		// With component pattern, this.element is the dropzone
		const dropzone = fileInput.closest('[data-component="UploadField"]') || fileInput.closest('.form-dropzone');
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

		gia.mutate(() => {
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

				for (let i = 0; i < fileInput.files.length; i++) {
					const fileItem = this._createFileItem(fileInput.files[i], dropzone, fileInput);
					fileList.appendChild(fileItem);
				}

				const addMoreBtn = this._createAddMoreButton(fileInput);
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
		});
	}

	_createAddMoreButton(fileInput) {
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

			tempInput.addEventListener('change', () => this._handleAddMoreFiles(tempInput, fileInput));

			tempInput.click();
		});

		return addMoreBtn;
	}

	_handleAddMoreFiles(tempInput, fileInput) {
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
		removeBtn.setAttribute('title', `Remove ${file.name}`);

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
}

gia.register(UploadField);
