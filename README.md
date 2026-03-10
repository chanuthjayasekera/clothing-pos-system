# Clothing POS System (Retail & Wholesale)

An offline-capable **Point of Sale (POS) system** designed for clothing businesses to manage inventory, sales, suppliers, and reporting in a simple and efficient way.

This system supports both **Retail and Wholesale operations** and is designed to work even **without an internet connection** using browser-based local storage.

---

# Project Overview

The Clothing POS System is built to help clothing store owners manage their day-to-day operations including:

- Inventory management
- Product sales
- Retail and wholesale pricing
- Supplier management
- Invoice generation
- Sales reporting

The system is designed to be **lightweight, fast, and easy to use** for small and medium clothing businesses.

---

# Key Features

## Inventory Management
- Manage clothing products in the store
- Support **two product sources**:
  - In-house production
  - Vendor purchased items
- Product categories such as:
  - Menswear
  - Ladieswear
  - Kidswear
- Track stock quantities
- **Low stock alerts** when inventory levels drop
- Barcode / QR code support for quick product lookup

---

## Sales Management
- Retail and wholesale pricing support
- Fast POS billing screen
- Invoice generation for every sale
- Discount support:
  - Percentage discounts
  - Fixed amount discounts
- Multiple payment methods:
  - Cash
  - Card
  - Credit

---

## Supplier & Vendor Management
- Maintain supplier records
- Store supplier contact details
- Track purchase history from vendors

---

## Reporting System
The POS system provides useful reports for business insights:

- Daily sales reports
- Monthly sales reports
- Profit calculation

Profit formula used:

```
Profit = Selling Price - Cost Price
```

These reports help store owners monitor performance and profitability.

---

# Technology Stack

## Frontend
- HTML5
- CSS3

## UI Styling
- Tailwind CSS

## Application Logic
- Vanilla JavaScript

## Local Database
- Dexie.js (IndexedDB wrapper)

## Printing Support
- Browser-based JavaScript printing
- Compatible with **thermal receipt printers**

---

# System Architecture

```
User Interface (HTML + Tailwind CSS)
            |
            v
Application Logic (JavaScript)
            |
            v
Local Database (Dexie.js / IndexedDB)
```

This architecture allows the POS system to run **offline directly inside the browser**.

---

# Database Schema

The system uses Dexie.js to store data locally in the browser.

## Products Table

```
++id, name, barcode, category, costPrice, retailPrice, wholesalePrice, stockCount, type
```

Fields:

- `id` – Auto-increment primary key
- `name` – Product name
- `barcode` – Product barcode
- `category` – Product category
- `costPrice` – Cost price
- `retailPrice` – Retail selling price
- `wholesalePrice` – Wholesale selling price
- `stockCount` – Current inventory quantity
- `type` – Product source (In-house / Vendor)

---

## Sales Table

```
++id, date, totalAmount, discount, paymentMethod, items
```

Fields:

- `id` – Sale ID
- `date` – Sale date
- `totalAmount` – Final sale amount
- `discount` – Discount applied
- `paymentMethod` – Cash / Card / Credit
- `items` – JSON list of sold products

---

## Suppliers Table

```
++id, name, contact
```

Fields:

- `id` – Supplier ID
- `name` – Supplier name
- `contact` – Supplier contact number

---

# Main System Modules

## Dashboard
- Business overview
- Quick access to system modules
- Low stock alerts

---

## Inventory Module
- Add new products
- Update stock quantities
- Search products
- Barcode-based product lookup

---

## POS / Billing Module
- Select products for sale
- Apply retail or wholesale pricing
- Add discounts
- Choose payment method
- Generate invoice
- Print receipt

---

## Supplier Management
- Add supplier details
- View supplier list
- Track vendor purchases

---

## Reports Module
- Daily sales summary
- Monthly sales summary
- Profit calculation

---

# Installation & Usage

1. Clone the repository

```
git clone https://github.com/chanuthjayasekera/clothing-pos-system.git
```

2. Open the project folder

3. Launch the system by opening:

```
index.html
```

in a web browser.

No server setup is required since the system runs fully in the browser.

---

# Offline Capability

The system uses **Dexie.js with IndexedDB**, which allows:

- Local data storage
- Offline operation
- Fast access to product and sales data

This makes the POS system suitable for **small retail stores without reliable internet connections**.

---

# Future Improvements

Possible future enhancements include:

- Customer management
- User authentication (Admin / Staff roles)
- Barcode scanner hardware integration
- Export reports to PDF or Excel
- Cloud synchronization
- Mobile-friendly interface
- Advanced analytics dashboard

---

# Project Status

This project is a **functional prototype POS system** demonstrating:

- Inventory management
- Retail & wholesale pricing
- Offline-capable data storage
- Billing workflow
- Supplier management
- Sales reporting

The system can be extended into a **complete commercial POS solution** with additional features and cloud integration.

---

# Author

**Chanuth Jayasekera**

GitHub:  
https://github.com/chanuthjayasekera
