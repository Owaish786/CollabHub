import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { loginSchema } from "@/lib/validators";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const githubClientId = process.env.GITHUB_ID;
const githubClientSecret = process.env.GITHUB_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    ...(githubClientId && githubClientSecret
      ? [
          GitHub({
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validation = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
        });

        if (!validation.success) {
          throw new Error("Email and password are required");
        }

        const { email, password } = validation.data;

        await dbConnect();

        const user = await User.findOne({
          email: email.toLowerCase(),
        }).select("+hashedPassword");

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        await dbConnect();

        if (!user.email) {
          return false;
        }

        const normalizedEmail = user.email.toLowerCase();
        const update: {
          $setOnInsert: { email: string; name: string; authProvider: string; providerId: string };
          $set?: { image?: string };
        } = {
          $setOnInsert: {
            email: normalizedEmail,
            name: user.name || normalizedEmail.split("@")[0],
            authProvider: account.provider,
            providerId: account.providerAccountId,
          },
        };

        if (user.image) {
          update.$set = { image: user.image };
        }

        await User.findOneAndUpdate({ email: normalizedEmail }, update, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // First sign-in — attach MongoDB user ID
        await dbConnect();
        const dbUser = user.email
          ? await User.findOne({ email: user.email.toLowerCase() })
          : null;
        if (dbUser) {
          token.id = dbUser._id.toString();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.email && user.name) {
        // Send email notification asynchronously so it doesn't block login
        void import("@/lib/email").then(({ sendLoginNotificationEmail }) => {
          void sendLoginNotificationEmail({
            to: user.email as string,
            name: user.name as string,
          });
        });
      }
    },
  },
});
