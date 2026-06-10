import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/storage";

type UploadRouteContext = {
	params: Promise<{ key: string }>;
};

export async function GET(_request: Request, context: UploadRouteContext) {
	const { key } = await context.params;
	const storage = getStorageAdapter();
	const object = await storage.getObject(decodeURIComponent(key));

	if (!object.body) {
		return NextResponse.json({ error: "Object not found." }, { status: 404 });
	}

	return new Response(object.body, {
		headers: {
			"Content-Type": object.contentType ?? "application/octet-stream",
		},
	});
}

export async function DELETE(_request: Request, context: UploadRouteContext) {
	const { key } = await context.params;
	const storage = getStorageAdapter();
	await storage.deleteObject(decodeURIComponent(key));
	return new Response(null, { status: 204 });
}
