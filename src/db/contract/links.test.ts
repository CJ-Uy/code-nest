import { describe, expect, it } from "vitest";
import { linksContract, updateLinkInputSchema } from "./links";

describe("linksContract", () => {
	it("marks read operations as shared-dev allowed and mutations as denied", () => {
		expect(linksContract.listOwn.sharedDev).toBe("allow");
		expect(linksContract.listAll.permission).toBe("link:moderate");
		expect(linksContract.create.sharedDev).toBe("deny");
		expect(linksContract.update.sharedDev).toBe("deny");
		expect(linksContract.remove.sharedDev).toBe("deny");
		expect(linksContract.stats.sharedDev).toBe("allow");
	});

	it("parses nullable preview fields on update", () => {
		const parsed = updateLinkInputSchema.parse({
			id: "lnk_1",
			previewTitle: null,
			previewDescription: "Short preview",
			previewImageKey: null,
		});
		expect(parsed).toMatchObject({ id: "lnk_1", previewTitle: null, previewImageKey: null });
	});
});
