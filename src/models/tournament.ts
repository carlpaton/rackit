import mongoose, { Schema, Types } from "mongoose";

const TournamentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mode: {
      type: String,
      enum: ["singles", "doubles"],
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "complete"],
      default: "open",
      required: true,
    },
    path: {
      type: String,
      enum: ["group-stage", "direct-knockout"],
      default: null,
    },
    organizerUserId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    winnerTeamId: {
      type: Types.ObjectId,
      ref: "Team",
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Tournament =
  mongoose.models.Tournament ||
  mongoose.model("Tournament", TournamentSchema);
