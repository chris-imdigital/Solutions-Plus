# Custom Engraving Products Setup Guide

This document covers the setup and configuration for the custom engraving feature, which allows products to display configurable text input fields on the product detail page (PDP).

## Overview

The custom engraving feature:
- Displays 1-10 text input fields based on product metafields
- Supports optional character limits per line
- Stores input values as line item properties (`properties[Line 1]`, `properties[Line 2]`, etc.)
- Properties appear in cart, checkout, and order admin

---

## Metafield Setup

You must create two metafields in the Shopify admin. Navigate to **Settings > Custom data > Products** and add the following:

### Required Metafield

| Field | Value |
|-------|-------|
| **Name** | Custom Engraving Inputs |
| **Namespace and key** | `custom.custom_engraving_inputs` |
| **Type** | Integer |
| **Description** | Number of engraving input lines (1-10) |
| **Validation** | Min: 1, Max: 10 |

### Optional Metafield

| Field | Value |
|-------|-------|
| **Name** | Custom Line Character Limit |
| **Namespace and key** | `custom.custom_line_character_limit` |
| **Type** | Integer |
| **Description** | Maximum characters allowed per line |
| **Validation** | Min: 1 |

---

## Product Configuration

For each product that should have engraving options:

1. Go to **Products** in the Shopify admin
2. Select the product
3. Scroll to **Metafields** section
4. Set **Custom Engraving Inputs** to the number of lines (e.g., `3`)
5. Optionally set **Custom Line Character Limit** (e.g., `20`)
6. Assign the product to the `product.custom-product` template

---

## Template Assignment

Products with engraving fields should use the dedicated template:

1. Go to **Products** in the Shopify admin
2. Select the product
3. In the right sidebar, under **Theme template**, select `product.custom-product`
4. Save

Alternatively, you can add the "Custom engraving inputs" block to any existing product template via the theme customizer.

---

## Theme Customizer Configuration

The engraving block has the following settings:

| Setting | Default | Description |
|---------|---------|-------------|
| **Heading** | "Custom engraving" | Label displayed above inputs |
| **Input placeholder** | "Enter text" | Placeholder text in empty fields |
| **Require input** | Off | When enabled, fields must be filled before adding to cart |
| **Padding** | 0px | Top, bottom, left, right padding |

---

## How It Works

1. **On the PDP**: When a product has `custom_engraving_inputs` set, the block renders that many text inputs
2. **Character counter**: If `custom_line_character_limit` is set, a live character counter shows remaining characters
3. **Form submission**: Inputs use the HTML5 `form` attribute to associate with the buy buttons form
4. **Cart properties**: Values are stored as `properties[Line 1]`, `properties[Line 2]`, etc.
5. **Display**: Properties appear in cart drawer, cart page, checkout, and order confirmation

---

## Data Flow

```
Product Metafield → Block Renders Inputs → User Enters Text → Add to Cart
     ↓
Line Item Properties → Cart Display → Checkout → Order Admin
```

---

## Testing Checklist

Before going live, verify:

- [ ] Metafields are created with correct namespace/key
- [ ] Test product has metafield values set
- [ ] Product is assigned to `product.custom-product` template
- [ ] Correct number of input fields appear
- [ ] Character counter works (if limit set)
- [ ] Product adds to cart with properties
- [ ] Properties display in cart drawer
- [ ] Properties display on cart page
- [ ] Properties visible in checkout
- [ ] Properties appear in order admin

---

## Technical Details

### Files Modified/Created

| File | Change |
|------|--------|
| `blocks/buy-buttons.liquid` | Form ID changed from `block.id` to `section.id` |
| `blocks/custom-engraving-inputs.liquid` | New block file |
| `blocks/_product-details.liquid` | Added block type to schema |
| `templates/product.custom-product.json` | New product template |
| `assets/custom-engraving-inputs.js` | Character counter JavaScript |

### Form Association

The engraving inputs use the HTML5 `form` attribute to associate with the product form:

```html
<input
  type="text"
  name="properties[Line 1]"
  form="BuyButtons-ProductForm-{{ section.id }}"
>
```

This allows the inputs to be placed anywhere in the product section while still submitting with the add-to-cart form.

---

## Troubleshooting

### Inputs not appearing
- Verify `custom.custom_engraving_inputs` metafield exists and has a value > 0
- Check product is assigned to correct template
- Ensure the "Custom engraving inputs" block is added in the template

### Properties not in cart
- Verify the form ID matches: `BuyButtons-ProductForm-{{ section.id }}`
- Check browser dev tools for form association errors
- Ensure inputs have `name="properties[Line X]"` attribute

### Character counter not working
- Check that `custom.custom_line_character_limit` metafield is set
- Verify JavaScript file is loading (`custom-engraving-inputs.js`)
- Check browser console for errors

---

## Support

For questions or issues with this feature, refer to:
- **Jira**: SAL-133 (Phase 3: Customized Engraving Products)
- **Confluence**: [Customized Engraving Products Spec](https://imgmedia.atlassian.net/wiki/spaces/SAL/pages/4056809478)
