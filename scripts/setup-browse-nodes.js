#!/usr/bin/env node
/**
 * Browse Node Metaobject Setup
 *
 * Creates the browse_node metaobject definition, hierarchy entries, and
 * assigns browse nodes to imported test products.
 *
 * Based on: docs/features/STIBO-PIM-API.md + SW12 breadcrumb research
 *
 * Prerequisites:
 *   source .env   (sets SHOPIFY_STORE and SHOPIFY_ACCESS_TOKEN)
 *
 * Usage:
 *   node scripts/setup-browse-nodes.js
 *   node scripts/setup-browse-nodes.js --dry-run
 */

const SHOPIFY_API_VERSION = '2024-04';
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SHOPIFY_STORE || !SHOPIFY_TOKEN) {
  console.error('Missing env vars. Run: source .env');
  process.exit(1);
}

const GQL_ENDPOINT = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

// --- GraphQL helper ---

async function gql(query, variables = {}) {
  const res = await fetch(GQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
}

// --- Step 1: Create browse_node metaobject definition (without parent field) ---

async function createDefinition() {
  console.log('\n[1] Creating browse_node metaobject definition...');

  const data = await gql(`
    mutation CreateBrowseNodeDefinition {
      metaobjectDefinitionCreate(definition: {
        name: "Browse Node"
        type: "browse_node"
        displayNameKey: "name"
        fieldDefinitions: [
          { key: "name",      name: "Name",      type: "single_line_text_field", required: true }
          { key: "url_slug",  name: "URL Slug",  type: "single_line_text_field" }
          { key: "url",       name: "URL",       type: "url" }
          { key: "pim_value", name: "PIM Value", type: "single_line_text_field" }
        ]
      }) {
        metaobjectDefinition { id type }
        userErrors { field message code }
      }
    }
  `);

  const { metaobjectDefinition, userErrors } = data.metaobjectDefinitionCreate;

  // Handle "already exists" gracefully — fetch existing definition ID
  if (userErrors.length) {
    const alreadyExists = userErrors.find(e => e.code === 'TAKEN');
    if (alreadyExists) {
      console.log('  Definition already exists — fetching existing ID...');
      return fetchDefinitionId('browse_node');
    }
    throw new Error(`Definition create errors: ${JSON.stringify(userErrors)}`);
  }

  console.log(`  Created definition: ${metaobjectDefinition.id}`);
  return metaobjectDefinition.id;
}

async function fetchDefinitionId(type) {
  const data = await gql(`
    query {
      metaobjectDefinitions(first: 50) {
        nodes { id type }
      }
    }
  `);
  const def = data.metaobjectDefinitions.nodes.find(n => n.type === type);
  if (!def) throw new Error(`Definition not found for type: ${type}`);
  console.log(`  Found existing definition: ${def.id}`);
  return def.id;
}

// --- Step 2: Add self-referential parent field ---

async function addParentField(definitionId) {
  console.log('\n[2] Adding self-referential parent field...');

  const data = await gql(`
    mutation UpdateBrowseNodeDefinition($id: ID!, $parentTypeId: String!) {
      metaobjectDefinitionUpdate(id: $id, definition: {
        fieldDefinitions: [
          {
            create: {
              key: "parent"
              name: "Parent"
              type: "metaobject_reference"
              validations: [
                { name: "metaobject_definition_id", value: $parentTypeId }
              ]
            }
          }
        ]
      }) {
        metaobjectDefinition { id }
        userErrors { field message code }
      }
    }
  `, { id: definitionId, parentTypeId: definitionId });

  const { userErrors } = data.metaobjectDefinitionUpdate;

  if (userErrors.length) {
    // Field already exists is fine
    const alreadyExists = userErrors.find(e => e.code === 'TAKEN');
    if (alreadyExists) {
      console.log('  Parent field already exists — skipping.');
      return;
    }
    throw new Error(`Parent field errors: ${JSON.stringify(userErrors)}`);
  }

  console.log('  Parent field added.');
}

// --- Step 3: Upsert browse_node hierarchy entries ---

async function upsertNode(handle, fields) {
  const data = await gql(`
    mutation UpsertBrowseNode($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject { id handle }
        userErrors { field message code }
      }
    }
  `, {
    handle: { type: 'browse_node', handle },
    metaobject: {
      fields: Object.entries(fields).map(([key, value]) => ({ key, value })),
    },
  });

  const { metaobject, userErrors } = data.metaobjectUpsert;
  if (userErrors.length) throw new Error(`Upsert errors for ${handle}: ${JSON.stringify(userErrors)}`);
  return metaobject;
}

async function setupHierarchy() {
  console.log('\n[3] Upserting browse_node hierarchy entries...');

  // L1: Bathroom
  const bathroom = await upsertNode('bathroom', {
    name: 'Bathroom',
    url_slug: 'bathroom',
    pim_value: 'Bath',
  });
  console.log(`  Upserted: bathroom (${bathroom.id})`);

  // L2: Toilets
  const toilets = await upsertNode('toilets', {
    name: 'Toilets',
    url_slug: 'toilets',
    pim_value: 'Toilets',
    parent: bathroom.id,
  });
  console.log(`  Upserted: toilets (${toilets.id})`);

  // L3a: Two-piece Toilets
  const twoPiece = await upsertNode('two-piece-toilets', {
    name: 'Two-piece Toilets',
    url_slug: 'two-piece-toilets',
    pim_value: 'Two Piece',
    parent: toilets.id,
  });
  console.log(`  Upserted: two-piece-toilets (${twoPiece.id})`);

  // L3b: One-piece Toilets
  const onePiece = await upsertNode('one-piece-toilets', {
    name: 'One-piece Toilets',
    url_slug: 'one-piece-toilets',
    pim_value: 'One Piece',
    parent: toilets.id,
  });
  console.log(`  Upserted: one-piece-toilets (${onePiece.id})`);

  return { bathroom, toilets, twoPiece, onePiece };
}

// --- Step 4: Create product metafield definition for browse_node reference ---

async function createMetafieldDefinition(definitionId) {
  console.log('\n[4] Creating product metafield definition (custom.browse_node)...');

  const data = await gql(`
    mutation CreateBrowseNodeMetafieldDef($defId: String!) {
      metafieldDefinitionCreate(definition: {
        name: "Browse Node"
        namespace: "custom"
        key: "browse_node"
        type: "metaobject_reference"
        ownerType: PRODUCT
        validations: [
          { name: "metaobject_definition_id", value: $defId }
        ]
      }) {
        createdDefinition { id }
        userErrors { field message code }
      }
    }
  `, { defId: definitionId });

  const { createdDefinition, userErrors } = data.metafieldDefinitionCreate;

  if (userErrors.length) {
    const alreadyExists = userErrors.find(e => e.code === 'TAKEN');
    if (alreadyExists) {
      console.log('  Metafield definition already exists — skipping.');
      return;
    }
    throw new Error(`Metafield def errors: ${JSON.stringify(userErrors)}`);
  }

  console.log(`  Created metafield definition: ${createdDefinition.id}`);
}

// --- Step 5: Find product by variant SKU ---

async function findProductBySku(sku) {
  const data = await gql(`
    query FindBySku($query: String!) {
      productVariants(first: 1, query: $query) {
        nodes { product { id title } }
      }
    }
  `, { query: `sku:${sku}` });

  const nodes = data.productVariants.nodes;
  if (!nodes.length) throw new Error(`Product not found for SKU: ${sku}`);
  return nodes[0].product;
}

// --- Step 6: Assign browse_node metafield to products ---

async function assignBrowseNode(productId, nodeId) {
  const data = await gql(`
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { key value }
        userErrors { field message code }
      }
    }
  `, {
    metafields: [{
      ownerId: productId,
      namespace: 'custom',
      key: 'browse_node',
      type: 'metaobject_reference',
      value: nodeId,
    }],
  });

  const { userErrors } = data.metafieldsSet;
  if (userErrors.length) throw new Error(`Metafield set errors: ${JSON.stringify(userErrors)}`);
}

async function assignBrowseNodes(nodes) {
  console.log('\n[5] Assigning browse nodes to test products...');

  // SKU -> leaf browse node
  const assignments = [
    { sku: '215FC104.020', nodeId: nodes.twoPiece.id },
    { sku: '2004314.020',  nodeId: nodes.onePiece.id },
  ];

  for (const { sku, nodeId } of assignments) {
    const product = await findProductBySku(sku);
    await assignBrowseNode(product.id, nodeId);
    console.log(`  ${sku} -> "${product.title.slice(0, 50)}..." -> ${nodeId}`);
  }
}

// --- Main ---

async function run() {
  if (DRY_RUN) {
    console.log('[dry-run] Would create browse_node definition, hierarchy, and assign to 215FC104.020 + 2004314.020');
    return;
  }

  try {
    const definitionId = await createDefinition();
    await addParentField(definitionId);
    const nodes = await setupHierarchy();
    await createMetafieldDefinition(definitionId);
    await assignBrowseNodes(nodes);

    console.log('\n✓ Setup complete.');
    console.log(`  Browse nodes: https://${SHOPIFY_STORE}/admin/content/entries/browse_node`);
    console.log(`  Products:     https://${SHOPIFY_STORE}/admin/products`);
  } catch (err) {
    console.error('\n✗ Error:', err.message);
    process.exit(1);
  }
}

run();
