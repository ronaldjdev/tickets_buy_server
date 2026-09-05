import { type Document, model, Schema } from "mongoose";

import type { User } from "@/features/user/domain/entities/User.entity.js";

interface IUser extends Document, User {}

const UserSchema = new Schema<IUser>(
	{
		userId: {
			type: Schema.Types.ObjectId as unknown as typeof String,
			ref: "authUser",
			required: true,
			unique: true,
		},
		name: { type: String, required: true },
		role: { type: String, required: true, enum: ["admin", "vendedor"] },
		documentType: { type: String, required: true },
		documentNumber: { type: String, required: true },
		phone: { type: String, required: true },
		status: { type: String, required: true },
	},
	{ timestamps: true },
);

export default model<IUser>("User", UserSchema);
