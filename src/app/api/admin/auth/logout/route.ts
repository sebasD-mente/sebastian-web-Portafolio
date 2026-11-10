import { handleAdminAuthLogoutPost } from "@/runtime/admin-auth.handler";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleAdminAuthLogoutPost(request);
}
