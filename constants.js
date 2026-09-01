const SHIPMENT_STATUSES = [
  { key: 'order_received', label: 'Order Received' },
  { key: 'picked_up', label: 'Shipment Picked Up' },
  { key: 'processing', label: 'Processing' },
  { key: 'departed_origin', label: 'Departed Origin Facility' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'arrived_destination_country', label: 'Arrived at Destination Country' },
  { key: 'customs_processing', label: 'Customs Processing' },
  { key: 'customs_cleared', label: 'Customs Cleared' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'exception', label: 'Exception / On Hold' },
  { key: 'returned', label: 'Returned' }
];

const STATUS_MAP = Object.fromEntries(SHIPMENT_STATUSES.map(s => [s.key, s.label]));

const SERVICE_TYPES = [
  { key: 'express', label: 'Express' },
  { key: 'standard', label: 'Standard' },
  { key: 'economy', label: 'Economy' }
];

const PACKAGE_TYPES = [
  { key: 'parcel', label: 'Parcel / Box' },
  { key: 'document', label: 'Documents' },
  { key: 'pallet', label: 'Pallet' },
  { key: 'fragile', label: 'Fragile' },
  { key: 'other', label: 'Other' }
];

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
  'Bangladesh', 'Belgium', 'Benin', 'Brazil', 'Bulgaria', 'Cameroon',
  'Canada', 'Chile', 'China', 'Colombia', "Côte d'Ivoire", 'Croatia',
  'Czech Republic', 'Denmark', 'Egypt', 'Ethiopia', 'Finland', 'France',
  'Germany', 'Ghana', 'Greece', 'Hong Kong', 'Hungary', 'India',
  'Indonesia', 'Ireland', 'Israel', 'Italy', 'Japan', 'Kenya',
  'Malaysia', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Nigeria',
  'Norway', 'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Romania',
  'Saudi Arabia', 'Senegal', 'Singapore', 'South Africa', 'South Korea',
  'Spain', 'Sweden', 'Switzerland', 'Tanzania', 'Thailand', 'Turkey',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Vietnam', 'Zambia', 'Zimbabwe'
].sort();

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'NGN', 'GHS', 'ZAR'];

module.exports = {
  SHIPMENT_STATUSES, STATUS_MAP, SERVICE_TYPES, PACKAGE_TYPES, COUNTRIES, CURRENCIES
};
