class TodoApp extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			storageKey: "gia-todo-app-data",
			deleteText: "Delete",
		};

		this.ref = {
			input: null,
			list: null,
			announcer: null, // aria-live region for accessibility announcements
		};

		this.setState({
			tasks: [], // Array of objects { id: string, text: string, completed: boolean }
		});
	}

	mount() {
		// Event delegation for the task list since `autoBindActions`
		// only binds to existing elements when the component is created.
		// We use `this.getRef` conceptually, though for dynamic children we check attributes.
		if (this.ref.list) {
			this.ref.list.addEventListener('click', this.handleListClick);
			this.ref.list.addEventListener('change', this.handleListChange);
		}

		// Load initial state from localStorage
		try {
			const storedTasks = localStorage.getItem(this.options.storageKey);
			if (storedTasks) {
				const tasks = JSON.parse(storedTasks);
				if (Array.isArray(tasks)) {
					this.setState({ tasks });
				}
			}
		} catch (err) {
			console.warn("TodoApp: Failed to parse tasks from localStorage.", err);
		}
	}

	unmount() {
		if (this.ref.list) {
			this.ref.list.removeEventListener('click', this.handleListClick);
			this.ref.list.removeEventListener('change', this.handleListChange);
		}
	}

	handleFormSubmit(event) {
		event.preventDefault();
		if (!this.ref.input) return;

		const text = this.ref.input.value.trim();
		if (!text) return;

		const newTask = {
			id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			text: text,
			completed: false
		};

		const newTasks = [...this.state.tasks, newTask];
		this.setState({ tasks: newTasks });

		this.saveToStorage(newTasks);
		this.announce(`Task added: ${text}`);

		// Clear input
		this.ref.input.value = "";
		this.ref.input.focus();
	}

	handleListClick(event) {
		const target = event.target;
		const deleteBtn = target.closest('[data-action="delete"]');

		if (deleteBtn) {
			const id = deleteBtn.getAttribute('data-id');
			this.deleteTask(id);
		}
	}

	handleListChange(event) {
		const target = event.target;
		if (target.matches('[data-action="toggle"]')) {
			const id = target.getAttribute('data-id');
			this.toggleTask(id, target.checked);
		}
	}

	deleteTask(id) {
		const tasks = this.state.tasks;
		const taskToDelete = tasks.find(t => t.id === id);

		if (!taskToDelete) return;

		const newTasks = tasks.filter(t => t.id !== id);
		this.setState({ tasks: newTasks });
		this.saveToStorage(newTasks);
		this.announce(`Task deleted: ${taskToDelete.text}`);
	}

	toggleTask(id, completed) {
		const tasks = this.state.tasks;
		const newTasks = tasks.map(t => {
			if (t.id === id) {
				return { ...t, completed };
			}
			return t;
		});

		this.setState({ tasks: newTasks });
		this.saveToStorage(newTasks);

		const task = newTasks.find(t => t.id === id);
		if (task) {
			this.announce(`Task ${completed ? 'completed' : 'uncompleted'}: ${task.text}`);
		}
	}

	saveToStorage(tasks) {
		try {
			localStorage.setItem(this.options.storageKey, JSON.stringify(tasks));
		} catch (err) {
			console.warn("TodoApp: Failed to save tasks to localStorage.", err);
		}
	}

	announce(message) {
		if (this.ref.announcer) {
			this.ref.announcer.textContent = message;
		}
	}

	stateChange(stateChanges) {
		if ('tasks' in stateChanges) {
			const newTasks = stateChanges.tasks;
			
			if (this.ref.list) {
				if (document.startViewTransition) {
					// Apply view transition names to current items
					const currentItems = this.ref.list.querySelectorAll('li');
					for (let i = 0; i < currentItems.length; i++) {
						const deleteBtn = currentItems[i].querySelector('[data-action="delete"]');
						if (deleteBtn) {
							const id = deleteBtn.getAttribute('data-id');
							currentItems[i].style.viewTransitionName = `todo-${id}`;
						}
					}

					const transition = document.startViewTransition(() => {
						this.renderTasks(newTasks);

						// Apply view transition names to the newly created items
						const newItems = this.ref.list.querySelectorAll('li');
						for (let i = 0; i < newItems.length; i++) {
							const deleteBtn = newItems[i].querySelector('[data-action="delete"]');
							if (deleteBtn) {
								const id = deleteBtn.getAttribute('data-id');
								newItems[i].style.viewTransitionName = `todo-${id}`;
							}
						}
					});

					transition.ready.catch(() => {});
					transition.finished.catch(() => {
						// Ignore AbortError when transition is skipped
					}).finally(() => {
						if (this.ref.list) {
							const items = this.ref.list.querySelectorAll('li');
							for (let i = 0; i < items.length; i++) {
								items[i].style.viewTransitionName = '';
							}
						}
					});
				} else {
					this.renderTasks(newTasks);
				}
			}

			// Update a state attribute on the component itself for CSS styling based on task count
			const taskCount = newTasks.length;
			this.setState({ hasTasks: taskCount > 0 });
		}
	}

	renderTasks(tasks) {
		if (!this.ref.list) return;

		// Using a document fragment for efficient DOM manipulation
		const fragment = document.createDocumentFragment();

		for (let i = 0; i < tasks.length; i++) {
			const task = tasks[i];

			const li = document.createElement('li');
			li.className = 'todo-item';
			if (task.completed) {
				li.classList.add('is-completed');
			}

			const label = document.createElement('label');
			label.className = 'todo-label';

			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.className = 'todo-checkbox';
			checkbox.checked = task.completed;
			checkbox.setAttribute('data-action', 'toggle');
			checkbox.setAttribute('data-id', task.id);
			// For accessibility, label wraps checkbox, but aria-label is good too
			checkbox.setAttribute('aria-label', `Toggle completion for ${task.text}`);

			const textSpan = document.createElement('span');
			textSpan.className = 'todo-text';
			textSpan.textContent = task.text;

			label.appendChild(checkbox);
			label.appendChild(textSpan);

			const deleteBtn = document.createElement('button');
			deleteBtn.className = 'todo-delete-btn';
			deleteBtn.setAttribute('data-action', 'delete');
			deleteBtn.setAttribute('data-id', task.id);
			deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
			deleteBtn.textContent = this.options.deleteText;

			li.appendChild(label);
			li.appendChild(deleteBtn);

			fragment.appendChild(li);
		}

		// Clear existing list and append new fragment
		this.ref.list.replaceChildren();
		this.ref.list.appendChild(fragment);
	}
}

gia.register(TodoApp);

/*
========================================
EXPECTED HTML
========================================

<!-- Note: Ensure `gia.config.set('autoBindActions', true);` is called to enable `data-action` binding. -->
<div data-component="TodoApp" class="todo-app">
  <!-- Screen reader announcer for accessibility -->
  <div class="sr-only" aria-live="polite" data-ref="announcer"></div>

  <form data-action="submit->handleFormSubmit" class="todo-form">
    <label for="new-todo" class="sr-only">Add new task</label>
    <input type="text" id="new-todo" data-ref="input" placeholder="What needs to be done?" class="todo-input" required />
    <button type="submit" class="todo-submit-btn">Add Task</button>
  </form>

  <ul data-ref="list" class="todo-list" aria-label="Task list">
    <!-- Tasks will be rendered here dynamically -->
  </ul>
</div>

========================================
SUGGESTED SCSS
========================================

// View transitions styles (must be global, not scoped)
::view-transition-group(*) {
  animation-duration: 0.3s;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

.todo-app {
  max-width: 500px;
  margin: 0 auto;
  font-family: system-ui, sans-serif;

  // Styles when app has tasks via BaseComponent data attribute binding
  &[data-has-tasks="true"] {
    .todo-list {
      border-top: 1px solid #eee;
      margin-top: 1rem;
      padding-top: 1rem;
    }
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.todo-form {
  display: flex;
  gap: 0.5rem;
}

.todo-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.todo-submit-btn, .todo-delete-btn {
  padding: 0.5rem 1rem;
  background-color: #0056b3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #004494;
  }
}

.todo-delete-btn {
  background-color: #dc3545;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;

  &:hover {
    background-color: #c82333;
  }
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;

  &.is-completed {
    .todo-text {
      text-decoration: line-through;
      color: #6c757d;
    }
  }
}

.todo-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  flex: 1;
}
*/
