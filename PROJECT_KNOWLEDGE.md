# mnehmos.invoicer.app - Knowledge Base Document

## Quick Reference

| Property | Value |
|----------|-------|
| **Repository** | https://github.com/Mnehmos/mnehmos.invoicer.app |
| **Primary Language** | JavaScript (Vanilla) |
| **Project Type** | Web Application |
| **Status** | Active |
| **Last Updated** | 2025-12-29 |

## Overview

A lightweight, privacy-focused invoice management application that runs entirely in the browser. All invoice data is stored locally in the browser's localStorage with no server-side components, ensuring complete privacy and data ownership. Users can create professional invoices with company branding, manage client information, and export print-ready PDFs directly from their browser.

## Architecture

### System Design

The application follows a client-side-only Model-View-Controller (MVC) pattern implemented with vanilla JavaScript. The architecture consists of four main modules that interact through a clear separation of concerns: Storage handles all data persistence via localStorage, Model contains business logic for calculations and data structures, UI manages DOM manipulation and rendering, and App serves as the controller that wires everything together. No external APIs or server calls are made, ensuring complete privacy and offline functionality.

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| Storage Engine | Handles localStorage interactions, CRUD operations, validation, and quota management | `js/storage.js` |
| Data Model | Business logic for invoice calculations, currency formatting, and data structures | `js/model.js` |
| UI Controller | DOM manipulation, view rendering, and element caching | `js/ui.js` |
| App Controller | Event binding, routing, and coordination between Storage/Model/UI | `js/app.js` |
| Main HTML | Single-page application structure with all views | `index.html` |
| Main Styles | Application styling and layout | `css/style.css` |
| Print Styles | Print-specific styles for PDF export | `css/print.css` |

### Data Flow

```
User Interaction → App Controller → Storage/Model → UI Rendering → DOM Update
                                  ↓
                          localStorage Persistence

Invoice Creation Flow:
1. User clicks "New Invoice" → App.loadEditor()
2. User fills form → Real-time calculations via Model.calculateInvoice()
3. User saves → App.handleSave() → Storage.saveInvoice() → localStorage
4. Dashboard refresh → Storage.getInvoices() → UI.renderDashboard()

Print Flow:
User clicks Print → App.handlePrint() → UI.renderPrintView() → window.print()
```

## API Surface

### Public Interfaces

The application exposes its functionality through three main modules:

#### Module: `Storage`

##### Method: `getInvoices()`
- **Purpose**: Retrieve all invoices from localStorage
- **Parameters**: None
- **Returns**: Array of invoice objects

##### Method: `saveInvoice(invoice)`
- **Purpose**: Create or update an invoice
- **Parameters**:
  - `invoice` (Object): Invoice object with client, items, and metadata
- **Returns**: Boolean indicating success
- **Throws**: StorageError if quota exceeded or validation fails

##### Method: `deleteInvoice(id)`
- **Purpose**: Remove an invoice by ID
- **Parameters**:
  - `id` (string): UUID of the invoice to delete
- **Returns**: Boolean indicating success

##### Method: `searchInvoices(query)`
- **Purpose**: Search invoices by client name, email, ID, or item description
- **Parameters**:
  - `query` (string): Search term
- **Returns**: Array of matching invoice objects

##### Method: `getSettings()` / `saveSettings(settings)`
- **Purpose**: Manage application settings (company name, logo, default tax rate)
- **Parameters**:
  - `settings` (Object): Settings object with name, address, logo, defaultTaxRate
- **Returns**: Settings object or boolean success indicator

#### Module: `Model`

##### Method: `createEmptyInvoice()`
- **Purpose**: Generate a new invoice object with default values
- **Parameters**: None
- **Returns**: Invoice object with empty client, items array, and current date

##### Method: `calculateInvoice(invoice)`
- **Purpose**: Calculate subtotal, tax, and total for an invoice
- **Parameters**:
  - `invoice` (Object): Invoice object with items and taxRate
- **Returns**: Updated invoice object with calculated amounts

##### Method: `formatCurrency(amount, currency)`
- **Purpose**: Format number as currency string
- **Parameters**:
  - `amount` (number): Amount to format
  - `currency` (string): Currency code (default: 'USD')
- **Returns**: Formatted currency string (e.g., "$1,234.56")

#### Module: `UI`

##### Method: `renderDashboard(invoices)`
- **Purpose**: Render invoice list and statistics
- **Parameters**:
  - `invoices` (Array): Array of invoice objects
- **Returns**: Void (updates DOM)

##### Method: `renderEditor(invoice)`
- **Purpose**: Populate invoice editor form with data
- **Parameters**:
  - `invoice` (Object): Invoice object to edit
- **Returns**: Void (updates DOM)

##### Method: `getFormData()`
- **Purpose**: Extract invoice data from editor form
- **Parameters**: None
- **Returns**: Invoice object with form values

### Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `STORAGE_KEY` | string | `'invoicer_data'` | localStorage key for all application data |
| `APP_VERSION` | string | `'1.0.0'` | Application version for data migration tracking |

No environment variables required - application is purely client-side.

## Usage Examples

### Basic Usage

```javascript
// Create a new invoice programmatically
const newInvoice = Model.createEmptyInvoice();
newInvoice.client = {
  name: 'Acme Corporation',
  email: 'billing@acme.com',
  address: '123 Business St, New York, NY 10001'
};

newInvoice.items = [
  {
    id: crypto.randomUUID(),
    description: 'Web Development Services',
    quantity: 40,
    rate: 75,
    amount: 3000
  },
  {
    id: crypto.randomUUID(),
    description: 'Hosting Setup',
    quantity: 1,
    rate: 500,
    amount: 500
  }
];

newInvoice.taxRate = 8.5;
const calculated = Model.calculateInvoice(newInvoice);
Storage.saveInvoice(calculated);
```

### Advanced Patterns

```javascript
// Search and filter invoices with custom logic
const overdueInvoices = Storage.getInvoices().filter(invoice => {
  const dueDate = new Date(invoice.dueDate);
  const today = new Date();
  return invoice.status !== 'paid' && dueDate < today;
});

// Calculate total revenue
const totalRevenue = Storage.getInvoices()
  .filter(inv => inv.status === 'paid')
  .reduce((sum, inv) => sum + inv.total, 0);

console.log('Total Revenue:', Model.formatCurrency(totalRevenue));

// Export all data for backup
const backupData = Storage.getData();
const dataString = JSON.stringify(backupData, null, 2);
const blob = new Blob([dataString], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// User can download this URL as a backup file
```

## Dependencies

### Runtime Dependencies

No runtime dependencies - pure vanilla JavaScript application.

### Development Dependencies

No development dependencies - static HTML/CSS/JS with no build step required.

| Tool | Version | Purpose |
|------|---------|---------|
| Modern Browser | Any recent version | Chrome, Firefox, Safari, or Edge with ES6+ support |
| `npx serve` | Latest | Optional local development server |

## Integration Points

### Works With

Standalone project - no direct Mnehmos integrations.

This application is part of the Mnehmos ecosystem but operates independently. It is referenced in the ecosystem documentation alongside other projects like mnehmos.ooda.mcp, mnehmos.long-hall.game, and mnehmos.multi-agent.framework.

### External Services

No external services required.

All functionality is client-side with no API calls, analytics, or tracking. The application can function completely offline after initial page load.

## Development Guide

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Text editor for code modifications
- Optional: Node.js with `npx` for local development server

### Setup

```bash
# Clone the repository
git clone https://github.com/Mnehmos/mnehmos.invoicer.app
cd mnehmos.invoicer.app

# No dependencies to install - ready to use!
```

### Running Locally

```bash
# Option 1: Use a simple HTTP server (recommended)
npx serve .
# Open browser to http://localhost:3000

# Option 2: Open directly in browser
# Simply open index.html in your browser
# Note: Some browsers restrict localStorage when opening file:// URLs

# Option 3: Python simple server
python -m http.server 8000
# Open browser to http://localhost:8000
```

### Testing

```bash
# No automated tests currently implemented
# Manual testing workflow:
# 1. Open application in browser
# 2. Create a new invoice with test data
# 3. Verify calculations are correct
# 4. Test save/edit/delete operations
# 5. Verify localStorage persistence (check DevTools → Application → Local Storage)
# 6. Test print preview functionality
# 7. Verify settings persistence (logo upload, company details)
```

### Building

No build step required. The application consists of static HTML, CSS, and JavaScript files that can be deployed directly to any web server or hosting service.

```bash
# For GitHub Pages deployment
# Simply push to the gh-pages branch or enable GitHub Pages in repo settings

# For other hosting (Netlify, Vercel, etc.)
# Upload all files to the hosting service - no build configuration needed

# Output location: All files in repository root are production-ready
```

## Maintenance Notes

### Known Issues

1. localStorage has browser-specific size limits (typically 5-10MB) which may be exceeded with many invoices or large logos
2. No data export/import UI - users must access localStorage via browser DevTools for backup/restore
3. Invoice numbering is UUID-based rather than sequential numeric IDs
4. No multi-currency support beyond changing the display currency in settings

### Future Considerations

1. Add data export/import functionality for easier backup and migration
2. Implement invoice templates for recurring invoices
3. Add client management system to store frequently used client information
4. Implement invoice status automation (auto-mark as overdue based on due date)
5. Add invoice PDF generation using libraries like jsPDF for better print control
6. Consider implementing IndexedDB for larger storage capacity
7. Add keyboard shortcuts for common operations

### Code Quality

| Metric | Status |
|--------|--------|
| Tests | None - manual testing only |
| Linting | None - vanilla JS without tooling |
| Type Safety | None - plain JavaScript with JSDoc comments |
| Documentation | JSDoc comments in code + README only |

---

## Appendix: File Structure

```
mnehmos.invoicer.app/
├── css/
│   ├── style.css              # Main application styles and layout
│   └── print.css              # Print media styles for PDF export
├── js/
│   ├── storage.js             # localStorage abstraction and data persistence
│   ├── model.js               # Business logic and calculations
│   ├── ui.js                  # DOM manipulation and rendering
│   └── app.js                 # Application controller and event binding
├── docs/
│   └── (GitHub Pages assets)  # Deployment configuration
├── index.html                 # Single-page application entry point
├── README.md                  # User-facing documentation
├── PROJECT_KNOWLEDGE.md       # This document
└── .gitattributes             # Git configuration

Data Model Structure:
{
  version: "1.0.0",
  invoices: [
    {
      id: "uuid",
      createdDate: "YYYY-MM-DD",
      dueDate: "YYYY-MM-DD",
      status: "draft|paid|overdue",
      client: { name, email, address },
      items: [{ id, description, quantity, rate, amount }],
      subtotal: 0,
      taxRate: 0,
      taxAmount: 0,
      total: 0,
      notes: ""
    }
  ],
  settings: {
    name: "Company Name",
    address: "Company Address",
    logo: "base64 image data",
    currency: "USD",
    defaultTaxRate: 0
  }
}
```

---

*Generated by Project Review Orchestrator | 2025-12-29*
*Source: https://github.com/Mnehmos/mnehmos.invoicer.app*
