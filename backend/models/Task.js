const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    // Basic Information
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    
    // Assignment
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        default: null
    },
    
    // Task Details
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold'],
        default: 'Pending'
    },
    category: {
        type: String,
        trim: true,
        maxlength: 100
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: 50
    }],
    
    // Dates and Time
    due_date: {
        type: Date,
        required: true
    },
    start_date: {
        type: Date,
        default: null
    },
    completed_at: {
        type: Date,
        default: null
    },
    estimated_hours: {
        type: Number,
        min: 0,
        default: 0
    },
    actual_hours: {
        type: Number,
        min: 0,
        default: 0
    },
    
    // Progress and Notes
    progress_percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    notes: [{
        note: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },
        added_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        added_at: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Dependencies
    dependencies: [{
        task_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            required: true
        },
        dependency_type: {
            type: String,
            enum: ['blocks', 'blocked_by', 'related_to'],
            required: true
        }
    }],
    
    // Attachments
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
        },
        uploaded_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        uploaded_at: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Recurrence
    is_recurring: {
        type: Boolean,
        default: false
    },
    recurrence_pattern: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        default: null
    },
    recurrence_interval: {
        type: Number,
        min: 1,
        default: 1
    },
    recurrence_end_date: {
        type: Date,
        default: null
    },
    
    // Audit Fields
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
taskSchema.index({ assigned_to: 1 });
taskSchema.index({ client_id: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ due_date: 1 });
taskSchema.index({ created_by: 1 });
taskSchema.index({ category: 1 });
taskSchema.index({ tags: 1 });

// Virtual for task age
taskSchema.virtual('age').get(function() {
    const now = new Date();
    const created = this.createdAt;
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
    if (this.status === 'Completed' || this.status === 'Cancelled') return false;
    return new Date() > this.due_date;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
    const now = new Date();
    const due = this.due_date;
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Virtual for completion rate
taskSchema.virtual('completionRate').get(function() {
    if (this.estimated_hours === 0) return 0;
    return Math.round((this.actual_hours / this.estimated_hours) * 100);
});

// Pre-save middleware
taskSchema.pre('save', function(next) {
    // Set start date when status changes to In Progress
    if (this.isModified('status') && this.status === 'In Progress' && !this.start_date) {
        this.start_date = new Date();
    }
    
    // Set completed date when status changes to Completed
    if (this.isModified('status') && this.status === 'Completed' && !this.completed_at) {
        this.completed_at = new Date();
    }
    
    next();
});

// Instance method to add note
taskSchema.methods.addNote = function(note, userId) {
    this.notes.push({
        note,
        added_by: userId,
        added_at: new Date()
    });
    return this.save();
};

// Instance method to add attachment
taskSchema.methods.addAttachment = function(attachmentData) {
    this.attachments.push(attachmentData);
    return this.save();
};

// Instance method to remove attachment
taskSchema.methods.removeAttachment = function(attachmentId) {
    this.attachments.pull(attachmentId);
    return this.save();
};

// Instance method to add dependency
taskSchema.methods.addDependency = function(taskId, dependencyType) {
    this.dependencies.push({
        task_id: taskId,
        dependency_type: dependencyType
    });
    return this.save();
};

// Instance method to remove dependency
taskSchema.methods.removeDependency = function(taskId) {
    this.dependencies.pull({ task_id: taskId });
    return this.save();
};

// Instance method to update progress
taskSchema.methods.updateProgress = function(percentage, notes = '') {
    this.progress_percentage = Math.min(100, Math.max(0, percentage));
    
    if (notes) {
        this.addNote(`Progress updated to ${percentage}%: ${notes}`, this.updated_by);
    }
    
    return this.save();
};

// Instance method to mark as completed
taskSchema.methods.markCompleted = function(notes = '', actualHours = null) {
    this.status = 'Completed';
    this.progress_percentage = 100;
    this.completed_at = new Date();
    
    if (actualHours !== null) {
        this.actual_hours = actualHours;
    }
    
    if (notes) {
        this.addNote(`Task completed: ${notes}`, this.updated_by);
    }
    
    return this.save();
};

// Instance method to start task
taskSchema.methods.startTask = function(notes = '') {
    this.status = 'In Progress';
    this.start_date = new Date();
    
    if (notes) {
        this.addNote(`Task started: ${notes}`, this.updated_by);
    }
    
    return this.save();
};

// Instance method to pause task
taskSchema.methods.pauseTask = function(notes = '') {
    this.status = 'On Hold';
    
    if (notes) {
        this.addNote(`Task paused: ${notes}`, this.updated_by);
    }
    
    return this.save();
};

// Instance method to resume task
taskSchema.methods.resumeTask = function(notes = '') {
    this.status = 'In Progress';
    
    if (notes) {
        this.addNote(`Task resumed: ${notes}`, this.updated_by);
    }
    
    return this.save();
};

// Static method to get task statistics
taskSchema.statics.getTaskStats = async function(filters = {}) {
    const stats = await this.aggregate([
        { $match: filters },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
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
                onHold: {
                    $sum: { $cond: [{ $eq: ['$status', 'On Hold'] }, 1, 0] }
                },
                overdue: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $ne: ['$status', 'Completed'] },
                                    { $ne: ['$status', 'Cancelled'] },
                                    { $lt: ['$due_date', new Date()] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },
                totalEstimatedHours: { $sum: '$estimated_hours' },
                totalActualHours: { $sum: '$actual_hours' },
                avgProgress: { $avg: '$progress_percentage' }
            }
        }
    ]);
    
    return stats[0] || {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        onHold: 0,
        overdue: 0,
        totalEstimatedHours: 0,
        totalActualHours: 0,
        avgProgress: 0
    };
};

// Static method to get tasks by priority
taskSchema.statics.getTasksByPriority = async function(filters = {}) {
    return this.aggregate([
        { $match: filters },
        {
            $group: {
                _id: '$priority',
                count: { $sum: 1 },
                avgProgress: { $avg: '$progress_percentage' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

// Static method to get overdue tasks
taskSchema.statics.getOverdueTasks = async function(filters = {}) {
    const now = new Date();
    return this.find({
        ...filters,
        status: { $nin: ['Completed', 'Cancelled'] },
        due_date: { $lt: now }
    })
    .populate('assigned_to', 'fullName email phone')
    .populate('client_id', 'name email phone')
    .sort({ due_date: 1 });
};

// Static method to get upcoming tasks
taskSchema.statics.getUpcomingTasks = async function(filters = {}, days = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    return this.find({
        ...filters,
        status: { $nin: ['Completed', 'Cancelled'] },
        due_date: { $gte: now, $lte: futureDate }
    })
    .populate('assigned_to', 'fullName email phone')
    .populate('client_id', 'name email phone')
    .sort({ due_date: 1 });
};

// Static method to get task trends
taskSchema.statics.getTaskTrends = async function(filters = {}, days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    return this.aggregate([
        {
            $match: {
                ...filters,
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                count: { $sum: 1 },
                completed: {
                    $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
                },
                avgProgress: { $avg: '$progress_percentage' }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]);
};

module.exports = mongoose.model('Task', taskSchema);