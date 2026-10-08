import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PageIndexClient } from '@pageindex/sdk';
import '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSET_DIR = path.resolve(__dirname, '../asset');
const CONFIG_FILE = path.resolve(__dirname, '../config/pageIndexDocs.json');
const API_KEY = process.env.PAGEINDEX_API_KEY || 'f76d0f2889e1436eb8ecd54065bf3aba';

async function pushAllPdfDocuments() {
  console.log('🚀 [PageIndex Uploader] Starting PDF upload to PageIndex...');
  console.log(`📁 Asset Directory: ${ASSET_DIR}`);
  console.log(`🔑 API Key: ${API_KEY.slice(0, 8)}...`);

  const client = new PageIndexClient({ apiKey: API_KEY });

  // 1. Fetch currently uploaded documents
  let existingDocs = [];
  try {
    const listRes = await client.api.listDocuments({ limit: 100 });
    existingDocs = listRes.documents || [];
    console.log(`📋 Found ${existingDocs.length} existing documents in PageIndex.`);
  } catch (err) {
    console.warn('⚠️ Could not list existing documents:', err.message);
  }

  const existingMap = new Map();
  for (const doc of existingDocs) {
    existingMap.set(doc.name, doc.id);
  }

  // 2. Read all PDF files in asset directory
  if (!fs.existsSync(ASSET_DIR)) {
    console.error(`❌ Asset folder not found: ${ASSET_DIR}`);
    return;
  }

  const files = fs.readdirSync(ASSET_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`📚 Found ${files.length} PDF documents in asset folder:`);
  files.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));

  const uploadedRecords = [];

  // 3. Sequential upload
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const filePath = path.join(ASSET_DIR, fileName);
    const stats = fs.statSync(filePath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`\n------------------------------------------------------------`);
    console.log(`[${i + 1}/${files.length}] Processing: "${fileName}" (${sizeMb} MB)`);

    // Check if already uploaded
    if (existingMap.has(fileName)) {
      const existingId = existingMap.get(fileName);
      console.log(`⏩ Already exists on PageIndex: doc_id = ${existingId}`);
      uploadedRecords.push({
        name: fileName,
        doc_id: existingId,
        sizeBytes: stats.size,
        status: 'already_uploaded',
      });
      continue;
    }

    try {
      console.log(`⬆️ Reading buffer and submitting to PageIndex...`);
      const buffer = fs.readFileSync(filePath);

      const submitRes = await client.api.submitDocument(buffer, fileName);
      const docId = submitRes.doc_id;

      console.log(`✅ Upload Succeeded!`);
      console.log(`   Doc ID: ${docId}`);
      console.log(`   Name:   ${fileName}`);

      uploadedRecords.push({
        name: fileName,
        doc_id: docId,
        sizeBytes: stats.size,
        status: 'submitted',
      });

      // Brief delay between uploads
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`❌ Failed to upload "${fileName}":`, err.message);
      uploadedRecords.push({
        name: fileName,
        doc_id: null,
        sizeBytes: stats.size,
        status: 'failed',
        error: err.message,
      });
    }
  }

  // 4. Save results to config
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(uploadedRecords, null, 2), 'utf-8');
  console.log(`\n🎉 Upload batch finished! Saved ${uploadedRecords.length} document references to:`);
  console.log(`   ${CONFIG_FILE}`);

  const successful = uploadedRecords.filter(r => r.doc_id);
  console.log(`📊 Summary: ${successful.length}/${files.length} documents indexed successfully in PageIndex.`);
}

pushAllPdfDocuments().catch(err => {
  console.error('Fatal error during upload:', err);
  process.exit(1);
});
