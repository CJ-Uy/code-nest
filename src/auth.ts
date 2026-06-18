import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/db/client";
import { accounts, memberRoles, members, roles, sessions, verificationToken } from "@/db/schema";
import { createAuditRepository } from "@/db/repositories/audit";
import { getAppConfig } from "@/server/env";
import { isGoogleSignInAllowed, splitAuthList } from "@/server/auth/access";
import { roleKeys, type RoleKey } from "@/server/auth/permissions";
import { isRosterSignInAllowed } from "@/server/auth/roster";

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
	const config = getAppConfig();
	const db = getDb();
	const allowedDomains = splitAuthList(config.AUTH_ALLOWED_DOMAINS);

	return {
		adapter: DrizzleAdapter(db, {
			usersTable: members,
			accountsTable: accounts,
			sessionsTable: sessions,
			verificationTokensTable: verificationToken,
		}),
		providers: [
			Google({
				clientId: config.AUTH_GOOGLE_ID,
				clientSecret: config.AUTH_GOOGLE_SECRET,
				authorization: allowedDomains[0] ? { params: { hd: allowedDomains[0] } } : undefined,
			}),
		],
		session: { strategy: "database" },
		secret: config.AUTH_SECRET,
		trustHost: true,
		callbacks: {
			async signIn({ account, profile }) {
				const allowed = isGoogleSignInAllowed(
					{
						provider: account?.provider,
						email: profile?.email,
						emailVerified: profile?.email_verified === true,
					},
					{
						allowedDomains,
						allowlistEmails: splitAuthList(config.AUTH_ALLOWLIST_EMAILS),
					},
				);
				if (!allowed) return false;
				if (!profile?.email) return false;

				return isRosterSignInAllowed(db, profile.email);
			},
			async session({ session, user }) {
				const [member] = await db.select().from(members).where(eq(members.id, user.id)).limit(1);
				if (!member) return session;

				const elevated = await db
					.select()
					.from(memberRoles)
					.innerJoin(roles, eq(roles.id, memberRoles.roleId))
					.where(eq(memberRoles.memberId, user.id));

				session.user.id = user.id;
				session.user.status = member.status;
				session.user.roles = [
					"member",
					...elevated
						.map((item) => item.roles.key)
						.filter((role): role is RoleKey => roleKeys.includes(role as RoleKey) && role !== "member"),
				];
				return session;
			},
		},
		events: {
			async createUser({ user }) {
				if (!user.id) return;
				await db.update(members).set({ status: "active", updatedAt: new Date() }).where(eq(members.id, user.id));
				await createAuditRepository(db).record(
					{ memberId: user.id, roles: ["member"], context: "session" },
					{
						action: "member:self_provision",
						targetType: "member",
						targetId: user.id,
						category: "member",
					},
				);
			},
		},
	};
});
