import mongoose, { Schema, Types } from "mongoose";

const TeamSchema = new Schema(
  {
    tournamentId: {
      type: Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    userIds: {
      type: [Types.ObjectId],
      ref: "User",
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: ["open", "full"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Team =
  mongoose.models.Team || mongoose.model("Team", TeamSchema);
