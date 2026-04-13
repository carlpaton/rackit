import mongoose, { Schema, Types } from "mongoose";

const MatchSchema = new Schema(
  {
    tournamentId: {
      type: Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    groupId: {
      type: Types.ObjectId,
      ref: "Group",
      default: null,
    },
    teamAId: {
      type: Types.ObjectId,
      ref: "Team",
      required: true,
    },
    teamBId: {
      type: Types.ObjectId,
      ref: "Team",
      default: null,
    },
    winnerId: {
      type: Types.ObjectId,
      ref: "Team",
      default: null,
    },
    phase: {
      type: String,
      enum: ["group", "knockout"],
      required: true,
    },
    round: {
      type: String,
      enum: ["QF", "SF", "Final", null],
      default: null,
    },
    delegatedToTeamIds: {
      type: [Types.ObjectId],
      ref: "Team",
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Match =
  mongoose.models.Match || mongoose.model("Match", MatchSchema);
