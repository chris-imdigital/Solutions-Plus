#!/usr/bin/env node
/**
 * STIBO PIM -> Shopify Product Importer
 *
 * Fetches product data from the Lixil Americas PIM API and imports to Shopify.
 *
 * Prerequisites:
 *   source .env   (sets SHOPIFY_STORE and SHOPIFY_ACCESS_TOKEN)
 *
 * Usage:
 *   node scripts/import-products.js <SKU> [<SKU2> ...]
 *   node scripts/import-products.js --dry-run <SKU>
 *
 * Examples:
 *   node scripts/import-products.js 215FC104.020
 *   node scripts/import-products.js --dry-run 215FC104.020
 *   node scripts/import-products.js 215FC104.020 215FC104.021 215FC104.022
 */

const STIBO_BASE = 'https://api.lixilamericas.com/productdata';
const SHOPIFY_API_VERSION = '2024-04';

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');
const skus = process.argv.slice(2).filter(a => !a.startsWith('--'));

if (!skus.length) {
  console.error('Usage: node scripts/import-products.js [--dry-run] <SKU> [<SKU2> ...]');
  process.exit(1);
}

if (!SHOPIFY_STORE || !SHOPIFY_TOKEN) {
  console.error('Missing env vars. Run: source .env');
  process.exit(1);
}

// --- STIBO fetch ---

async function fetchFromStibo(sku) {
  const query = `SELECT * FROM us_pim_americas.product_data WHERE Mfg_Product_Number_SAP = '${sku}'`;
  const url = `${STIBO_BASE}?output_type=json&q=${encodeURIComponent(query)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`STIBO ${res.status}: ${await res.text()}`);

  const records = await res.json();
  if (!records.length) return null;

  // The API returns duplicate records for US and CA locales.
  // Prefer the US record (lixilpro.com URL), fall back to first.
  return records.find(r => r.PP_URL?.includes('lixilpro.com')) ?? records[0];
}

// --- Field mapping ---

function buildBodyHtml(r) {
  const parts = [];

  if (r.Marketing_Copy) {
    parts.push(`<p>${r.Marketing_Copy}</p>`);
  }

  const bullets = [];
  for (let i = 1; i <= 10; i++) {
    const b = r[`Feature_Bullets_${i}`];
    if (b) bullets.push(`<li>${b}</li>`);
  }
  if (bullets.length) {
    parts.push(`<ul>\n${bullets.join('\n')}\n</ul>`);
  }

  return parts.join('\n');
}

function buildTags(r) {
  return [
    r.Brand,
    r.Color_Code,
    r.Product_Family_SAP,
    r.LWTCategory,
    r.Residential_or_Commercial,
    r.Bowl_Shape,
    r.Toilet_Type_from_Classification,
    r.ADA_YN === 'Yes' ? 'ADA Compliant' : null,
    r.EPA_Watersense_YN === 'Yes' ? 'WaterSense' : null,
    r.Everclean_YN === 'Yes' ? 'EverClean' : null,
  ].filter(Boolean).join(', ');
}

function parseWeight(str) {
  const m = (str || '').match(/^([\d.]+)\s*(\w+)/);
  if (!m) return { weight: 0, weight_unit: 'lb' };
  return {
    weight: parseFloat(m[1]),
    weight_unit: m[2].toLowerCase().startsWith('lb') ? 'lb' : 'kg',
  };
}

function mapToShopify(r) {
  const images = (r.Main_Image_URL_2000 || '')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .map(src => ({ src }));

  const { weight, weight_unit } = parseWeight(r.Product_Weight);

  return {
    product: {
      title: r.Material_Description_Marketing,
      body_html: buildBodyHtml(r),
      vendor: r.Brand || 'American Standard',
      product_type: r.LWTCategory || '',
      tags: buildTags(r),
      status: r.SKU_Status === 'Active' ? 'active' : 'draft',
      variants: [
        {
          price: (r.List_Price ?? 0).toString(),
          compare_at_price: r.UMAP ? r.UMAP.toString() : null,
          sku: r.Mfg_Product_Number_SAP,
          barcode: r.UPC_EAN_SAP || '',
          weight,
          weight_unit,
          inventory_management: 'shopify',
          inventory_policy: 'continue',
          taxable: true,
        },
      ],
      images: images.slice(0, 10),
    },
  };
}

// --- Shopify Admin API ---

async function createShopifyProduct(payload) {
  const url = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/products.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify ${res.status}: ${body}`);
  }

  return res.json();
}

// --- Main ---

async function run() {
  for (const sku of skus) {
    console.log(`\nSKU: ${sku}`);

    try {
      const record = await fetchFromStibo(sku);
      if (!record) {
        console.warn('  No data found in STIBO');
        continue;
      }

      const payload = mapToShopify(record);

      if (DRY_RUN) {
        console.log('  [dry-run] payload:');
        console.log(JSON.stringify(payload, null, 2));
        continue;
      }

      const result = await createShopifyProduct(payload);
      const p = result.product;
      console.log(`  Created: "${p.title}"`);
      console.log(`  Admin:   https://${SHOPIFY_STORE}/admin/products/${p.id}`);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }
}

run();
