import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("dashboard_session", "", {
    path: "/",
    expires: new Date(0), // expire immediately
  });
  return response;
}
