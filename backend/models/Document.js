const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    type: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    category: {
        type: String,
        trim: true,
        maxlength: 100
    },
    
    // File Information
    file_name: {
        type: String,
        required: true,
        trim: true
    },
    file_url: {
        type: String,
        required: true
    },
    file_type: {
        type: String,
        required: true,
        trim: true
    },
    file_size: {
        type: Number,
        required: true,
        min: 0
    },
    mime_type: {
        type: String,
        required: true
    },
    
    // Client Association
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        default: null
    },
    
    // Metadata
    tags: [{
        type: String,
        trim: true,
        maxlength: 50
    }],
    version: {
        type: String,
        default: '1.0',
        trim: true
    },
    is_public: {
        type: Boolean,
        default: false
    },
    is_archived: {
        type: Boolean,
        default: false
    },
    
    // Access Control
    access_level: {
        type: String,
        enum: ['Public', 'Internal', 'Confidential', 'Restricted'],
        default: 'Internal'
    },
    allowed_users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Expiry and Retention
    expiry_date: {
        type: Date,
        default: null
    },
    retention_period: {
        type: Number, // in days
        default: null
    },
    
    // Digital Signature
    is_signed: {
        type: Boolean,
        default: false
    },
    signature_data: {
        signer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        signed_at: {
            type: Date,
            default: null
        },
        signature_hash: {
            type: String,
            default: null
        }
    },
    
    // Version Control
    parent_document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        default: null
    },
    version_history: [{
        version: String,
        file_url: String,
        uploaded_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploaded_at: {
            type: Date,
            default: Date.now
        },
        changes: String
    }],
    
    // Download and View Tracking
    download_count: {
        type: Number,
        default: 0
    },
    view_count: {
        type: Number,
        default: 0
    },
    last_accessed: {
        type: Date,
        default: null
    },
    
    // Audit Fields
    uploaded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updated_by: {
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
documentSchema.index({ name: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ client_id: 1 });
documentSchema.index({ uploaded_by: 1 });
documentSchema.index({ uploaded_at: -1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ is_archived: 1 });
documentSchema.index({ access_level: 1 });

// Virtual for file extension
documentSchema.virtual('fileExtension').get(function() {
    return this.file_name.split('.').pop().toLowerCase();
});

// Virtual for formatted file size
documentSchema.virtual('formattedFileSize').get(function() {
    const bytes = this.file_size;
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for document age
documentSchema.virtual('age').get(function() {
    const now = new Date();
    const uploaded = this.uploaded_at;
    const diffTime = Math.abs(now - uploaded);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Virtual for expiry status
documentSchema.virtual('isExpired').get(function() {
    if (!this.expiry_date) return false;
    return new Date() > this.expiry_date;
});

// Virtual for days until expiry
documentSchema.virtual('daysUntilExpiry').get(function() {
    if (!this.expiry_date) return null;
    const now = new Date();
    const expiry = this.expiry_date;
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Pre-save middleware
documentSchema.pre('save', function(next) {
    // Set MIME type if not provided
    if (!this.mime_type && this.file_type) {
        const mimeTypes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt': 'text/plain',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed'
        };
        
        this.mime_type = mimeTypes[this.file_type.toLowerCase()] || 'application/octet-stream';
    }
    
    next();
});

// Instance method to add tag
documentSchema.methods.addTag = function(tag) {
    if (!this.tags.includes(tag)) {
        this.tags.push(tag);
    }
    return this.save();
};

// Instance method to remove tag
documentSchema.methods.removeTag = function(tag) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
        this.tags.splice(index, 1);
    }
    return this.save();
};

// Instance method to add allowed user
documentSchema.methods.addAllowedUser = function(userId) {
    if (!this.allowed_users.includes(userId)) {
        this.allowed_users.push(userId);
    }
    return this.save();
};

// Instance method to remove allowed user
documentSchema.methods.removeAllowedUser = function(userId) {
    this.allowed_users.pull(userId);
    return this.save();
};

// Instance method to increment download count
documentSchema.methods.incrementDownloadCount = function() {
    this.download_count += 1;
    this.last_accessed = new Date();
    return this.save();
};

// Instance method to increment view count
documentSchema.methods.incrementViewCount = function() {
    this.view_count += 1;
    this.last_accessed = new Date();
    return this.save();
};

// Instance method to create new version
documentSchema.methods.createNewVersion = function(fileUrl, uploadedBy, changes = '') {
    const newVersion = {
        version: (parseFloat(this.version) + 0.1).toFixed(1),
        file_url: fileUrl,
        uploaded_by: uploadedBy,
        uploaded_at: new Date(),
        changes
    };
    
    this.version_history.push(newVersion);
    this.version = newVersion.version;
    this.file_url = fileUrl;
    this.updated_by = uploadedBy;
    
    return this.save();
};

// Instance method to sign document
documentSchema.methods.signDocument = function(signerId, signatureHash) {
    this.is_signed = true;
    this.signature_data = {
        signer: signerId,
        signed_at: new Date(),
        signature_hash: signatureHash
    };
    
    return this.save();
};

// Instance method to archive document
documentSchema.methods.archiveDocument = function() {
    this.is_archived = true;
    return this.save();
};

// Instance method to unarchive document
documentSchema.methods.unarchiveDocument = function() {
    this.is_archived = false;
    return this.save();
};

// Static method to get document statistics
documentSchema.statics.getDocumentStats = async function(filters = {}) {
    const stats = await this.aggregate([
        { $match: filters },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                totalSize: { $sum: '$file_size' },
                avgSize: { $avg: '$file_size' },
                totalDownloads: { $sum: '$download_count' },
                totalViews: { $sum: '$view_count' },
                signed: {
                    $sum: { $cond: ['$is_signed', 1, 0] }
                },
                archived: {
                    $sum: { $cond: ['$is_archived', 1, 0] }
                }
            }
        }
    ]);
    
    return stats[0] || {
        total: 0,
        totalSize: 0,
        avgSize: 0,
        totalDownloads: 0,
        totalViews: 0,
        signed: 0,
        archived: 0
    };
};

// Static method to get documents by type
documentSchema.statics.getDocumentsByType = async function(filters = {}) {
    return this.aggregate([
        { $match: filters },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                totalSize: { $sum: '$file_size' },
                avgSize: { $avg: '$file_size' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

// Static method to get documents by category
documentSchema.statics.getDocumentsByCategory = async function(filters = {}) {
    return this.aggregate([
        { $match: filters },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalSize: { $sum: '$file_size' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

// Static method to get expiring documents
documentSchema.statics.getExpiringDocuments = async function(filters = {}, days = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    return this.find({
        ...filters,
        expiry_date: { $gte: now, $lte: futureDate },
        is_archived: false
    })
    .populate('client_id', 'name email phone')
    .populate('uploaded_by', 'fullName email')
    .sort({ expiry_date: 1 });
};

// Static method to get expired documents
documentSchema.statics.getExpiredDocuments = async function(filters = {}) {
    const now = new Date();
    
    return this.find({
        ...filters,
        expiry_date: { $lt: now },
        is_archived: false
    })
    .populate('client_id', 'name email phone')
    .populate('uploaded_by', 'fullName email')
    .sort({ expiry_date: 1 });
};

// Static method to search documents
documentSchema.statics.searchDocuments = async function(query, options = {}) {
    const {
        page = 1,
        limit = 10,
        sortBy = 'uploaded_at',
        sortOrder = 'desc',
        type = null,
        category = null,
        client_id = null
    } = options;
    
    const searchQuery = {
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { tags: { $regex: query, $options: 'i' } }
        ]
    };
    
    // Add filters
    if (type) searchQuery.type = type;
    if (category) searchQuery.category = category;
    if (client_id) searchQuery.client_id = client_id;
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const documents = await this.find(searchQuery)
        .populate('client_id', 'name email phone')
        .populate('uploaded_by', 'fullName email')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);
    
    const total = await this.countDocuments(searchQuery);
    
    return {
        documents,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

module.exports = mongoose.model('Document', documentSchema);