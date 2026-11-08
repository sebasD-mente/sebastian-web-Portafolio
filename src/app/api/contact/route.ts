import { handleContactPost } from "@/runtime/contact.handler";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleContactPost(request);
}
