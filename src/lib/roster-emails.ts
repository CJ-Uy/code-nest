import { z } from "zod";

const emailSchema = z.string().email();

export type ParsedEmailColumn = {
	valid: string[];
	invalid: string[];
	dedupedInput: number;
};

export function parseEmailColumn(raw: string): ParsedEmailColumn {
	const tokens = raw
		.split(/[\n,;\t]+/)
		.map((token) => token.trim().toLowerCase())
		.filter(Boolean);

	const validAll: string[] = [];
	const invalid: string[] = [];
	for (const token of tokens) {
		if (emailSchema.safeParse(token).success) validAll.push(token);
		else invalid.push(token);
	}

	const valid = [...new Set(validAll)];
	return { valid, invalid, dedupedInput: validAll.length - valid.length };
}
