/**
 * UI Controller
 * Handles DOM manipulation and rendering
 */

const UI = {
    // Cache DOM elements
    elements: {
        views: {
            dashboard: document.getElementById('view-dashboard'),
            editor: document.getElementById('view-editor'),
            print: document.getElementById('view-print')
        },
        dashboard: {
            list: document.getElementById('invoice-list'),
            revenue: document.getElementById('total-revenue'),
            pending: document.getElementById('total-pending'),
            searchInput: document.getElementById('search-invoices')
        },
        editor: {
            form: document.getElementById('invoice-form'),
            id: document.getElementById('invoice-id'),
            // Client
            clientName: document.getElementById('client-name'),
            clientEmail: document.getElementById('client-email'),
            clientAddress: document.getElementById('client-address'),
            // Details
            date: document.getElementById('invoice-date'),
            dueDate: document.getElementById('invoice-due-date'),
            status: document.getElementById('invoice-status'),
            // Items
            itemsBody: document.getElementById('line-items-body'),
            // Totals
            subtotal: document.getElementById('invoice-subtotal'),
            taxRate: document.getElementById('tax-rate'),
            taxAmount: document.getElementById('invoice-tax-amount'),
            total: document.getElementById('invoice-total'),
            notes: document.getElementById('invoice-notes')
        },
        print: {
            meta: document.getElementById('print-meta'),
            from: document.getElementById('print-from'),
            to: document.getElementById('print-to'),
            items: document.getElementById('print-items'),
            totals: document.getElementById('print-totals'),
            notes: document.getElementById('print-notes')
        }
    },

    /**
     * Switch visible view
     * @param {string} viewId 
     */
    showView(viewId) {
        // Update view visibility
        Object.values(this.elements.views).forEach(el => {
            if (el) el.classList.add('hidden');
            if (el) el.classList.remove('active');
        });
        
        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }

        // Update nav states
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Map view to nav button if exists
        const navMap = {
            'dashboard': 'nav-dashboard',
            'editor': 'nav-create' 
        };
        
        if (navMap[viewId]) {
            const btn = document.getElementById(navMap[viewId]);
            if (btn) btn.classList.add('active');
        } else if (viewId === 'editor') {
            // 'nav-create' is highlighted for both create and edit usually
            // but we might want to check if we are creating or editing
        }
    },

    /**
     * Render the dashboard invoice list
     * @param {Array} invoices 
     */
    renderDashboard(invoices) {
        const tbody = this.elements.dashboard.list;
        tbody.innerHTML = '';

        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No invoices found. Create one to get started.</td></tr>';
            return;
        }

        // Sort by date descending default
        invoices.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

        invoices.forEach(inv => {
            const tr = document.createElement('tr');
            const statusClass = `status-${inv.status}`; // e.g. status-paid, status-draft
            
            tr.innerHTML = `
                <td>#${inv.id.substring(0, 8)}...</td>
                <td>${this.escapeHtml(inv.client.name)}</td>
                <td>${Model.formatDate(inv.createdDate)}</td>
                <td>${Model.formatCurrency(inv.total)}</td>
                <td><span class="badge ${statusClass}">${inv.status}</span></td>
                <td class="actions-cell">
                    <button class="btn-icon edit-invoice" data-id="${inv.id}" title="Edit">✎</button>
                    <button class="btn-icon delete-invoice" data-id="${inv.id}" title="Delete">🗑</button>
                    <button class="btn-icon print-invoice" data-id="${inv.id}" title="Print">🖨</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        this.updateStats(invoices);
    },

    /**
     * Update dashboard statistics
     * @param {Array} invoices 
     */
    updateStats(invoices) {
        const totalRevenue = invoices
            .filter(i => i.status === 'paid')
            .reduce((sum, i) => sum + (i.total || 0), 0);
            
        const totalPending = invoices
            .filter(i => i.status === 'draft' || i.status === 'overdue')
            .reduce((sum, i) => sum + (i.total || 0), 0);

        this.elements.dashboard.revenue.textContent = Model.formatCurrency(totalRevenue);
        this.elements.dashboard.pending.textContent = Model.formatCurrency(totalPending);
    },

    /**
     * Populate the editor form with invoice data
     * @param {Object} invoice 
     */
    renderEditor(invoice) {
        const el = this.elements.editor;
        
        el.id.value = invoice.id || '';
        el.clientName.value = invoice.client.name || '';
        el.clientEmail.value = invoice.client.email || '';
        el.clientAddress.value = invoice.client.address || '';
        el.date.value = invoice.createdDate || '';
        el.dueDate.value = invoice.dueDate || '';
        el.status.value = invoice.status || 'draft';
        el.taxRate.value = invoice.taxRate || 0;
        el.notes.value = invoice.notes || '';

        // Render items
        this.renderLineItems(invoice.items);
        
        // Update totals display
        this.updateEditorTotals(invoice);
        
        // Update title based on mode
        const title = document.getElementById('editor-title');
        title.textContent = invoice.id ? 'Edit Invoice' : 'New Invoice';
    },

    /**
     * Render line items table rows
     * @param {Array} items 
     */
    renderLineItems(items) {
        const tbody = this.elements.editor.itemsBody;
        tbody.innerHTML = '';
        items.forEach(item => this.addLineItemRow(item));
    },

    /**
     * Add a single line item row to the table
     * @param {Object} item 
     */
    addLineItemRow(item) {
        const tbody = this.elements.editor.itemsBody;
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td><input type="text" class="item-desc" value="${this.escapeHtml(item.description)}" placeholder="Item description" required></td>
            <td><input type="number" class="item-qty" value="${item.quantity}" min="0" step="0.01" required></td>
            <td><input type="number" class="item-rate" value="${item.rate}" min="0" step="0.01" required></td>
            <td class="item-amount">${Model.formatCurrency(item.amount || 0)}</td>
            <td><button type="button" class="btn-icon remove-item" title="Remove">×</button></td>
        `;
        tbody.appendChild(tr);
    },

    /**
     * Update the totals display in the editor
     * @param {Object} invoice 
     */
    updateEditorTotals(invoice) {
        const el = this.elements.editor;
        el.subtotal.textContent = Model.formatCurrency(invoice.subtotal);
        el.taxAmount.textContent = Model.formatCurrency(invoice.taxAmount);
        el.total.textContent = Model.formatCurrency(invoice.total);
    },

    /**
     * Extract data from form to create/update invoice object
     * @returns {Object} Invoice data structure
     */
    getFormData() {
        const el = this.elements.editor;
        
        // Build client object
        const client = {
            name: el.clientName.value,
            email: el.clientEmail.value,
            address: el.clientAddress.value
        };

        // Build items array
        const items = [];
        const rows = el.itemsBody.querySelectorAll('tr');
        rows.forEach(row => {
            items.push({
                description: row.querySelector('.item-desc').value,
                quantity: parseFloat(row.querySelector('.item-qty').value) || 0,
                rate: parseFloat(row.querySelector('.item-rate').value) || 0,
                amount: 0 // Will be calculated by Model
            });
        });

        // Construct invoice
        const invoice = {
            id: el.id.value,
            createdDate: el.date.value,
            dueDate: el.dueDate.value,
            status: el.status.value,
            client: client,
            items: items,
            taxRate: parseFloat(el.taxRate.value) || 0,
            notes: el.notes.value
        };

        // Perform calculations
        return Model.calculateInvoice(invoice);
    },

    /**
     * Render the print view
     * @param {Object} invoice 
     */
    renderPrintView(invoice) {
        const el = this.elements.print;
        
        // Meta
        el.meta.innerHTML = `
            <p><strong>Invoice #:</strong> ${invoice.id}</p>
            <p><strong>Date:</strong> ${Model.formatDate(invoice.createdDate)}</p>
            <p><strong>Due Date:</strong> ${Model.formatDate(invoice.dueDate)}</p>
            <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
        `;

        // Addresses
        // In a real app, sender info would come from Settings
        el.from.innerHTML = `
            <h3>From:</h3>
            <p>Invoicer App User</p>
            <p>Business Address</p>
        `;

        el.to.innerHTML = `
            <h3>Bill To:</h3>
            <p><strong>${this.escapeHtml(invoice.client.name)}</strong></p>
            <p>${this.escapeHtml(invoice.client.email)}</p>
            <div class="address-block">${this.escapeHtml(invoice.client.address).replace(/\n/g, '<br>')}</div>
        `;

        // Items Table
        let itemsHtml = `
            <table class="print-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Rate</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
        `;

        invoice.items.forEach(item => {
            itemsHtml += `
                <tr>
                    <td>${this.escapeHtml(item.description)}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">${Model.formatCurrency(item.rate)}</td>
                    <td class="text-right">${Model.formatCurrency(item.amount)}</td>
                </tr>
            `;
        });

        itemsHtml += `</tbody></table>`;
        el.items.innerHTML = itemsHtml;

        // Totals
        el.totals.innerHTML = `
            <div class="print-totals-row">
                <span>Subtotal:</span>
                <span>${Model.formatCurrency(invoice.subtotal)}</span>
            </div>
            <div class="print-totals-row">
                <span>Tax (${invoice.taxRate}%):</span>
                <span>${Model.formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div class="print-totals-row grand-total">
                <span>Total:</span>
                <span>${Model.formatCurrency(invoice.total)}</span>
            </div>
        `;

        // Notes
        if (invoice.notes) {
            el.notes.innerHTML = `
                <div class="print-notes-section">
                    <h4>Notes:</h4>
                    <p>${this.escapeHtml(invoice.notes)}</p>
                </div>
            `;
        } else {
            el.notes.innerHTML = '';
        }
    },

    /**
     * Utility: Escape HTML to prevent XSS
     * @param {string} str 
     * @returns {string}
     */
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, "&")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};