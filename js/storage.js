/**
 * Storage Engine
 * Handles all interactions with localStorage with validation and error handling
 */

const STORAGE_KEY = 'invoicer_data';
const APP_VERSION = '1.0.0';

class StorageError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'StorageError';
        this.code = code;
    }
}

const Storage = {
    /**
     * Initialize storage with schema check
     */
    init() {
        try {
            if (!this._isStorageAvailable()) {
                console.error('LocalStorage is not available');
                return;
            }

            const rawData = localStorage.getItem(STORAGE_KEY);
            if (!rawData) {
                this._initializeDefaults();
            } else {
                // Potential migration path here if versions differ
                const data = JSON.parse(rawData);
                if (!data.version) {
                    // Legacy data or first run with versioning
                    data.version = APP_VERSION;
                    this.saveData(data);
                }
            }
        } catch (e) {
            console.error('Storage initialization failed:', e);
        }
    },

    /**
     * Get all data from storage
     * @returns {Object} Application data
     */
    getData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : this._getDefaults();
        } catch (e) {
            console.error('Error reading from localStorage', e);
            // Return defaults to prevent app crash, but don't overwrite corrupt data automatically
            return this._getDefaults();
        }
    },

    /**
     * Save data to storage with quota management
     * @param {Object} data - Data to save
     * @throws {StorageError}
     */
    saveData(data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(STORAGE_KEY, serialized);
        } catch (e) {
            if (this._isQuotaExceeded(e)) {
                console.error('LocalStorage quota exceeded');
                throw new StorageError('Storage full. Please delete some invoices.', 'QUOTA_EXCEEDED');
            } else {
                console.error('Error saving to localStorage', e);
                throw new StorageError('Failed to save data.', 'WRITE_ERROR');
            }
        }
    },

    /**
     * Get all invoices
     * @returns {Array} List of invoices
     */
    getInvoices() {
        const data = this.getData();
        return data.invoices || [];
    },

    /**
     * Get a single invoice by ID
     * @param {string} id - Invoice ID
     * @returns {Object|null} Invoice object or null
     */
    getInvoice(id) {
        const invoices = this.getInvoices();
        return invoices.find(inv => inv.id === id) || null;
    },

    /**
     * Save a single invoice (create or update)
     * @param {Object} invoice - Invoice object
     * @returns {boolean} success
     */
    saveInvoice(invoice) {
        if (!this._validateInvoice(invoice)) {
            console.error('Invalid invoice data');
            return false;
        }

        try {
            const data = this.getData();
            const index = data.invoices.findIndex(inv => inv.id === invoice.id);
            
            // Update timestamp
            const now = new Date().toISOString();
            
            if (index >= 0) {
                // Update existing
                data.invoices[index] = { ...data.invoices[index], ...invoice, updatedAt: now };
            } else {
                // Create new
                // Ensure ID exists
                if (!invoice.id) {
                    invoice.id = crypto.randomUUID();
                }
                // Ensure createdDate exists
                if (!invoice.createdDate) {
                    invoice.createdDate = now;
                }
                
                data.invoices.push(invoice);
            }
            
            this.saveData(data);
            return true;
        } catch (e) {
            console.error('Failed to save invoice:', e.message);
            // Re-throw if it's a known storage error (like quota) so UI can handle it
            if (e instanceof StorageError) throw e;
            return false;
        }
    },

    /**
     * Delete an invoice by ID
     * @param {string} id - Invoice ID
     * @returns {boolean} success
     */
    deleteInvoice(id) {
        try {
            const data = this.getData();
            const initialLength = data.invoices.length;
            data.invoices = data.invoices.filter(inv => inv.id !== id);
            
            if (data.invoices.length !== initialLength) {
                this.saveData(data);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Failed to delete invoice:', e);
            return false;
        }
    },

    /**
     * Search invoices by query string
     * @param {string} query - Search term
     * @returns {Array} Filtered invoices
     */
    searchInvoices(query) {
        if (!query) return this.getInvoices();
        
        const term = query.toLowerCase();
        const invoices = this.getInvoices();
        
        return invoices.filter(inv => {
            // Search in basic fields
            const basicMatch = (
                (inv.id && inv.id.toLowerCase().includes(term)) ||
                (inv.client && inv.client.name && inv.client.name.toLowerCase().includes(term)) ||
                (inv.client && inv.client.email && inv.client.email.toLowerCase().includes(term)) ||
                (inv.status && inv.status.toLowerCase().includes(term))
            );
            
            if (basicMatch) return true;

            // Search in line items
            if (inv.items && Array.isArray(inv.items)) {
                return inv.items.some(item => 
                    item.description && item.description.toLowerCase().includes(term)
                );
            }
            
            return false;
        });
    },

    /**
     * Internal: Validate invoice structure
     * @param {Object} invoice 
     * @returns {boolean}
     */
    _validateInvoice(invoice) {
        if (!invoice || typeof invoice !== 'object') return false;
        
        // Required fields
        const required = ['client', 'items'];
        for (const field of required) {
            if (!invoice[field]) return false;
        }
        
        // Client validation
        if (!invoice.client.name) return false;
        
        // Items validation
        if (!Array.isArray(invoice.items) || invoice.items.length === 0) return false;
        
        return true;
    },

    /**
     * Internal: Check if storage is available
     */
    _isStorageAvailable() {
        try {
            const x = '__storage_test__';
            localStorage.setItem(x, x);
            localStorage.removeItem(x);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Internal: Check if error is quota exceeded
     */
    _isQuotaExceeded(e) {
        return (
            e instanceof DOMException &&
            // everything except Firefox
            (e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (localStorage && localStorage.length !== 0)
        );
    },

    /**
     * Internal: Get default data structure
     */
    _getDefaults() {
        return {
            version: APP_VERSION,
            invoices: [],
            settings: {
                currency: 'USD',
                defaultTaxRate: 0
            }
        };
    },

    /**
     * Internal: Initialize default data
     */
    _initializeDefaults() {
        this.saveData(this._getDefaults());
    }
};

// Initialize on load
Storage.init();