/**
 * Main Application Controller
 * Wires together Storage, Model, and UI
 */

const App = {
    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.loadDashboard();
        console.log('Invoicer initialized v' + (typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1.0'));
    },

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Navigation
        document.getElementById('nav-dashboard').addEventListener('click', () => {
            this.loadDashboard();
        });

        document.getElementById('nav-create').addEventListener('click', () => {
            this.loadEditor(); // No ID = create new
        });

        document.getElementById('nav-settings').addEventListener('click', () => {
            this.loadSettings();
        });

        // Dashboard Actions
        document.getElementById('btn-new-invoice').addEventListener('click', () => {
            this.loadEditor();
        });

        document.getElementById('search-invoices').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Invoice List Actions (Event Delegation)
        document.getElementById('invoice-list').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const id = btn.dataset.id;
            if (btn.classList.contains('edit-invoice')) {
                this.loadEditor(id);
            } else if (btn.classList.contains('delete-invoice')) {
                this.handleDelete(id);
            } else if (btn.classList.contains('print-invoice')) {
                this.handlePrint(id);
            }
        });

        // Editor Actions
        document.getElementById('btn-cancel').addEventListener('click', () => {
            this.loadDashboard();
        });

        document.getElementById('invoice-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });

        document.getElementById('btn-print-preview').addEventListener('click', () => {
            // Save first (or just validate), then print
            // For now, let's just generate the preview from current form data
            const formData = UI.getFormData();
            this.renderPrintPreview(formData);
            window.print();
        });

        // Settings Actions
        document.getElementById('settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaveSettings();
        });

        document.getElementById('settings-logo').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const base64 = await UI.handleLogoUpload(file);
                    const settings = Storage.getSettings();
                    settings.logo = base64;
                    UI.renderSettings(settings); // Update preview
                } catch (err) {
                    console.error('Logo upload failed', err);
                    alert('Failed to load image. Please try another file.');
                }
            }
        });

        document.getElementById('btn-clear-logo').addEventListener('click', () => {
            const settings = Storage.getSettings();
            settings.logo = null;
            // We don't save immediately, just update UI context.
            // Actually, better to update the form state visually.
            // Since renderSettings takes an object, we can pass the modified one.
            // But we need to store this pending change somewhere or just rely on what's in the "session"
            // if we were strictly MVC. For simplicity, we'll update the UI and let saveSettings handle the final persistence
            // but we need a way to know the logo was cleared if we don't persist it here.
            // Easier approach: Update the UI elements directly or persist to a temp state?
            // Let's just update the UI elements to show empty. The save logic needs to know though.
            // For now, we'll update the Storage settings temporarily or assume the user hits save?
            // Let's just clear the input and preview.
            // The save handler needs to read the current state.
            // Since we don't have a "getSettingsFromForm" method in UI,
            // we'll actually modify the storage settings object in memory if we want to persist it on save?
            // Or better, let's just save it to a temp variable?
            // Simplest for this architecture: Just update the UI and clear the file input.
            // But wait, how does handleSaveSettings know?
            // Let's assume handleSaveSettings reads values.
            // Logo is special. Let's store the draft logo in a property on App or just directly update Storage?
            // No, standard pattern is "Save" commits changes.
            // We'll attach the draft logo to the form element data-attribute or similar?
            // Or simply: The preview image src IS the data source for the save operation if we want to be clever.
            
            // Let's update the UI preview to hidden.
            const preview = document.getElementById('settings-logo-preview');
            preview.src = '';
            preview.classList.add('hidden');
            document.getElementById('logo-placeholder').classList.remove('hidden');
            document.getElementById('btn-clear-logo').classList.add('hidden');
            document.getElementById('settings-logo').value = ''; // clear input
        });

        // Line Items Management
        document.getElementById('btn-add-item').addEventListener('click', () => {
            this.addLineItem();
        });

        document.getElementById('line-items-body').addEventListener('click', (e) => {
            if (e.target.closest('.remove-item')) {
                const row = e.target.closest('tr');
                row.remove();
                this.updateRealtimeTotals();
            }
        });

        // Real-time Calculations
        const form = document.getElementById('invoice-form');
        form.addEventListener('input', (e) => {
            if (
                e.target.classList.contains('item-qty') || 
                e.target.classList.contains('item-rate') ||
                e.target.id === 'tax-rate'
            ) {
                this.updateRealtimeTotals();
            }
        });
    },

    /**
     * Load and display the dashboard
     */
    loadDashboard() {
        const invoices = Storage.getInvoices();
        UI.renderDashboard(invoices);
        UI.showView('dashboard');
    },

    /**
     * Load the editor for creating or editing
     * @param {string|null} id 
     */
    loadEditor(id = null) {
        let invoice;
        if (id) {
            invoice = Storage.getInvoice(id);
            if (!invoice) {
                alert('Invoice not found');
                this.loadDashboard();
                return;
            }
        } else {
            invoice = Model.createEmptyInvoice();
            // Apply default settings
            const settings = Storage.getSettings();
            if (settings.defaultTaxRate) {
                invoice.taxRate = settings.defaultTaxRate;
            }
            // Add one empty item by default for new invoices
            invoice.items.push(Model.createLineItem());
        }

        UI.renderEditor(invoice);
        UI.showView('editor');
    },

    /**
     * Load and display settings
     */
    loadSettings() {
        const settings = Storage.getSettings();
        UI.renderSettings(settings);
        UI.showView('settings');
    },

    /**
     * Handle saving settings
     */
    handleSaveSettings() {
        const el = UI.elements.settings;
        
        // Get logo from preview src (if visible) or null
        // This is a bit hacky but avoids duplicating state
        let logo = null;
        if (!el.logoPreview.classList.contains('hidden') && el.logoPreview.src) {
            logo = el.logoPreview.src;
        }

        const settings = {
            name: el.name.value,
            address: el.address.value,
            defaultTaxRate: parseFloat(el.defaultTax.value) || 0,
            logo: logo
        };

        try {
            if (Storage.saveSettings(settings)) {
                alert('Settings saved successfully.');
            } else {
                alert('Failed to save settings.');
            }
        } catch (e) {
            alert(e.message);
        }
    },

    /**
     * Add a new line item row to the editor
     */
    addLineItem() {
        const item = Model.createLineItem();
        // Append to UI (we're not fully re-rendering the whole list to preserve focus/state if wanted, 
        // but UI.renderLineItems replaces content. For appending, let's use a helper or just add to the DOM)
        
        // Alternative: Get current data, add item, re-render. 
        // But that resets focus. Let's append DOM element manually using UI logic if possible.
        // For simplicity/robustness, we can just append a row HTML.
        
        const tbody = document.getElementById('line-items-body');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="item-desc" value="" placeholder="Item description" required></td>
            <td><input type="number" class="item-qty" value="1" min="0" step="0.01" required></td>
            <td><input type="number" class="item-rate" value="0" min="0" step="0.01" required></td>
            <td class="item-amount">$0.00</td>
            <td><button type="button" class="btn-icon remove-item" title="Remove">×</button></td>
        `;
        tbody.appendChild(tr);
    },

    /**
     * Calculate and update totals while editing
     */
    updateRealtimeTotals() {
        // This is slightly inefficient as it constructs the whole object, 
        // but ensures consistency with Model logic
        const invoiceData = UI.getFormData();
        
        // Update row totals in UI
        const rows = document.getElementById('line-items-body').querySelectorAll('tr');
        invoiceData.items.forEach((item, index) => {
            if (rows[index]) {
                const amountCell = rows[index].querySelector('.item-amount');
                if (amountCell) {
                    amountCell.textContent = Model.formatCurrency(item.amount);
                }
            }
        });

        // Update grand totals
        UI.updateEditorTotals(invoiceData);
    },

    /**
     * Handle searching invoices
     * @param {string} query 
     */
    handleSearch(query) {
        const results = Storage.searchInvoices(query);
        UI.renderDashboard(results);
    },

    /**
     * Save the current invoice
     */
    handleSave() {
        const invoiceData = UI.getFormData();
        
        // Basic validation handled by HTML5 forms (required attributes), 
        // but logic validation happens in Storage
        try {
            const success = Storage.saveInvoice(invoiceData);
            if (success) {
                // Optional: Show success message
                this.loadDashboard();
            } else {
                alert('Failed to save invoice. Please check data.');
            }
        } catch (e) {
            alert(e.message); // Show specific storage error
        }
    },

    /**
     * Delete an invoice
     * @param {string} id 
     */
    handleDelete(id) {
        if (confirm('Are you sure you want to delete this invoice?')) {
            if (Storage.deleteInvoice(id)) {
                this.loadDashboard();
            } else {
                alert('Failed to delete invoice.');
            }
        }
    },

    /**
     * Handle print action
     * @param {string} id 
     */
    handlePrint(id) {
        const invoice = Storage.getInvoice(id);
        if (invoice) {
            this.renderPrintPreview(invoice);
            // Small delay to ensure DOM render before print
            setTimeout(() => {
                window.print();
            }, 100);
        }
    },

    /**
     * Render print view specifically
     * @param {Object} invoice 
     */
    renderPrintPreview(invoice) {
        UI.renderPrintView(invoice);
        // Note: CSS @media print handles showing the #view-print section
        // and hiding others, so we don't strictly need to switch view via JS,
        // but we DO need to populate the print container.
    }
};

// Boot the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});