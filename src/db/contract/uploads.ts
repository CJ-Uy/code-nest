import { z } from "zod";
import { operation } from "./common";

export const uploadsContract = {
	put: operation({
		input: z.object({
			purpose: z.enum(["avatar", "event_media"]),
			contentType: z.string(),
			size: z.number().int().positive(),
		}),
		output: z.object({ key: z.string(), url: z.string().nullable() }),
		auth: "member",
		sharedDev: "allow",
	}),
};
