---
title: Auto Inventory Deduction
description: How bundle sales automatically update your stock — and why it's reliable
---

# Auto Inventory Deduction

## How It Works (Store Owner)

When a customer buys a bundle from your store, every component inside that bundle needs to come out of your inventory. Shopigent Stock does this automatically — the moment an order comes in, component stock levels decrease without you lifting a finger.

**Here's what that means for you:** A customer orders your "Tea Sampler" bundle (2 boxes of Tea A + 1 box of Tea B). Shopigent Stock immediately deducts 2 units of Tea A and 1 unit of Tea B from your inventory. No manual adjustments, no spreadsheet math, no remembering to update counts after every sale.

**Why this matters:** Most bundle apps only track the bundle itself — they never touch component stock. That means your inventory counts drift, you oversell components, and you find out when a customer can't be fulfilled. Shopigent Stock is the only app that closes that gap. Every sale deducts component inventory exactly once, automatically.

Auto inventory deduction is ONLY available in Shopigent Stock — no other bundle app does this.

---

## Technical Reference (for developers)

### The InventoryEvent Ledger

Every deduction is recorded as an `InventoryEvent` — a permanent log that stores the shop ID, order ID, bundle ID, component variant, and quantity deducted.

A database constraint (unique per order + variant) ensures that even if Shopify sends the same order notification multiple times, only the first deduction goes through. Subsequent attempts are silently skipped. This prevents double-deduction no matter what.

### Deduction Flow

1. An order comes in from Shopify containing bundle line items
2. Shopigent Stock identifies which line items are bundles
3. Component deductions are recorded in the `InventoryEvent` ledger
4. Inventory quantities are adjusted via Shopify's inventory API

Each variant is adjusted only once per order. The ledger acts as a check — if a deduction was already recorded, it's skipped. The system doesn't need to read current stock levels before adjusting, so there's no race condition between simultaneous orders.

### Verification

To confirm deduction is working:
1. Create a bundle with known components in the app
2. Place a test order containing that bundle
3. Check inventory levels in Shopify Admin (Products → edit variant) — they should be reduced
4. View **Recent deductions** on the app Dashboard — each component appears once

If you fire the same webhook again, the ledger constraint blocks any additional deduction. No double-counting.