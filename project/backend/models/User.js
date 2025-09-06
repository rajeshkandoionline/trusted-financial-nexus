import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

export const USER_ROLES = ['Admin', 'Manager', 'Executive', 'Staff', 'Client'];

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: USER_ROLES, required: true },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date },
    profile: {
      fullName: String,
      phone: String,
      avatarUrl: String,
      staffId: { type: Schema.Types.ObjectId, ref: 'Staff' },
      clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

userSchema.pre('save', async function handlePasswordHash(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

