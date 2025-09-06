import mongoose from 'mongoose';

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const serviceAvailedSchema = new Schema(
  {
    service_id: String,
    service_name: String,
    start_date: Date,
    fee_structure: String,
    status: { type: String, enum: ['Active', 'Inactive', 'Suspended'] },
  },
  { _id: false }
);

const complianceItemSchema = new Schema(
  {
    filing_type: String,
    due_date: Date,
    frequency: { type: String, enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Annual'] },
    last_filed: Date,
    status: String,
  },
  { _id: false }
);

const documentItemSchema = new Schema(
  {
    name: String,
    type: String,
    url: String,
    uploaded_date: Date,
    expiry_date: Date,
  },
  { _id: true }
);

const signatorySchema = new Schema(
  {
    name: String,
    designation: String,
    phone: String,
    email: String,
    din: String,
  },
  { _id: false }
);

const bankDetailSchema = new Schema(
  {
    bank_name: String,
    account_number: String,
    ifsc_code: String,
    account_type: String,
  },
  { _id: false }
);

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

const clientSchema = new Schema(
  {
    // Basic Information
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'Individual',
        'Sole Proprietorship',
        'Partnership',
        'LLP',
        'Private Limited',
        'Public Limited',
        'Trust',
        'Society',
      ],
      required: true,
    },
    constitution: String,

    // Contact Information
    contact_person: String,
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    address: addressSchema,

    // Legal Information
    pan: { type: String, match: PAN_REGEX },
    gstin: { type: String, match: GSTIN_REGEX },
    tan: String,
    cin: String,
    llpin: String,
    aadhaar: String,

    // Business Information
    nature_of_business: String,
    annual_turnover: Number,
    employees_count: Number,
    accounting_period: { start: Date, end: Date },
    financial_year: String,

    // Service Information
    services_availed: [serviceAvailedSchema],

    // Fee and Payment
    fee_structure: { type: String, enum: ['Monthly Retainer', 'Per Service', 'Annual Contract'] },
    payment_terms: String,
    credit_limit: Number,

    // Relationship Management
    assigned_manager: { type: Schema.Types.ObjectId, ref: 'Staff' },
    assigned_executive: { type: Schema.Types.ObjectId, ref: 'Staff' },
    client_since: Date,
    status: { type: String, enum: ['Active', 'Inactive', 'Prospect', 'Suspended'], default: 'Active' },
    risk_category: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    satisfaction_rating: { type: Number, min: 1, max: 5 },

    // Compliance and Deadlines
    compliance_calendar: [complianceItemSchema],

    // Documents and Attachments
    documents: [documentItemSchema],

    // Authorized Signatories
    authorized_signatories: [signatorySchema],

    // Banking Information
    bank_details: [bankDetailSchema],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

clientSchema.index({ name: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ pan: 1 }, { sparse: true });
clientSchema.index({ gstin: 1 }, { sparse: true });

const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);
export default Client;

