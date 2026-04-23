import mongoose, { Schema, Model } from "mongoose";

export interface IMatch {
  _id: mongoose.Types.ObjectId;
  tournamentId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId | null;
  teamAId?: mongoose.Types.ObjectId | null;
  teamBId?: mongoose.Types.ObjectId | null;
  winnerId?: mongoose.Types.ObjectId | null;
  phase: "group" | "knockout";
  round?: "QF" | "SF" | "Final" | null;
  bracketOrder?: number | null;
  delegatedTeamIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    teamAId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    teamBId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    winnerId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    phase: { type: String, enum: ["group", "knockout"], required: true },
    round: {
      type: String,
      enum: ["QF", "SF", "Final", null],
      default: null,
    },
    bracketOrder: { type: Number, default: null },
    delegatedTeamIds: [{ type: Schema.Types.ObjectId, ref: "Team" }],
  },
  { timestamps: true }
);

const Match: Model<IMatch> =
  mongoose.models.Match ?? mongoose.model<IMatch>("Match", MatchSchema);

export default Match;
