// src/types/next-auth.d.ts
import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
    } & DefaultSession["user"];
    access?: string;
    refresh?: "present" | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    access?: string;
    refresh?: string;
    user?: {
      id: string;
      username: string;
      email: string;
      role: string;
    };
  }
}
