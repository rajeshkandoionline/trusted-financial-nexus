import mongoose from 'mongoose';

const { Schema } = mongoose;

const checklistItemSchema = new Schema(
  {
    title: String,
    completed: { type: Boolean, default: false },
    completed_at: Date,
  },
  { _id: false }
);

const timeLogSchema = new Schema(
  {
    staff_id: { type: Schema.Types.ObjectId, ref: 'Staff' },
    start_time: Date,
    end_time: Date,
    duration_minutes: Number,
    note: String,
  },
  { _id: false }
);

const taskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    client_id: { type: Schema.Types.ObjectId, ref: 'Client' },
    assigned_to: { type: Schema.Types.ObjectId, ref: 'Staff' },
    created_by: { type: Schema.Types.ObjectId, ref: 'Staff' },
    status: { type: String, enum: ['Open', 'In Progress', 'Blocked', 'Completed', 'Cancelled'], default: 'Open' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    due_date: Date,
    start_date: Date,
    completed_at: Date,
    tags: [String],
    checklist: [checklistItemSchema],
    time_logs: [timeLogSchema],
    dependencies: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    project: String,
    service_category: String,
  },
  { timestamps: true }
);

taskSchema.index({ status: 1, due_date: 1 });
taskSchema.index({ client_id: 1, assigned_to: 1 });

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
export default Task;

