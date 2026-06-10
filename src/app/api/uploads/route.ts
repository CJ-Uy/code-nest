import { NextResponse } from "next/server";
import { createObjectKey } from "@/lib/ids";
import { getStorageAdapter } from "@/storage";

export async function POST(request: Request) {
	const storage = getStorageAdapter();
	const contentType = request.headers.get("content-type") ?? undefined;

	if (contentType?.includes("multipart/form-data")) {
		const form = await request.formData();
		const file = form.get("file");
		if (!(file instanceof File)) {
			return NextResponse.json({ error: "Expected multipart field named file." }, { status: 400 });
		}

		const key = String(form.get("key") ?? createObjectKey(file.name));
		const result = await storage.putObject({
			key,
			body: file,
			contentType: file.type || undefined,
		});
		return NextResponse.json(result, { status: 201 });
	}

	const key = request.headers.get("x-object-key") ?? createObjectKey();
	const result = await storage.putObject({
		key,
		body: await request.arrayBuffer(),
		contentType,
	});

	return NextResponse.json(result, { status: 201 });
}
