/*
 1.
  Get : http://localhost:3000/api/integration/modules
  Header 
   Key : value

*/


import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/validateApiKey";
import { logApiAccess } from "@/lib/logApiAccess";
import { getIntegrationModules } from "@/lib/integrationRegistry";

export async function GET(req) {
  const url = new URL(req.url);

  const requestIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
  const userAgent = req.headers.get("user-agent") || null;
  const auth = await validateApiKey(req);

  if (!auth.success) {
    await logApiAccess({
      clientId: null,
      tokenId: null,
      method: "GET",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 401,
      isSuccess: false,
      requestQuery: {},
      errorMessage: "Unauthorized: Invalid or missing API token",
    });

    return auth.response;
  }

  // ===========================
  // Read Modules From Registry
  // ===========================

  const modules = getIntegrationModules().map((item) => ({
    module: item.module,
    table: item.table,
    description: item.description,
    endpoint: "/api/integration/query",

    actions: item.actions,

    primaryKey: item.primaryKey,

    filters: item.filterFields,

    searchFields: item.searchFields,

    sortableFields: item.sortableFields,

    defaultSort: item.defaultSort,

    search: item.searchFields?.length > 0,

    pagination: true,
  }));

  const responseBody = {
    success: true,

    version: "1.0.0",

    name: "HR Integration AI Gateway",

    gateway: {
      method: "POST",
      endpoint: "/api/integration/query",
      headers: [
        "Content-Type: application/json",
        "x-api-key",
      ],
    },

    client: {
      id: auth.client.id,
      client_code: auth.client.client_code,
      client_name: auth.client.client_name,
    },

    totalModules: modules.length,

    modules,
  };

  await logApiAccess({
    clientId: auth.client.id,
    tokenId: auth.token.id,
    method: "GET",
    endpoint: url.pathname,
    requestIp,
    userAgent,
    statusCode: 200,
    isSuccess: true,
    requestQuery: {},
    responseBody: {
      success: true,
      module_count: modules.length,
    },
  });

  return NextResponse.json(responseBody);
}