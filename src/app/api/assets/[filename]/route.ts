import { handleAssetGet } from "@/runtime/admin-catalog.handler";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> }
): Promise<Response> {
  const { filename } = await context.params;
  return handleAssetGet(request, filename);
}
