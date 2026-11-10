import {
  handleAdminSystemsDelete,
  handleAdminSystemsGet,
  handleAdminSystemsPost,
  handleAdminSystemsPut
} from "@/runtime/admin-catalog.handler";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleAdminSystemsGet(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleAdminSystemsPost(request);
}

export async function PUT(request: Request): Promise<Response> {
  return handleAdminSystemsPut(request);
}

export async function DELETE(request: Request): Promise<Response> {
  return handleAdminSystemsDelete(request);
}
