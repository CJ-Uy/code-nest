"use client";

import { useState } from "react";
import type { QrStyle } from "@/db/repositories/links";
import { StyledLinkQr, ORG_QR_STYLE } from "./styled-link-qr";

export function LinkQrCustomizer({ url, style, editable = true, linkId, onSave }: { url: string; style?: QrStyle; editable?: boolean; linkId?: string; onSave?(style: QrStyle): void }) {
	const [draft, setDraft] = useState<QrStyle>(style ?? ORG_QR_STYLE);

	// Reuse the link_preview upload path — those objects live in the public `links/`
	// namespace, so the returned key is loadable as a same-origin image for the QR logo.
	async function uploadLogo(file: File): Promise<string | null> {
		if (!linkId) return null;
		const body = new FormData();
		body.set("purpose", "link_preview");
		body.set("linkId", linkId);
		body.set("file", file);
		const response = await fetch("/api/uploads", { method: "POST", credentials: "same-origin", body });
		const result = await response.json() as { key?: string; error?: string };
		if (!response.ok || !result.key) return null;
		return `/api/uploads/${result.key}`;
	}

	return <StyledLinkQr url={url} style={draft} editable={editable} onChange={setDraft} onUploadLogo={linkId ? uploadLogo : undefined} onSave={onSave ? () => onSave(draft) : undefined} />;
}
