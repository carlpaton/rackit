import mongoose, { Schema, Model } from "mongoose";

export interface IQuickGame {
  _id: mongoose.Types.ObjectId;
  joinCode: string;
  creatorId: mongoose.Types.ObjectId;
  opponentId?: mongoose.Types.ObjectId | null;
  winnerId?: mongoose.Types.ObjectId | null;
  status: "waiting" | "active" | "complete";
  createdAt: Date;
  updatedAt: Date;
}

const QuickGameSchema = new Schema<IQuickGame>(
  {
    joinCode: { type: String, required: true, unique: true },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    opponentId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    winnerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["waiting", "active", "complete"],
      default: "waiting",
    },
  },
  { timestamps: true }
);

const QuickGame: Model<IQuickGame> =
  mongoose.models.QuickGame ??
  mongoose.model<IQuickGame>("QuickGame", QuickGameSchema);

export default QuickGame;
