"use client";

import { shortLinkUrl } from "./urls";
import { StyledLinkQr } from "./styled-link-qr";

export { shortLinkUrl };

export function LinkQr({ url }: { url: string }) {
	return <StyledLinkQr url={url} />;
}
