import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/validateApiKey";
import { logApiAccess } from "@/lib/logApiAccess";
import { runIntegrationGet, runIntegrationList } from "@/lib/integrationQuery";

function getRequestMeta(req) {
  return {
    url: new URL(req.url),
    requestIp:
      req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
    userAgent: req.headers.get("user-agent") || null,
  };
}

export async function handleIntegrationGET(req, module) {
  const { url, requestIp, userAgent } = getRequestMeta(req);
  const searchParams = url.searchParams;
  const requestQuery = Object.fromEntries(searchParams.entries());

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
      requestQuery,
      errorMessage: "Unauthorized: Invalid or missing API token",
    });

    return auth.response;
  }

  try {
    const page = searchParams.get("page") || 1;
    const limit = searchParams.get("limit") || searchParams.get("pageSize") || 20;
    const search = searchParams.get("search") || "";
    const id = searchParams.get("id") || "";

    const filter = { ...requestQuery };
    delete filter.page;
    delete filter.pageSize;
    delete filter.limit;
    delete filter.search;

    const result = id
      ? await runIntegrationGet({ module, id })
      : await runIntegrationList({ module, search, filter, page, limit });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    const responseBody = {
      success: true,
      client: {
        id: auth.client.id,
        client_code: auth.client.client_code,
        client_name: auth.client.client_name,
      },
      ...result,
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
      requestQuery,
      responseBody: {
        success: true,
        module,
        count: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0,
      },
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error(`INTEGRATION_${module}_GET_ERROR:`, error);

    await logApiAccess({
      clientId: auth.client?.id || null,
      tokenId: auth.token?.id || null,
      method: "GET",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 500,
      isSuccess: false,
      requestQuery,
      errorMessage: error.message || "Integration GET failed",
    });

    return NextResponse.json(
      { success: false, error: error.message || "Integration GET failed" },
      { status: 500 }
    );
  }
}

export async function handleIntegrationPOST(req, module) {
  const { url, requestIp, userAgent } = getRequestMeta(req);

  let body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const auth = await validateApiKey(req);

  if (!auth.success) {
    await logApiAccess({
      clientId: null,
      tokenId: null,
      method: "POST",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 401,
      isSuccess: false,
      requestQuery: body,
      errorMessage: "Unauthorized: Invalid or missing API token",
    });

    return auth.response;
  }

  try {
    const action = body?.action || "list";

    if (!["get", "list"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    const result =
      action === "get"
        ? await runIntegrationGet({
            module,
            id: body?.id || body?.filter?.id,
            filter: body?.filter || {},
          })
        : await runIntegrationList({
            module,
            search: body?.search || "",
            filter: body?.filter || {},
            page: body?.page || 1,
            limit: body?.limit || body?.pageSize || 20,
          });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    const responseBody = {
      success: true,
      client: {
        id: auth.client.id,
        client_code: auth.client.client_code,
        client_name: auth.client.client_name,
      },
      action,
      ...result,
    };

    await logApiAccess({
      clientId: auth.client.id,
      tokenId: auth.token.id,
      method: "POST",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 200,
      isSuccess: true,
      requestQuery: body,
      responseBody: {
        success: true,
        module,
        action,
        count: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0,
      },
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error(`INTEGRATION_${module}_POST_ERROR:`, error);

    await logApiAccess({
      clientId: auth.client?.id || null,
      tokenId: auth.token?.id || null,
      method: "POST",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 500,
      isSuccess: false,
      requestQuery: body,
      errorMessage: error.message || "Integration POST failed",
    });

    return NextResponse.json(
      { success: false, error: error.message || "Integration POST failed" },
      { status: 500 }
    );
  }
}