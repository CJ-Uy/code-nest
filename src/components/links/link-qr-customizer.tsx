"use client";

import { useState } from "react";
import type { QrStyle } from "@/db/repositories/links";
import { StyledLinkQr, ORG_QR_STYLE } from "./styled-link-qr";

export function LinkQrCustomizer({ url, style, editable = true, onSave }: { url: string; style?: QrStyle; editable?: boolean; onSave?(style: QrStyle): void }) {
	const [draft, setDraft] = useState<QrStyle>(style ?? ORG_QR_STYLE);
	return <StyledLinkQr url={url} style={draft} editable={editable} onChange={setDraft} onSave={onSave ? () => onSave(draft) : undefined} />;
}
