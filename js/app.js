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
            } else if (btn.classList.contains('pdf-invoice')) {
                const invoice = Storage.getInvoice(id);
                if (invoice) this.handleExportPDF(invoice);
            } else if (btn.classList.contains('ods-invoice')) {
                const invoice = Storage.getInvoice(id);
                if (invoice) this.handleExportODS(invoice);
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
            const formData = UI.getFormData();
            this.renderPrintPreview(formData);
            window.print();
        });

        document.getElementById('btn-export-pdf').addEventListener('click', () => {
            const formData = UI.getFormData();
            this.handleExportPDF(formData);
        });

        document.getElementById('btn-export-ods').addEventListener('click', () => {
            const formData = UI.getFormData();
            this.handleExportODS(formData);
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

        // CDR Logo Upload
        document.getElementById('settings-cdr-logo').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.name.toLowerCase().endsWith('.cdr')) {
                alert('Please upload a .cdr (CorelDRAW) file.');
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                if (!confirm('This CDR file is larger than 2MB. Large files may cause storage issues. Continue?')) {
                    e.target.value = '';
                    return;
                }
            }

            try {
                const base64 = await UI.handleLogoUpload(file);
                this._pendingCDR = { data: base64, name: file.name };
                document.getElementById('cdr-logo-info').classList.remove('hidden');
                document.getElementById('cdr-logo-filename').textContent = 'File: ' + file.name;
            } catch (err) {
                console.error('CDR upload failed', err);
                alert('Failed to read CDR file.');
            }
        });

        // Download CDR
        document.getElementById('btn-download-cdr').addEventListener('click', () => {
            const settings = Storage.getSettings();
            const cdrData = (this._pendingCDR && this._pendingCDR.data) || settings.logoOriginalCDR;
            const cdrName = (this._pendingCDR && this._pendingCDR.name) || settings.logoOriginalCDRName || 'logo.cdr';

            if (!cdrData) return;

            const link = document.createElement('a');
            link.href = cdrData;
            link.download = cdrName;
            link.click();
        });

        // Clear CDR
        document.getElementById('btn-clear-cdr').addEventListener('click', () => {
            this._pendingCDR = null;
            this._clearCDR = true;
            document.getElementById('cdr-logo-info').classList.add('hidden');
            document.getElementById('settings-cdr-logo').value = '';
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

        // Real-time Calculations + Auto-resize textareas
        const form = document.getElementById('invoice-form');
        form.addEventListener('input', (e) => {
            if (
                e.target.classList.contains('item-qty') ||
                e.target.classList.contains('item-rate') ||
                e.target.id === 'tax-rate'
            ) {
                this.updateRealtimeTotals();
            }
            // Auto-resize line item textareas
            if (e.target.tagName === 'TEXTAREA' && (e.target.classList.contains('item-name') || e.target.classList.contains('item-desc'))) {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
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
            const settings = Storage.getSettings();
            if (settings.defaultTaxRate) {
                invoice.taxRate = settings.defaultTaxRate;
            }
            // Pre-fill next invoice number
            invoice.invoiceNumber = Storage.getNextInvoiceNumber();
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

        let logo = null;
        if (!el.logoPreview.classList.contains('hidden') && el.logoPreview.src) {
            logo = el.logoPreview.src;
        }

        const settings = {
            name: el.name.value,
            address: el.address.value,
            defaultTaxRate: parseFloat(el.defaultTax.value) || 0,
            logo: logo,
            invoicePrefix: el.invoicePrefix.value,
            nextInvoiceNumber: parseInt(el.nextNumber.value, 10) || 1,
            invoiceNumberPadding: parseInt(el.numberPadding.value, 10) || 4
        };

        // CDR logo handling
        if (this._pendingCDR) {
            settings.logoOriginalCDR = this._pendingCDR.data;
            settings.logoOriginalCDRName = this._pendingCDR.name;
            this._pendingCDR = null;
        } else if (this._clearCDR) {
            settings.logoOriginalCDR = null;
            settings.logoOriginalCDRName = '';
            this._clearCDR = false;
        }

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
            <td><textarea class="item-name" placeholder="Item code" rows="1"></textarea></td>
            <td><textarea class="item-desc" placeholder="Description" required rows="1"></textarea></td>
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
        const isNew = !invoiceData.id;
        let usedAutoNumber = false;

        // Auto-assign invoice number for new invoices with empty number
        if (isNew && !invoiceData.invoiceNumber) {
            invoiceData.invoiceNumber = Storage.getNextInvoiceNumber();
            usedAutoNumber = true;
        }

        // Warn on duplicate invoice number
        if (invoiceData.invoiceNumber) {
            const existing = Storage.getInvoices().find(
                inv => inv.invoiceNumber === invoiceData.invoiceNumber && inv.id !== invoiceData.id
            );
            if (existing) {
                if (!confirm(`Invoice number "${invoiceData.invoiceNumber}" is already used. Save anyway?`)) {
                    return;
                }
            }
        }

        try {
            const success = Storage.saveInvoice(invoiceData);
            if (success) {
                if (isNew && (usedAutoNumber || invoiceData.invoiceNumber === Storage.getNextInvoiceNumber())) {
                    Storage.incrementInvoiceNumber();
                }
                this.loadDashboard();
            } else {
                alert('Failed to save invoice. Please check data.');
            }
        } catch (e) {
            alert(e.message);
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
    },

    /**
     * Generate and download PDF for an invoice
     * @param {Object} invoice
     */
    async handleExportPDF(invoice) {
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library not loaded. Please check your internet connection and reload.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const settings = Storage.getSettings();
        const invoiceNum = invoice.invoiceNumber || invoice.id;
        let yPos = 20;

        // Logo
        if (settings.logo) {
            try {
                let logoData = settings.logo;
                const isSVG = settings.logo.startsWith('data:image/svg');

                if (isSVG) {
                    // Rasterize SVG to PNG via canvas
                    logoData = await new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.naturalWidth || 200;
                            canvas.height = img.naturalHeight || 100;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/png'));
                        };
                        img.onerror = () => resolve(null);
                        img.src = settings.logo;
                    });
                }

                if (logoData) {
                    const logoType = logoData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(logoData, logoType, 14, yPos, 40, 20);
                }
            } catch (e) {
                console.warn('Could not add logo to PDF:', e);
            }
        }

        // Header
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', 200, yPos + 5, { align: 'right' });

        yPos += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Invoice #: ' + invoiceNum, 200, yPos, { align: 'right' });
        yPos += 5;
        doc.text('Date: ' + Model.formatDate(invoice.createdDate), 200, yPos, { align: 'right' });
        yPos += 5;
        doc.text('Due: ' + Model.formatDate(invoice.dueDate), 200, yPos, { align: 'right' });
        yPos += 5;
        doc.text('Status: ' + invoice.status.toUpperCase(), 200, yPos, { align: 'right' });

        // Line
        yPos += 8;
        doc.setLineWidth(0.5);
        doc.line(14, yPos, 200, yPos);
        yPos += 10;

        // From / To
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('FROM:', 14, yPos);
        doc.text('BILL TO:', 110, yPos);

        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        const fromLines = [
            settings.name || 'Invoicer User',
            ...(settings.address || '').split('\n').filter(Boolean)
        ];
        let leftY = yPos;
        fromLines.forEach(line => {
            doc.text(line, 14, leftY);
            leftY += 5;
        });

        const toLines = [
            invoice.client.name,
            invoice.client.email,
            ...(invoice.client.address || '').split('\n')
        ].filter(Boolean);
        let rightY = yPos;
        toLines.forEach(line => {
            doc.text(line, 110, rightY);
            rightY += 5;
        });

        yPos = Math.max(leftY, rightY) + 10;

        // Items table
        const tableData = invoice.items.map(item => [
            item.itemName || '',
            item.description,
            item.quantity.toString(),
            Model.formatCurrency(item.rate),
            Model.formatCurrency(item.amount)
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Item', 'Description', 'Qty', 'Rate', 'Amount']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [184, 115, 51],
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' }
            },
            margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Totals
        const totalsX = 140;
        doc.setFontSize(10);
        doc.text('Subtotal:', totalsX, yPos);
        doc.text(Model.formatCurrency(invoice.subtotal), 200, yPos, { align: 'right' });
        yPos += 6;

        doc.text('Tax (' + invoice.taxRate + '%):', totalsX, yPos);
        doc.text(Model.formatCurrency(invoice.taxAmount), 200, yPos, { align: 'right' });
        yPos += 6;

        doc.setLineWidth(0.3);
        doc.line(totalsX, yPos, 200, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Total:', totalsX, yPos);
        doc.text(Model.formatCurrency(invoice.total), 200, yPos, { align: 'right' });
        yPos += 10;

        // Notes
        if (invoice.notes) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setLineWidth(0.2);
            doc.line(14, yPos, 200, yPos);
            yPos += 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Notes:', 14, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            const noteLines = doc.splitTextToSize(invoice.notes, 180);
            doc.text(noteLines, 14, yPos);
        }

        doc.save('invoice-' + invoiceNum + '.pdf');
    },

    /**
     * Generate and download ODS spreadsheet for an invoice
     * @param {Object} invoice
     */
    handleExportODS(invoice) {
        if (typeof XLSX === 'undefined') {
            alert('Spreadsheet library not loaded. Please check your internet connection and reload.');
            return;
        }

        const settings = Storage.getSettings();
        const invoiceNum = invoice.invoiceNumber || invoice.id;

        const data = [];
        data.push(['Invoice Number', invoiceNum]);
        data.push(['Date', Model.formatDate(invoice.createdDate)]);
        data.push(['Due Date', Model.formatDate(invoice.dueDate)]);
        data.push(['Status', invoice.status.toUpperCase()]);
        data.push([]);
        data.push(['From', settings.name || 'Invoicer User']);
        data.push(['Address', settings.address || '']);
        data.push([]);
        data.push(['Bill To', invoice.client.name]);
        data.push(['Email', invoice.client.email || '']);
        data.push(['Address', invoice.client.address || '']);
        data.push([]);

        // Items
        data.push(['Item', 'Description', 'Quantity', 'Rate', 'Amount']);
        invoice.items.forEach(item => {
            data.push([item.itemName || '', item.description, item.quantity, item.rate, item.amount]);
        });
        data.push([]);

        // Totals
        data.push(['', '', '', 'Subtotal', invoice.subtotal]);
        data.push(['', '', '', 'Tax (' + invoice.taxRate + '%)', invoice.taxAmount]);
        data.push(['', '', '', 'Total', invoice.total]);

        if (invoice.notes) {
            data.push([]);
            data.push(['Notes', invoice.notes]);
        }

        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [
            { wch: 15 },
            { wch: 30 },
            { wch: 12 },
            { wch: 15 },
            { wch: 15 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
        XLSX.writeFile(wb, 'invoice-' + invoiceNum + '.ods', { bookType: 'ods' });
    }
};

// Boot the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});