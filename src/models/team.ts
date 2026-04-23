import mongoose, { Schema, Model } from "mongoose";

export interface ITeam {
  _id: mongoose.Types.ObjectId;
  tournamentId: mongoose.Types.ObjectId;
  status: "open" | "full";
  name?: string | null;
  userIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    status: { type: String, enum: ["open", "full"], default: "open" },
    name: { type: String, default: null, maxlength: 50 },
    userIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Team: Model<ITeam> =
  mongoose.models.Team ?? mongoose.model<ITeam>("Team", TeamSchema);

export default Team;
