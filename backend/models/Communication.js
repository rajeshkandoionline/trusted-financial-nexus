const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema({
    // Communication Details
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    time: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Incoming', 'Outgoing'],
        required: true
    },
    channel: {
        type: String,
        enum: ['Email', 'Phone', 'WhatsApp', 'SMS', 'Video Call', 'In-Person', 'Letter', 'Fax'],
        required: true
    },
    
    // Participants
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    client_name: {
        type: String,
        required: true
    },
    staff_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    staff_name: {
        type: String,
        required: true
    },
    
    // Content and Context
    subject: {
        type: String,
        trim: true,
        maxlength: 200
    },
    service_category: {
        type: String,
        trim: true,
        maxlength: 100
    },
    assignment_reference: {
        type: String,
        trim: true,
        maxlength: 100
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    
    // Communication Content
    summary: {
        type: String,
        trim: true,
        maxlength: 500
    },
    detailed_notes: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    action_items: [{
        type: String,
        trim: true,
        maxlength: 200
    }],
    
    // Follow-up Information
    follow_up_required: {
        type: Boolean,
        default: false
    },
    follow_up_date: {
        type: Date,
        default: null
    },
    follow_up_notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    follow_up_assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    follow_up_completed: {
        type: Boolean,
        default: false
    },
    
    // Attachments and References
    attachments: [{
        file_name: {
            type: String,
            required: true
        },
        file_url: {
            type: String,
            required: true
        },
        file_type: {
            type: String,
            required: true
        },
        file_size: {
            type: Number,
            required: true
        }
    }],
    related_documents: [{
        type: String,
        trim: true
    }],
    
    // Analytics and Tracking
    duration_minutes: {
        type: Number,
        min: 0,
        default: 0
    },
    response_time_hours: {
        type: Number,
        min: 0,
        default: 0
    },
    satisfaction_rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    
    // Templates and Automation
    template_used: {
        type: String,
        trim: true,
        maxlength: 100
    },
    auto_generated: {
        type: Boolean,
        default: false
    },
    campaign_id: {
        type: String,
        trim: true,
        maxlength: 100
    },
    
    // Timestamps and Audit
    created_by: {
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
communicationSchema.index({ client_id: 1 });
communicationSchema.index({ staff_id: 1 });
communicationSchema.index({ date: -1 });
communicationSchema.index({ type: 1 });
communicationSchema.index({ channel: 1 });
communicationSchema.index({ status: 1 });
communicationSchema.index({ priority: 1 });
communicationSchema.index({ follow_up_required: 1 });
communicationSchema.index({ follow_up_date: 1 });

// Virtual for communication age
communicationSchema.virtual('age').get(function() {
    const now = new Date();
    const created = this.date;
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Virtual for overdue follow-up
communicationSchema.virtual('isOverdue').get(function() {
    if (!this.follow_up_required || !this.follow_up_date) return false;
    return new Date() > this.follow_up_date && !this.follow_up_completed;
});

// Pre-save middleware
communicationSchema.pre('save', function(next) {
    // Set time if not provided
    if (!this.time) {
        const now = new Date();
        this.time = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    }
    
    next();
});

// Instance method to add attachment
communicationSchema.methods.addAttachment = function(attachmentData) {
    this.attachments.push(attachmentData);
    return this.save();
};

// Instance method to remove attachment
communicationSchema.methods.removeAttachment = function(attachmentId) {
    this.attachments.pull(attachmentId);
    return this.save();
};

// Instance method to add action item
communicationSchema.methods.addActionItem = function(actionItem) {
    this.action_items.push(actionItem);
    return this.save();
};

// Instance method to remove action item
communicationSchema.methods.removeActionItem = function(actionItem) {
    const index = this.action_items.indexOf(actionItem);
    if (index > -1) {
        this.action_items.splice(index, 1);
    }
    return this.save();
};

// Instance method to mark as completed
communicationSchema.methods.markCompleted = function(notes = '') {
    this.status = 'Completed';
    this.detailed_notes = this.detailed_notes + (notes ? `\n\nCompleted: ${notes}` : '');
    return this.save();
};

// Instance method to schedule follow-up
communicationSchema.methods.scheduleFollowUp = function(followUpDate, assignedTo = null, notes = '') {
    this.follow_up_required = true;
    this.follow_up_date = followUpDate;
    this.follow_up_assigned_to = assignedTo;
    this.follow_up_notes = notes;
    this.follow_up_completed = false;
    return this.save();
};

// Instance method to complete follow-up
communicationSchema.methods.completeFollowUp = function(notes = '') {
    this.follow_up_completed = true;
    this.follow_up_notes = this.follow_up_notes + (notes ? `\n\nFollow-up completed: ${notes}` : '');
    return this.save();
};

// Static method to get communication statistics
communicationSchema.statics.getCommunicationStats = async function(filters = {}) {
    const stats = await this.aggregate([
        { $match: filters },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                incoming: {
                    $sum: { $cond: [{ $eq: ['$type', 'Incoming'] }, 1, 0] }
                },
                outgoing: {
                    $sum: { $cond: [{ $eq: ['$type', 'Outgoing'] }, 1, 0] }
                },
                pending: {
                    $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
                },
                inProgress: {
                    $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
                },
                completed: {
                    $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
                },
                cancelled: {
                    $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
                },
                avgSatisfaction: { $avg: '$satisfaction_rating' },
                avgResponseTime: { $avg: '$response_time_hours' },
                avgDuration: { $avg: '$duration_minutes' }
            }
        }
    ]);
    
    return stats[0] || {
        total: 0,
        incoming: 0,
        outgoing: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        avgSatisfaction: 0,
        avgResponseTime: 0,
        avgDuration: 0
    };
};

// Static method to get communications by channel
communicationSchema.statics.getCommunicationsByChannel = async function(filters = {}) {
    return this.aggregate([
        { $match: filters },
        {
            $group: {
                _id: '$channel',
                count: { $sum: 1 },
                avgSatisfaction: { $avg: '$satisfaction_rating' },
                avgResponseTime: { $avg: '$response_time_hours' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

// Static method to get communications by priority
communicationSchema.statics.getCommunicationsByPriority = async function(filters = {}) {
    return this.aggregate([
        { $match: filters },
        {
            $group: {
                _id: '$priority',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

// Static method to get overdue follow-ups
communicationSchema.statics.getOverdueFollowUps = async function(filters = {}) {
    const now = new Date();
    return this.find({
        ...filters,
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: { $lt: now }
    })
    .populate('client_id', 'name email phone')
    .populate('staff_id', 'fullName email phone')
    .populate('follow_up_assigned_to', 'fullName email phone')
    .sort({ follow_up_date: 1 });
};

// Static method to get communication trends
communicationSchema.statics.getCommunicationTrends = async function(filters = {}, days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    return this.aggregate([
        {
            $match: {
                ...filters,
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                    day: { $dayOfMonth: '$date' }
                },
                count: { $sum: 1 },
                incoming: {
                    $sum: { $cond: [{ $eq: ['$type', 'Incoming'] }, 1, 0] }
                },
                outgoing: {
                    $sum: { $cond: [{ $eq: ['$type', 'Outgoing'] }, 1, 0] }
                },
                avgSatisfaction: { $avg: '$satisfaction_rating' }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]);
};

module.exports = mongoose.model('Communication', communicationSchema);