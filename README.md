# Invoicer

A lightweight, client-side-only invoice manager. All data stays in your browser's localStorage—no server, no tracking, complete privacy.

🧾 **[Use Now](https://mnehmos.github.io/mnehmos.invoicer.app/)**

---

## Features

- **100% Client-Side**: No backend, no API calls, no data leaving your browser
- **Local Storage**: All invoices persist in localStorage
- **Print-Ready**: Professional PDF export via browser print
- **Company Branding**: Upload logo and set sender details
- **Tax Support**: Configurable default tax rates
- **Search & Filter**: Find invoices by client or ID
- **Dashboard Stats**: Total revenue and pending amounts at a glance

---

## Quick Start

1. Open the app
2. Go to **Settings** → Add your company name, address, and logo
3. Click **New Invoice** → Fill in client details and line items
4. Save and print to PDF

---

## Architecture

```
invoicer.app/
├── index.html          # Single-page application
├── css/
│   ├── style.css       # Main styles
│   └── print.css       # Print-specific styles
└── js/
    ├── storage.js      # localStorage abstraction
    ├── model.js        # Invoice data model
    ├── ui.js           # DOM manipulation
    └── app.js          # Event bindings and routing
```

### Data Model

```javascript
Invoice {
  id: string,
  client: { name, email, address },
  date: Date,
  dueDate: Date,
  status: 'draft' | 'paid' | 'overdue',
  items: [{ description, qty, rate }],
  taxRate: number,
  notes: string
}
```

---

## Privacy

- **No cookies**
- **No analytics**
- **No external requests**
- **Data stored only in localStorage**

Export your data anytime via browser developer tools (`localStorage.getItem('invoices')`).

---

## Development

No build step required—just static HTML/CSS/JS.

```bash
# Local development
npx serve .

# Or just open index.html in browser
```

---

## Part of the Mnehmos Ecosystem

This project is part of a larger collection of MCP tools, games, and frameworks.

| Project | Description |
|---------|-------------|
| [mnehmos.ooda.mcp](https://github.com/Mnehmos/mnehmos.ooda.mcp) | Full computer control MCP server |
| [mnehmos.long-hall.game](https://github.com/Mnehmos/mnehmos.long-hall.game) | Roguelike dungeon crawler |
| [mnehmos.multi-agent.framework](https://github.com/Mnehmos/mnehmos.multi-agent.framework) | Multi-agent coordination framework |

See [github.com/Mnehmos](https://github.com/Mnehmos) for the complete ecosystem.

---

## License

MIT

---

*Built with vanilla JS. Powered by Gemini 3 architectural reasoning.*
