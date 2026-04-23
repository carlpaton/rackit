import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  emailVerified?: Date | null;
  name?: string | null;
  image?: string | null;
  passwordHash?: string | null;
  displayName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Date, default: null },
    name: { type: String, default: null },
    image: { type: String, default: null },
    passwordHash: { type: String, default: null },
    displayName: { type: String, default: null },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
