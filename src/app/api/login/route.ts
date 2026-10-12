import { NextResponse } from "next/server";
import { z } from "zod";
import { loginWithPin } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";

const bodySchema = z.object({
  name: z.string().min(1),
  pin: z.string().regex(/^\d{4}$/),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "invalid_request" }, { status: 400 });
  }

  const result = await loginWithPin(parsed.data.name, parsed.data.pin);

  if (!result.ok) {
    // Deliberately vague for "not_found"/"wrong_pin" so a wrong name doesn't
    // reveal which players exist; lockout message is shown as-is since it's
    // not sensitive.
    if (result.reason === "locked") {
      return NextResponse.json(
        { ok: false, reason: "locked", minutesRemaining: result.minutesRemaining },
        { status: 429 }
      );
    }
    return NextResponse.json({ ok: false, reason: "wrong_pin" }, { status: 401 });
  }

  await setSessionCookie(result.player.id);
  return NextResponse.json({ ok: true, player: result.player });
}
