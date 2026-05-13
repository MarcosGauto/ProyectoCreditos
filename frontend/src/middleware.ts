// middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps,  } from "firebase-admin/app"

if (!getApps().length) {
  initializeApp()
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  try {
    await getAuth().verifyIdToken(token)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL("/login", req.url))
  }
}

export const config = {
  matcher: ["/backoffice/:path*"], // 👈 solo protege el backoffice
}
