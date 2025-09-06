const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, default: 'India', trim: true }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
    service_id: { type: String, required: true },
    service_name: { type: String, required: true },
    start_date: { type: Date, required: true },
    fee_structure: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Active', 'Inactive', 'Suspended'],
        default: 'Active'
    }
}, { _id: false });

const complianceSchema = new mongoose.Schema({
    filing_type: { type: String, required: true },
    due_date: { type: Date, required: true },
    frequency: { 
        type: String, 
        enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Annual'],
        required: true
    },
    last_filed: { type: Date, default: null },
    status: { type: String, default: 'Pending' }
}, { _id: false });

const documentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    url: { type: String, required: true },
    uploaded_date: { type: Date, default: Date.now },
    expiry_date: { type: Date, default: null }
}, { _id: false });

const signatorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    designation: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    din: { type: String, default: null }
}, { _id: false });

const bankDetailSchema = new mongoose.Schema({
    bank_name: { type: String, required: true },
    account_number: { type: String, required: true },
    ifsc_code: { type: String, required: true },
    account_type: { type: String, required: true }
}, { _id: false });

const clientSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    type: {
        type: String,
        enum: ['Individual', 'Sole Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'Trust', 'Society'],
        required: true
    },
    constitution: {
        type: String,
        trim: true,
        maxlength: 100
    },
    
    // Contact Information
    contact_person: {
        type: String,
        trim: true,
        maxlength: 100
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Please enter a valid phone number']
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    address: addressSchema,
    
    // Legal Information
    pan: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
    },
    gstin: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[Z]{1}[0-9A-Z]{1}$/, 'Please enter a valid GSTIN']
    },
    tan: {
        type: String,
        trim: true,
        uppercase: true
    },
    cin: {
        type: String,
        trim: true,
        uppercase: true
    },
    llpin: {
        type: String,
        trim: true,
        uppercase: true
    },
    aadhaar: {
        type: String,
        trim: true,
        match: [/^[2-9]{1}[0-9]{11}$/, 'Please enter a valid Aadhaar number']
    },
    
    // Business Information
    nature_of_business: {
        type: String,
        trim: true,
        maxlength: 200
    },
    annual_turnover: {
        type: Number,
        min: 0
    },
    employees_count: {
        type: Number,
        min: 0
    },
    accounting_period: {
        start: { type: Date },
        end: { type: Date }
    },
    financial_year: {
        type: String,
        trim: true
    },
    
    // Service Information
    services_availed: [serviceSchema],
    
    // Fee and Payment
    fee_structure: {
        type: String,
        enum: ['Monthly Retainer', 'Per Service', 'Annual Contract'],
        default: 'Per Service'
    },
    payment_terms: {
        type: String,
        trim: true,
        maxlength: 200
    },
    credit_limit: {
        type: Number,
        min: 0,
        default: 0
    },
    
    // Relationship Management
    assigned_manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    assigned_executive: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    client_since: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Prospect', 'Suspended'],
        default: 'Active'
    },
    risk_category: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    },
    satisfaction_rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    },
    
    // Compliance and Deadlines
    compliance_calendar: [complianceSchema],
    
    // Documents and Attachments
    documents: [documentSchema],
    
    // Authorized Signatories
    authorized_signatories: [signatorySchema],
    
    // Banking Information
    bank_details: [bankDetailSchema],
    
    // Audit Fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
clientSchema.index({ name: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ phone: 1 });
clientSchema.index({ pan: 1 });
clientSchema.index({ gstin: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ assigned_manager: 1 });
clientSchema.index({ assigned_executive: 1 });
clientSchema.index({ client_since: 1 });
clientSchema.index({ risk_category: 1 });

// Virtual for client age
clientSchema.virtual('clientAge').get(function() {
    const now = new Date();
    const created = this.client_since;
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Virtual for active services count
clientSchema.virtual('activeServicesCount').get(function() {
    return this.services_availed.filter(service => service.status === 'Active').length;
});

// Virtual for upcoming compliance
clientSchema.virtual('upcomingCompliance').get(function() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    return this.compliance_calendar.filter(compliance => {
        const dueDate = new Date(compliance.due_date);
        return dueDate > now && dueDate <= thirtyDaysFromNow && compliance.status === 'Pending';
    });
});

// Pre-save middleware
clientSchema.pre('save', function(next) {
    // Set financial year if not provided
    if (!this.financial_year && this.accounting_period && this.accounting_period.start) {
        const startYear = this.accounting_period.start.getFullYear();
        const endYear = this.accounting_period.end.getFullYear();
        this.financial_year = `${startYear}-${endYear}`;
    }
    
    next();
});

// Instance method to get client summary
clientSchema.methods.getSummary = function() {
    return {
        id: this._id,
        name: this.name,
        type: this.type,
        email: this.email,
        phone: this.phone,
        status: this.status,
        risk_category: this.risk_category,
        satisfaction_rating: this.satisfaction_rating,
        client_since: this.client_since,
        active_services: this.activeServicesCount,
        upcoming_compliance: this.upcomingCompliance.length
    };
};

// Instance method to add service
clientSchema.methods.addService = function(serviceData) {
    this.services_availed.push(serviceData);
    return this.save();
};

// Instance method to update service
clientSchema.methods.updateService = function(serviceId, serviceData) {
    const service = this.services_availed.id(serviceId);
    if (service) {
        Object.assign(service, serviceData);
        return this.save();
    }
    throw new Error('Service not found');
};

// Instance method to remove service
clientSchema.methods.removeService = function(serviceId) {
    this.services_availed.pull(serviceId);
    return this.save();
};

// Instance method to add compliance
clientSchema.methods.addCompliance = function(complianceData) {
    this.compliance_calendar.push(complianceData);
    return this.save();
};

// Instance method to update compliance
clientSchema.methods.updateCompliance = function(complianceId, complianceData) {
    const compliance = this.compliance_calendar.id(complianceId);
    if (compliance) {
        Object.assign(compliance, complianceData);
        return this.save();
    }
    throw new Error('Compliance not found');
};

// Instance method to add document
clientSchema.methods.addDocument = function(documentData) {
    this.documents.push(documentData);
    return this.save();
};

// Instance method to remove document
clientSchema.methods.removeDocument = function(documentId) {
    this.documents.pull(documentId);
    return this.save();
};

// Static method to get client statistics
clientSchema.statics.getClientStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                    $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
                },
                inactive: {
                    $sum: { $cond: [{ $eq: ['$status', 'Inactive'] }, 1, 0] }
                },
                prospects: {
                    $sum: { $cond: [{ $eq: ['$status', 'Prospect'] }, 1, 0] }
                },
                suspended: {
                    $sum: { $cond: [{ $eq: ['$status', 'Suspended'] }, 1, 0] }
                },
                avgSatisfaction: { $avg: '$satisfaction_rating' }
            }
        }
    ]);
    
    return stats[0] || {
        total: 0,
        active: 0,
        inactive: 0,
        prospects: 0,
        suspended: 0,
        avgSatisfaction: 0
    };
};

// Static method to get clients by type
clientSchema.statics.getClientsByType = async function() {
    return this.aggregate([
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

// Static method to get clients by risk category
clientSchema.statics.getClientsByRisk = async function() {
    return this.aggregate([
        {
            $group: {
                _id: '$risk_category',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

// Static method to search clients
clientSchema.statics.searchClients = async function(query, options = {}) {
    const {
        page = 1,
        limit = 10,
        sortBy = 'name',
        sortOrder = 'asc',
        status = null,
        type = null,
        risk_category = null
    } = options;
    
    const searchQuery = {
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { phone: { $regex: query, $options: 'i' } },
            { pan: { $regex: query, $options: 'i' } },
            { gstin: { $regex: query, $options: 'i' } }
        ]
    };
    
    // Add filters
    if (status) searchQuery.status = status;
    if (type) searchQuery.type = type;
    if (risk_category) searchQuery.risk_category = risk_category;
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const clients = await this.find(searchQuery)
        .populate('assigned_manager', 'fullName email')
        .populate('assigned_executive', 'fullName email')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);
    
    const total = await this.countDocuments(searchQuery);
    
    return {
        clients,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

module.exports = mongoose.model('Client', clientSchema);