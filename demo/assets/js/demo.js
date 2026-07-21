
document.addEventListener('DOMContentLoaded', () => {
    // Optional: manual load if autoMount isn't catching the initial render
    if (window.gia && window.gia.components) {
        gia.loadComponents(window.gia.components);
    }
});
