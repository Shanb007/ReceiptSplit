# ReceiptSplit

**AI-powered receipt parsing and per-item expense splitting**

## Project Overview

**ReceiptSplit** is a web application that converts a photo of a receipt into a clean, structured expense breakdown and enables users to split costs **per item** among group members. It is designed as a *human-in-the-loop AI system*, where AI reduces manual work but users retain full control over correctness.

The product focuses on **real-world AI engineering challenges**:

* noisy OCR data
* ambiguity in extraction
* confidence estimation
* user correction workflows
* deterministic financial outcomes

The final output can be **exported directly to Splitwise** as a single expense with custom splits.

---

## Problem Statement

Splitting group expenses from receipts is tedious and error-prone:

* receipts are unstructured and inconsistent
* items are shared unevenly
* tax and tip need fair allocation
* manual entry into Splitwise is time-consuming

Existing tools either:

* require full manual entry, or
* oversimplify splitting (equal split only)

**ReceiptSplit solves this by combining AI extraction with a robust review and correction flow**, enabling accurate, item-level splitting without losing trust.

---

## Goals

### Functional goals

* Reduce manual effort when splitting group receipts
* Support realistic, per-item splitting
* Guarantee mathematically correct settlements

### Engineering goals

* Demonstrate applied AI system design
* Show uncertainty handling and validation
* Build a production-minded AI workflow (not just a demo)

---

## Target Users

* Friends splitting dining bills
* Roommates splitting grocery receipts
* Small groups traveling together
* Users who already use Splitwise and want faster input

---

## Core User Flow

1. User creates or selects a **group**
2. User uploads a **receipt image**
3. System extracts receipt data automatically
4. User reviews and corrects extracted items
5. User assigns items to people
6. System allocates tax and tip
7. App computes final balances
8. User exports the expense to Splitwise (optional)

---

## Features

### 1. Group & Member Management

* Create a group (e.g. “Dinner – Jan 24”)
* Add members with names
* Mark who paid the bill
* Groups exist independently of Splitwise

---

### 2. Receipt Upload & Parsing

#### Input

* Image upload (camera photo or screenshot)
* Supported formats: JPG / PNG / HEIC

#### Extracted data

* Merchant name (optional)
* Date (optional)
* Line items:

    * item name
    * quantity (if available)
    * unit price
    * line total
* Subtotal
* Tax
* Tip
* Total

#### Common receipt edge cases handled

* multi-line item names
* abbreviated item labels
* coupons / discounts
* service charges
* duplicated lines
* missing subtotal or tax

---

### 3. Confidence & Uncertainty Awareness (key AI feature)

Each extracted line item includes:

* confidence score (high / medium / low)
* reason for uncertainty (e.g. OCR ambiguity, price mismatch)

UI highlights:

* low-confidence items
* totals that don’t reconcile
* duplicate or suspicious entries

This makes the AI **transparent**, not magical.

---

### 4. Human-in-the-Loop Review & Editing

Users can:

* edit item names
* edit prices or quantities
* delete incorrect lines
* add missing items
* merge or split items
* mark non-items (e.g. cashier name)

The system re-validates totals after every change.

---

### 5. Flexible Splitting Logic

#### Supported split modes

* **Equal split**

    * among all members
    * or selected members
* **Per-item split**

    * assign each item to:

        * one person
        * multiple people (shared items)
* **Custom assignment**

    * choose who shares which item

#### Rules

* item cost is split evenly among assigned people
* rounding is handled deterministically
* final sums always match receipt total exactly

---

### 6. Tax & Tip Allocation

Supported strategies:

1. **Proportional allocation (default)**

    * tax/tip distributed based on each person’s pre-tax total
2. **Equal allocation**

    * tax/tip split evenly among participants
3. **Manual override**

    * user edits final values if needed

---

### 7. Settlement Computation

Output includes:

* per-person breakdown:

    * items
    * subtotal
    * tax share
    * tip share
    * final amount
* group summary:

    * receipt total
    * total assigned amount
* settlement view:

    * who owes whom
    * net balances (assuming one payer in MVP)

---

### 8. Splitwise Integration (Optional but Powerful)

Users can:

* authenticate with Splitwise (OAuth)
* select an existing Splitwise group
* export the expense as:

    * a single expense
    * custom owed shares per member

**Design choice:**

* per-item splits are collapsed into one Splitwise expense
* description references itemization handled in ReceiptSplit

This keeps Splitwise clean and usable.

---

## What This Project Demonstrates (for recruiters)

### AI Engineering

* structured extraction from unstructured data
* schema validation and retries
* uncertainty awareness
* human-in-the-loop correction

### Systems Thinking

* deterministic financial calculations
* idempotent updates
* rounding correctness
* export consistency

### Product Thinking

* real user pain point
* progressive automation
* trust-first design

---

## MVP Scope (clear and realistic)

Included:

* group creation
* receipt upload
* line-item extraction
* editable review UI
* per-item splitting
* proportional tax/tip allocation
* settlement computation
* Splitwise export

Excluded (for later):

* multi-receipt trips
* multiple payers
* automatic learning from corrections
* receipt history analytics

