import { handleAdminUploadPost } from "@/runtime/admin-catalog.handler";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleAdminUploadPost(request);
}
