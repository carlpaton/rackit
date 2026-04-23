import mongoose, { Schema, Model } from "mongoose";

export interface IGroup {
  _id: mongoose.Types.ObjectId;
  tournamentId: mongoose.Types.ObjectId;
  name: string;
  teamIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    teamIds: [{ type: Schema.Types.ObjectId, ref: "Team" }],
  },
  { timestamps: true }
);

const Group: Model<IGroup> =
  mongoose.models.Group ?? mongoose.model<IGroup>("Group", GroupSchema);

export default Group;
