import mongoose from 'mongoose';

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  { _id: false }
);

const educationSchema = new Schema(
  {
    degree: String,
    institution: String,
    year_of_completion: Number,
    percentage: Number,
  },
  { _id: false }
);

const certificationSchema = new Schema(
  {
    certification: { type: String, enum: ['CA', 'CS', 'CMA', 'CPA', 'ACCA', 'Other'] },
    membership_number: String,
    year_obtained: Number,
    validity: Date,
  },
  { _id: false }
);

const experienceSchema = new Schema(
  {
    company: String,
    designation: String,
    from_date: Date,
    to_date: Date,
    responsibilities: String,
  },
  { _id: false }
);

const targetSchema = new Schema(
  {
    metric: String,
    target_value: Number,
    achieved_value: Number,
    period: String,
    year: Number,
  },
  { _id: false }
);

const reviewSchema = new Schema(
  {
    review_date: Date,
    reviewer: String,
    overall_rating: { type: Number, min: 1, max: 5 },
    comments: String,
    goals: [String],
  },
  { _id: false }
);

const salarySchema = new Schema(
  {
    basic_salary: Number,
    hra: Number,
    medical_allowance: Number,
    conveyance_allowance: Number,
    special_allowance: Number,
    pf_number: String,
    esi_number: String,
    uan_number: String,
  },
  { _id: false }
);

const leaveBalanceSchema = new Schema(
  {
    annual_leave: Number,
    sick_leave: Number,
    casual_leave: Number,
    maternity_leave: Number,
    paternity_leave: Number,
  },
  { _id: false }
);

const leaveHistorySchema = new Schema(
  {
    type: String,
    from_date: Date,
    to_date: Date,
    days: Number,
    reason: String,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'] },
  },
  { _id: false }
);

const documentSchema = new Schema(
  {
    document_type: {
      type: String,
      enum: [
        'Resume',
        'Aadhaar',
        'PAN',
        'Passport',
        'Educational Certificates',
        'Experience Letters',
        'Bank Details',
      ],
    },
    file_name: String,
    file_url: String,
    upload_date: Date,
  },
  { _id: false }
);

const staffSchema = new Schema(
  {
    // Personal Information
    employee_id: { type: String, unique: true, required: true },
    full_name: { type: String, required: true },
    father_name: String,
    date_of_birth: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    marital_status: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },

    // Contact Information
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    current_address: addressSchema,
    permanent_address: addressSchema,
    emergency_contact: { name: String, relationship: String, phone: String },

    // Professional Information
    designation: { type: String, required: true },
    department: String,
    joining_date: { type: Date, required: true },
    employee_type: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'] },
    reporting_manager: { type: String },

    // Qualifications and Skills
    educational_qualifications: [educationSchema],
    professional_certifications: [certificationSchema],
    skills: [String],
    specializations: [String],
    experience: [experienceSchema],

    // System Access
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Manager', 'Executive', 'Staff'], required: true },
    permissions: [String],
    last_login: Date,
    is_active: { type: Boolean, default: true },

    // Performance and KPIs
    targets: [targetSchema],
    performance_reviews: [reviewSchema],

    // Compensation and Benefits
    salary_details: salarySchema,

    // Leave Management
    leave_balance: leaveBalanceSchema,
    leave_history: [leaveHistorySchema],

    // Documents
    documents: [documentSchema],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

staffSchema.index({ employee_id: 1 }, { unique: true });
staffSchema.index({ email: 1 }, { unique: true });
staffSchema.index({ username: 1 }, { unique: true });

const Staff = mongoose.models.Staff || mongoose.model('Staff', staffSchema);
export default Staff;

