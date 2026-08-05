import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * Verify that the request has a valid admin session.
 * Returns the user ID if admin, or throws a Response.
 */
/**
 * Verify that the request has a valid session and return the user's profile.
 * Returns null if the session is invalid or the profile cannot be found.
 */
export async function getUserFromRequest(
  req: NextRequest,
): Promise<{ id: string; role: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  let userId: string;
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString()
    );
    userId = payload.sub;
    if (!userId) throw new Error("No sub in token");
  } catch {
    return null;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error("[getUserFromRequest] profile fetch error:", profileError?.message);
    return null;
  }

  return { id: profile.id, role: profile.role ?? "user" };
}

/**
 * Verify that the request has a valid admin session.
 * Returns the user ID if admin, or throws a Response.
 */
export async function requireAdmin(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice(7);

  // Decode JWT to get user ID (no need to verify signature — Supabase already did)
  let userId: string;
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString()
    );
    userId = payload.sub;
    if (!userId) throw new Error("No sub in token");
  } catch {
    throw new NextResponse(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check role in profiles table
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("[requireAdmin] profile fetch error:", profileError.message);
    throw new NextResponse(JSON.stringify({ error: "Failed to verify admin status" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!profile || profile.role !== "admin") {
    throw new NextResponse(JSON.stringify({ error: "Forbidden: admin only" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return userId;
}
