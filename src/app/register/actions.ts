"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";

export type RegisterState = { error?: string } | null;

export async function register(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  await connectDB();

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ email, passwordHash });
  } catch {
    // Duplicate key error (code 11000) or any other DB error —
    // return a generic message that doesn't reveal whether the email exists
    return { error: "Registration failed — please try again." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Registration failed — please try again." };
    }
    throw error; // re-throw Next.js redirect
  }

  return null;
}
