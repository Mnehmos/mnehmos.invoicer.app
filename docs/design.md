# Architecture Design: Lightweight Local-Storage Invoicer

## 1. Overview
A lightweight, client-side-only Single Page Application (SPA) for creating, managing, and printing invoices. The application runs entirely in the browser using HTML5, CSS3, and Vanilla JavaScript, with data persistence via `localStorage`.

## 2. Constraints & Goals
- **Zero Backend:** No server-side code or database required.
- **Zero Build Step:** Pure HTML/CSS/JS files interpretable directly by the browser.
- **Persistence:** All data saved to the browser's `localStorage`.
- **Portable:** Can be run from a local file or static host (GitHub Pages, Netlify).
- **Print-Friendly:** CSS `@media print` styling for generating PDFs via browser print dialog.

## 3. Technology Stack
- **Markup:** HTML5 (Semantic structure)
- **Styling:** CSS3 (Flexbox/Grid, CSS Variables for theming)
- **Logic:** Vanilla JavaScript (ES6+)
- **Storage:** `window.localStorage` API

## 4. Data Models

### 4.1 Invoice Object
```json
{
  "id": "string (UUID or Timestamp)",
  "createdDate": "ISO8601 String",
  "dueDate": "ISO8601 String",
  "status": "draft | paid | overdue",
  "client": {
    "name": "string",
    "email": "string",
    "address": "string"
  },
  "items": [
    {
      "id": "string",
      "description": "string",
      "quantity": "number",
      "rate": "number",
      "amount": "number" // Calculated
    }
  ],
  "subtotal": "number",
  "taxRate": "number", // Percentage
  "taxAmount": "number",
  "total": "number",
  "notes": "string"
}
```

### 4.2 Settings Object
```json
{
  "currency": "USD",
  "defaultTaxRate": 0,
  "senderInfo": {
    "name": "string",
    "address": "string"
  },
  "logo": {
    "dataUrl": "string (Base64)",
    "width": "number",
    "height": "number"
  }
}
```

## 5. File Structure
```
project-root/
├── index.html          # Single entry point, contains templates
├── css/
│   ├── style.css       # Main application styles
│   └── print.css       # Print-specific overrides
├── js/
│   ├── app.js          # Main controller / Event listeners
│   ├── storage.js      # LocalStorage wrapper (CRUD operations)
│   ├── model.js        # Data logic and calculations
│   └── ui.js           # DOM manipulation and rendering
└── assets/             # Icons, logos (if any)
```

## 6. UI Flow & Views

### 6.1 Dashboard (Home)
- **List View:** Table or cards showing existing invoices.
- **Actions:** "New Invoice", "Settings", "Delete", "Edit", "Search/Filter".
- **Summary:** Total revenue, pending amounts (computed on load).

### 6.2 Settings View
- **Form:**
  - Company Logo Upload (File Input -> Base64 conversion).
  - Default Tax Rate.
  - Sender Info (Name, Address).
- **Actions:** "Save Settings", "Clear Logo".

### 6.3 Editor (Create/Edit)
- **Form:**
  - Client Details inputs.
  - Date pickers.
  - Dynamic "Line Items" list (Add/Remove row).
  - Real-time calculation of totals.
- **Actions:** "Save", "Cancel", "Print Preview".

### 6.3 Print View (Output)
- **Layout:** Clean, professional document layout.
- **Interaction:** Hidden during normal navigation, visible only when "Print" is triggered or via `@media print`.
- **Styling:** High contrast, black/white optimized, no UI buttons.

## 7. Implementation Plan
1.  **Scaffold:** Create directory structure and basic HTML shell.
2.  **Storage Engine:** Implement `storage.js` for saving/loading JSON.
3.  **UI Shell:** specific CSS for layout and print.
4.  **Logic:** Implement Add/Edit/Delete workflows.
5.  **Polishing:** Validation and empty states.