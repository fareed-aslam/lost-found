import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/config/db";
import { users } from "@/lib/schema/userSchema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import GoogleProvider from "next-auth/providers/google";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials;
        if (!email || !password)
          throw new Error("Please enter email and password");

        // Find user in DB
        const userArr = await db
          .select()
          .from(users)
          .where(eq(users.email, email));
        const user = userArr[0];
        if (!user) throw new Error("Invalid email or password");

        // Compare password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw new Error("Invalid email or password");

        // Return user object for JWT
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          userName: user.userName,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, user }) {
      if (account.provider === "google") {
        // Check if user exists by email
        const userArr = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email));
        if (userArr.length === 0) {
          // Create user if not exists
          await db.insert(users).values({
            fullName: user.name || "",
            userName: user.email.split("@")[0],
            email: user.email,
            password: "", // No password for Google users
            phoneNumber: "",
            userType: "localUser",
          });
        }
        // Always allow sign in
        return true;
      }
      // For other providers, allow sign in
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.userName = user.userName;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;

        // Read latest profile fields from DB so session reflects DB updates
        try {
          const userArr = await db
            .select()
            .from(users)
            .where(eq(users.email, token.email));
          const dbUser = userArr && userArr[0];
          if (dbUser) {
            session.user.name = dbUser.fullName || token.name;
            session.user.userName = dbUser.userName || token.userName;
            session.user.image =
              dbUser.profile_image_url || session.user.image || null;
            session.user.phoneNumber = dbUser.phoneNumber || null;
          } else {
            session.user.name = token.name;
            session.user.userName = token.userName;
          }
        } catch (e) {
          // fallback to token values on error
          session.user.name = token.name;
          session.user.userName = token.userName;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour in seconds
  },

  pages: { signIn: "/auth/login", error: "/auth/login" },

  secret: process.env.NEXT_AUTH_SECRET,
};

export default authOptions;
