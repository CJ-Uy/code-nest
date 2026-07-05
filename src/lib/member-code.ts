const PREFIX = "code:m:";

export function encodeMemberCode(memberId: string): string {
	return `${PREFIX}${memberId}`;
}

export function decodeMemberCode(payload: string): string | null {
	if (!payload.startsWith(PREFIX)) return null;
	const memberId = payload.slice(PREFIX.length).trim();
	if (!/^mem_[A-Za-z0-9]+$/.test(memberId)) return null;
	return memberId;
}
