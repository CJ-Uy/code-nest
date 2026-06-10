export type StorageBody = ReadableStream | ArrayBuffer | Blob | string;

export interface StorageAdapter {
	readonly adapterType: "r2-binding" | "r2-s3" | "local-fs" | "shared-api";

	putObject(input: {
		key: string;
		body: StorageBody;
		contentType?: string;
	}): Promise<{ key: string }>;

	getObject(key: string): Promise<{
		body: ReadableStream | null;
		contentType?: string;
	}>;

	deleteObject(key: string): Promise<void>;
}
