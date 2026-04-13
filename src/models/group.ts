import mongoose, { Schema, Types } from "mongoose";

const GroupSchema = new Schema(
  {
    tournamentId: {
      type: Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    teamIds: {
      type: [Types.ObjectId],
      ref: "Team",
      required: true,
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Group =
  mongoose.models.Group || mongoose.model("Group", GroupSchema);
