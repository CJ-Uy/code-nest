import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/db/client";
import { accounts, memberRoles, members, roles, sessions, termMemberRoster, verificationToken } from "@/db/schema";
import { createAuditRepository } from "@/db/repositories/audit";
import { getAppConfig } from "@/server/env";
import { isGoogleSignInAllowed, splitAuthList } from "@/server/auth/access";
import { grantBootstrapSuperRole } from "@/server/auth/bootstrap";
import { roleKeys, type RoleKey } from "@/server/auth/permissions";
import { isRosterSignInAllowed } from "@/server/auth/roster";

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
	const config = getAppConfig();
	const db = getDb();
	const allowedDomains = splitAuthList(config.AUTH_ALLOWED_DOMAINS);

	const baseAdapter = DrizzleAdapter(db, {
		usersTable: members,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationToken,
	});

	// The roster gate (src/server/auth/roster.ts) looks members up by a
	// lowercased email. Google's OIDC email claim is normally already
	// lowercase, but nothing guarantees that, so normalize here too —
	// otherwise a mixed-case claim would create a member row the gate
	// can never find, silently breaking the super-admin bypass and the
	// off-roster deactivation.
	const adapter: typeof baseAdapter = {
		...baseAdapter,
		createUser: (data) => baseAdapter.createUser!({ ...data, email: data.email.toLowerCase() }),
		getUserByEmail: (email) => baseAdapter.getUserByEmail!(email.toLowerCase()),
	};

	return {
		adapter,
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
					{ allowedDomains, bootstrapEmail: config.AUTH_BOOTSTRAP_SUPER_ADMIN_EMAIL },
				);
				if (!allowed) return false;
				if (!profile?.email) return false;

				return isRosterSignInAllowed(db, profile.email, new Date(), config.AUTH_BOOTSTRAP_SUPER_ADMIN_EMAIL);
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
				if (user.email) {
					await grantBootstrapSuperRole(db, user.id, user.email, config.AUTH_BOOTSTRAP_SUPER_ADMIN_EMAIL);
				}
				await db.update(members).set({ status: "active", updatedAt: new Date() }).where(eq(members.id, user.id));
				// admins can add a roster row by email before the member ever signs in;
				// backfill the link now so reporting joins find this member.
				if (user.email) {
					await db
						.update(termMemberRoster)
						.set({ memberId: user.id })
						.where(eq(termMemberRoster.email, user.email.toLowerCase()));
				}
				await createAuditRepository(db as unknown as Parameters<typeof createAuditRepository>[0]).record(
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
