import type { StorageBody } from "./types";

export async function bodyToArrayBuffer(body: StorageBody): Promise<ArrayBuffer> {
	if (typeof body === "string") return new TextEncoder().encode(body).buffer;
	if (body instanceof ArrayBuffer) return body;
	if (body instanceof Blob) return body.arrayBuffer();
	return new Response(body).arrayBuffer();
}

export function arrayBufferToStream(buffer: ArrayBuffer): ReadableStream {
	return new Response(buffer).body ?? new ReadableStream();
}
