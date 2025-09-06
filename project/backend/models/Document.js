import mongoose from 'mongoose';

const { Schema } = mongoose;

const versionSchema = new Schema(
  {
    version: { type: Number, required: true },
    file_url: String,
    note: String,
    uploaded_by: { type: Schema.Types.ObjectId, ref: 'Staff' },
    uploaded_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentSchema = new Schema(
  {
    name: { type: String, required: true },
    type: String,
    client_id: { type: Schema.Types.ObjectId, ref: 'Client' },
    owner_type: { type: String, enum: ['Client', 'Staff', 'Firm'], default: 'Client' },
    folder: String,
    current_url: String,
    versions: [versionSchema],
    expiry_date: Date,
    ocr_text: String,
    tags: [String],
    access: {
      visibility: { type: String, enum: ['private', 'role', 'public'], default: 'private' },
      roles: [String],
      staff_ids: [{ type: Schema.Types.ObjectId, ref: 'Staff' }],
    },
  },
  { timestamps: true }
);

documentSchema.index({ client_id: 1, name: 1 });

const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
export default Document;

