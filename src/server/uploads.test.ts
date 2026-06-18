import { describe, expect, it } from "vitest";
import type { Actor } from "@/server/auth/permissions";
import type { StorageAdapter, StorageBody } from "@/storage/types";
import { createUploadHandlers, MAX_UPLOAD_BYTES } from "./uploads";

const memberActor: Actor = { memberId: "mem_upload", roles: ["member"] };

describe("upload handlers", () => {
	it("requires authentication for uploads", async () => {
		const handlers = createHandlers(null);
		const response = await handlers.collection(new Request("https://example.com/api/uploads", { method: "POST" }));
		expect(response.status).toBe(401);
	});

	it.each(["x-object-key", "X-Object-Key"])("rejects a caller-supplied %s", async (header) => {
		const handlers = createHandlers(memberActor);
		const response = await handlers.collection(
			new Request("https://example.com/api/uploads", {
				method: "POST",
				headers: { [header]: "avatars/another-member/forced.png" },
			}),
		);
		expect(response.status).toBe(400);
	});

	it("rejects a multipart key field", async () => {
		const handlers = createHandlers(memberActor);
		const form = imageForm();
		form.set("key", "avatars/another-member/forced.png");
		const response = await handlers.collection(
			new Request("https://example.com/api/uploads", { method: "POST", body: form }),
		);
		expect(response.status).toBe(400);
	});

	it("rejects unsupported content types and oversized images", async () => {
		const handlers = createHandlers(memberActor);
		const textForm = new FormData();
		textForm.set("purpose", "avatar");
		textForm.set("file", new File(["hello"], "note.txt", { type: "text/plain" }));
		const textResponse = await handlers.collection(
			new Request("https://example.com/api/uploads", { method: "POST", body: textForm }),
		);

		const largeForm = new FormData();
		largeForm.set("purpose", "avatar");
		largeForm.set("file", new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "large.png", { type: "image/png" }));
		const largeResponse = await handlers.collection(
			new Request("https://example.com/api/uploads", { method: "POST", body: largeForm }),
		);

		expect(textResponse.status).toBe(415);
		expect(largeResponse.status).toBe(413);
	});

	it("assigns an avatar key in the authenticated member namespace", async () => {
		const storage = new MemoryStorage();
		const handlers = createHandlers(memberActor, storage);
		const response = await handlers.collection(
			new Request("https://example.com/api/uploads", { method: "POST", body: imageForm() }),
		);
		const body = await response.json() as { key: string };

		expect(response.status).toBe(201);
		expect(body.key).toMatch(/^avatars\/mem_upload\/[a-z0-9_-]+\.png$/);
		expect(storage.keys()).toEqual([body.key]);
	});

	it("requires authentication for reads and deletes", async () => {
		const handlers = createHandlers(null);
		const getResponse = await handlers.object(
			new Request("https://example.com/api/uploads/key"),
			"avatars/mem_upload/avatar.png",
		);
		const deleteResponse = await handlers.object(
			new Request("https://example.com/api/uploads/key", { method: "DELETE" }),
			"avatars/mem_upload/avatar.png",
		);

		expect(getResponse.status).toBe(401);
		expect(deleteResponse.status).toBe(401);
	});

	it("allows member reads but only owner or admin deletes", async () => {
		const storage = new MemoryStorage();
		await storage.putObject({ key: "avatars/other/avatar.png", body: "image", contentType: "image/png" });
		const handlers = createHandlers(memberActor, storage);

		const getResponse = await handlers.object(
			new Request("https://example.com/api/uploads/key"),
			"avatars/other/avatar.png",
		);
		const deleteResponse = await handlers.object(
			new Request("https://example.com/api/uploads/key", { method: "DELETE" }),
			"avatars/other/avatar.png",
		);

		expect(getResponse.status).toBe(200);
		expect(deleteResponse.status).toBe(403);
	});
});

function imageForm(): FormData {
	const form = new FormData();
	form.set("purpose", "avatar");
	form.set("file", new File(["image"], "avatar.png", { type: "image/png" }));
	return form;
}

function createHandlers(actor: Actor | null, storage = new MemoryStorage()) {
	return createUploadHandlers({
		getActor: async () => actor,
		storage,
		canPostEvent: async () => true,
	});
}

class MemoryStorage implements StorageAdapter {
	readonly adapterType = "local-fs" as const;
	private readonly objects = new Map<string, { body: StorageBody; contentType?: string }>();

	async putObject(input: { key: string; body: StorageBody; contentType?: string }) {
		this.objects.set(input.key, { body: input.body, contentType: input.contentType });
		return { key: input.key };
	}

	async getObject(key: string) {
		const object = this.objects.get(key);
		return object ? { body: object.body as ReadableStream, contentType: object.contentType } : { body: null };
	}

	async deleteObject(key: string) {
		this.objects.delete(key);
	}

	keys() {
		return [...this.objects.keys()];
	}
}
