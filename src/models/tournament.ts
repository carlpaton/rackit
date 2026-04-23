import mongoose, { Schema, Model } from "mongoose";

export interface ITournament {
  _id: mongoose.Types.ObjectId;
  name: string;
  mode: "singles" | "doubles";
  status: "open" | "in_progress" | "complete";
  path?: "group_stage" | "direct_knockout" | null;
  isPublic: boolean;
  joinCode: string;
  organizerUserId: mongoose.Types.ObjectId;
  winnerTeamId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentSchema = new Schema<ITournament>(
  {
    name: { type: String, required: true },
    mode: { type: String, enum: ["singles", "doubles"], required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "complete"],
      default: "open",
    },
    path: {
      type: String,
      enum: ["group_stage", "direct_knockout", null],
      default: null,
    },
    isPublic: { type: Boolean, default: true },
    joinCode: { type: String, required: true, unique: true },
    organizerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    winnerTeamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
  },
  { timestamps: true }
);

const Tournament: Model<ITournament> =
  mongoose.models.Tournament ??
  mongoose.model<ITournament>("Tournament", TournamentSchema);

export default Tournament;
