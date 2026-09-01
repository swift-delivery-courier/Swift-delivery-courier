const db = require('../db/database');

async function generateTrackingNumber() {
  const year = new Date().getFullYear();
  for (let i = 0; i < 20; i++) {
    const num = String(Math.floor(100000 + Math.random() * 900000));
    const tn = `SWD-${year}-${num}`;
    const exists = await db.get('SELECT 1 as x FROM shipments WHERE tracking_number = ?', [tn]);
    if (!exists) return tn;
  }
  return `SWD-${year}-${Date.now().toString().slice(-6)}`;
}

async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  for (let i = 0; i < 20; i++) {
    const num = String(Math.floor(100000 + Math.random() * 900000));
    const inv = `INV-${year}-${num}`;
    const exists = await db.get('SELECT 1 as x FROM invoices WHERE invoice_number = ?', [inv]);
    if (!exists) return inv;
  }
  return `INV-${year}-${Date.now().toString().slice(-6)}`;
}

async function calculateQuote(weightKg, serviceType) {
  const rate = await db.get(
    'SELECT * FROM shipping_rates WHERE service_type = ? AND active = 1',
    [serviceType || 'standard']
  );
  const defaults = {
    express: { base_fee: 28, per_kg_rate: 9.5, multiplier: 1, estimated_days_min: 2, estimated_days_max: 5 },
    standard: { base_fee: 18, per_kg_rate: 7.5, multiplier: 1, estimated_days_min: 4, estimated_days_max: 10 },
    economy: { base_fee: 12, per_kg_rate: 5.5, multiplier: 1, estimated_days_min: 7, estimated_days_max: 14 }
  };
  const r = rate || defaults[serviceType] || defaults.standard;
  const w = Math.max(0.1, Number(weightKg) || 0.1);
  const amount = Math.round((r.base_fee + w * r.per_kg_rate) * (r.multiplier || 1) * 100) / 100;
  return {
    amount,
    currency: 'USD',
    estimatedDaysMin: r.estimated_days_min,
    estimatedDaysMax: r.estimated_days_max
  };
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

module.exports = { generateTrackingNumber, generateInvoiceNumber, calculateQuote, addDays };
