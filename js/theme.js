/**
 * Theme Manager for Invoicer
 * Handles dark/light mode toggle with localStorage persistence
 * Default: dark mode
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'invoicer-theme';
    const DARK_CLASS = 'dark';
    const LIGHT_CLASS = 'light';

    /**
     * Get the current theme from localStorage or default to dark
     */
    function getStoredTheme() {
        return localStorage.getItem(STORAGE_KEY) || 'dark';
    }

    /**
     * Apply theme to document
     */
    function applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'light') {
            root.classList.remove(DARK_CLASS);
            root.classList.add(LIGHT_CLASS);
        } else {
            root.classList.remove(LIGHT_CLASS);
            root.classList.add(DARK_CLASS);
        }
    }

    /**
     * Toggle between dark and light themes
     */
    function toggleTheme() {
        const currentTheme = getStoredTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        localStorage.setItem(STORAGE_KEY, newTheme);
        applyTheme(newTheme);
    }

    /**
     * Initialize theme on page load
     */
    function init() {
        // Apply stored theme immediately (before DOM content loaded to prevent flash)
        applyTheme(getStoredTheme());

        // Set up toggle button when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupToggle);
        } else {
            setupToggle();
        }
    }

    /**
     * Set up the toggle button click handler
     */
    function setupToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleTheme);
        }
    }

    // Initialize immediately
    init();

    // Expose for external use if needed
    window.ThemeManager = {
        toggle: toggleTheme,
        apply: applyTheme,
        get: getStoredTheme
    };
})();
