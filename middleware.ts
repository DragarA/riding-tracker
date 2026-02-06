export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/((?!signin|register|api|_next/static|_next/image|favicon.ico).*)"]
};
