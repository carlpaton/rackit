import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth: session }) {
      return !!session?.user;
    },
    async jwt({ token, user }) {
      if (user) {
        token.displayName =
          user.displayName ?? token.email?.split("@")[0] ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.displayName = token.displayName as string | undefined;
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase(),
        });
        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          displayName: user.displayName,
        };
      },
    }),
  ],
});
