import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: { username: string, password: string }) {
        const user = await prisma.auth_user.findUnique({
          where: { username: credentials.username },
          include: { user: true },
        });

        if (user && bcrypt.compareSync(credentials.password, user.password)) {
          return { id: user.user.id, name: user.user.full_name, email: user.user.email };
        } else {
          return null;
        }
      }
    }),
  ],
  adapter: PrismaAdapter(prisma),
  secret: process.env.SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user = { ...session.user, id: token.id } as {
          name?: string | null;
          email?: string | null;
          image?: string | null;
          id?: string | null;
        };
      }
      return session;
    }
  },
});
