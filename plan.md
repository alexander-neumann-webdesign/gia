1. **Optimize `debounce` function in `src/utils.js`**
   - Update the `debounce` utility to prevent memory leaks by explicitly nullifying cached arguments and context references. This allows the garbage collector to free up trapped DOM elements or event objects. I will extract the references into local variables and nullify the closure variables *before* executing the wrapped function.
2. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run tests (e.g. `pnpm exec playwright test` if available).
   - Document the learning in `.jules/bolt.md` using the exact format required for the Bolt persona.
   - Verify changes with `run_in_bash_session`.
3. **Submit the change**
   - Submit the branch with a descriptive commit message.
