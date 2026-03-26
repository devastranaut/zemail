import { NextResponse } from "next/server";

import { createUserApiKey, listUserApiKeys } from "@/lib/auth/apiKeys";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await listUserApiKeys(user.id);
  return NextResponse.json({ keys });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let name: string | undefined;
  try {
    const body = (await request.json()) as { name?: unknown };
    if (typeof body.name === "string") {
      name = body.name;
    }
  } catch {
    name = undefined;
  }

  const result = await createUserApiKey(user.id, name);
  return NextResponse.json(result, { status: 201 });
}
