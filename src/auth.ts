import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/db/client";
import { accounts, memberRoles, members, roles, sessions, verificationToken } from "@/db/schema";
import { getAppConfig } from "@/server/env";
import { roleKeys, type RoleKey } from "@/server/auth/permissions";

function required(value: string | undefined, name: string): string {
	if (!value) throw new Error(`${name} is required for Google sign-in.`);
	return value;
}

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
	const config = getAppConfig();
	const db = getDb();
	const baseAdapter = DrizzleAdapter(db, {
		usersTable: members,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationToken,
	} as never);
	const adapter: typeof baseAdapter = {
		...baseAdapter,
		createUser: (data) => baseAdapter.createUser!({ ...data, email: data.email.toLowerCase() }),
		getUserByEmail: (email) => baseAdapter.getUserByEmail!(email.toLowerCase()),
	};

	return {
		adapter,
		providers: [
			Google({
				clientId: required(config.AUTH_GOOGLE_ID, "AUTH_GOOGLE_ID"),
				clientSecret: required(config.AUTH_GOOGLE_SECRET, "AUTH_GOOGLE_SECRET"),
			}),
		],
		session: { strategy: "database" },
		secret: required(config.AUTH_SECRET, "AUTH_SECRET"),
		trustHost: true,
		callbacks: {
			async signIn({ account, profile }) {
				if (account?.provider !== "google" || profile?.email_verified !== true || !profile.email) return false;
				const [member] = await db.select().from(members).where(eq(members.email, profile.email.toLowerCase())).limit(1);
				return member?.status === "active";
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
	};
});
