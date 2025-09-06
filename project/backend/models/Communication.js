import mongoose from 'mongoose';

const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    file_name: String,
    file_url: String,
    file_type: String,
    file_size: Number,
  },
  { _id: false }
);

const communicationSchema = new Schema(
  {
    date: { type: Date, required: true },
    time: String,
    type: { type: String, enum: ['Incoming', 'Outgoing'], required: true },
    channel: {
      type: String,
      enum: ['Email', 'Phone', 'WhatsApp', 'SMS', 'Video Call', 'In-Person', 'Letter', 'Fax'],
      required: true,
    },

    client_id: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    client_name: String,
    staff_id: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    staff_name: String,

    subject: String,
    service_category: String,
    assignment_reference: String,
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], default: 'Pending' },

    summary: String,
    detailed_notes: String,
    action_items: [String],

    follow_up_required: { type: Boolean, default: false },
    follow_up_date: Date,
    follow_up_notes: String,
    follow_up_assigned_to: String,
    follow_up_completed: { type: Boolean, default: false },

    attachments: [attachmentSchema],
    related_documents: [String],

    duration_minutes: Number,
    response_time_hours: Number,
    satisfaction_rating: { type: Number, min: 1, max: 5 },

    template_used: String,
    auto_generated: { type: Boolean, default: false },
    campaign_id: String,

    created_by: String,
    updated_by: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

communicationSchema.index({ date: -1 });
communicationSchema.index({ client_id: 1, date: -1 });

const Communication =
  mongoose.models.Communication || mongoose.model('Communication', communicationSchema);
export default Communication;

