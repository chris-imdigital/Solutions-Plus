# STIBO PIM API - Lixil Americas

Used to fetch product data from the Lixil Americas PIM (Product Information Management) system for importing test products into the Shopify dev store.

## Endpoint

```
GET https://api.lixilamericas.com/productdata
```

No auth required. No headers required.

## Query Parameters

| Param | Value |
|-------|-------|
| `output_type` | `json` |
| `q` | SQL SELECT statement (URL-encoded) |

## Query Patterns

### By SKU (single)
```
SELECT * FROM us_pim_americas.product_data WHERE Mfg_Product_Number_SAP = '215FC104.020'
```

### By SKU (multiple)
```
SELECT * FROM us_pim_americas.product_data WHERE Mfg_Product_Number_SAP IN ('215FC104.020', '215FC104.021')
```

### By brand
```
SELECT * FROM us_pim_americas.product_data WHERE Brand = 'American Standard'
```

### By category
```
SELECT * FROM us_pim_americas.product_data WHERE LWTCategory = 'Toilets'
```

### By product family
```
SELECT * FROM us_pim_americas.product_data WHERE Product_Family_SAP = 'CADET'
```

## Duplicate Records

Each SKU returns **two records** - one US and one CA locale variant. They share the same `Mfg_Product_Number_SAP` but differ in:
- `PP_URL` (US: `lixilpro.com`, CA: `americanstandard.ca`)
- Measurement units (US: inches/lbs, CA: mm/kg)
- Pricing (`List_Price`, `UMAP`)

The import script uses the US record (identified by `lixilpro.com` in `PP_URL`).

## Key Fields -> Shopify Mapping

| STIBO Field | Shopify Field | Notes |
|-------------|---------------|-------|
| `Material_Description_Marketing` | `title` | Full marketing title |
| `Marketing_Copy` | `body_html` | Long description |
| `Feature_Bullets_1-10` | `body_html` | Appended as `<ul>` |
| `Brand` | `vendor` | e.g. "American Standard" |
| `LWTCategory` | `product_type` | e.g. "Toilets" |
| `List_Price` | `variants[0].price` | USD list price |
| `UMAP` | `variants[0].compare_at_price` | Min advertised price |
| `Mfg_Product_Number_SAP` | `variants[0].sku` | e.g. "215FC104.020" |
| `UPC_EAN_SAP` | `variants[0].barcode` | UPC barcode |
| `Main_Image_URL_2000` | `images` | Semicolon-delimited URLs |
| `SKU_Status` | `status` | "Active" -> "active" |

## Other Notable Fields

| Field | Description |
|-------|-------------|
| `Lifestyle_Image_URL` | Lifestyle/room-set image |
| `Infographic_URL` | Semicolon-delimited infographic images |
| `Spec_Sheet_URL` | PDF spec sheet |
| `Installation_Instruction_URL` | PDF install guide |
| `Video_F_B_URL` | Primary YouTube video |
| `AdditionalVideoURLs` | Semicolon-delimited YouTube URLs |
| `SpareParts` | Semicolon-delimited related SKUs |
| `Included_Components` | Semicolon-delimited component SKUs |
| `SalientBullets` | Semicolon-delimited short feature bullets |
| `Color_Code` | Human-readable color (e.g. "White") |
| `Color_Code_SAP` | SAP color code (e.g. "WHITE") |
| `ParentProductID` | Groups color variants of same model |
| `ADA_YN` | ADA compliant ("Yes"/"No") |
| `EPA_Watersense_YN` | WaterSense certified |
| `Warranty_Type` | e.g. "5 Year Limited Warranty" |
| `Consumer_Average_Rating` | Rating string e.g. "3.56" |
| `Consumer_Total_Reviews` | Review count string |

## Import Script

See [scripts/import-products.js](../../scripts/import-products.js).

```bash
# Single product - dry run to preview payload
source .env
node scripts/import-products.js --dry-run 215FC104.020

# Import one product
node scripts/import-products.js 215FC104.020

# Import multiple products
node scripts/import-products.js 215FC104.020 215FC104.021 215FC104.022
```

After import, products appear in the Shopify admin at:
`https://solutions-plus-2.myshopify.com/admin/products`
