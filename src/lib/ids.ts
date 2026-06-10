export function createId(prefix: string): string {
	const random = crypto.randomUUID().replaceAll("-", "").slice(0, 24);
	return `${prefix}_${random}`;
}

export function createObjectKey(filename?: string): string {
	const safeName = filename?.trim().replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
	const suffix = safeName ? `-${safeName}` : "";
	return `uploads/${new Date().toISOString().slice(0, 10)}/${createId("obj")}${suffix}`;
}
