import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/validateApiKey";
import { logApiAccess } from "@/lib/logApiAccess";

export async function GET(req) {
  const url = new URL(req.url);
  const requestIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") ||null;
  const userAgent = req.headers.get("user-agent") || null;
  const auth = await validateApiKey(req);

  if (!auth.success) {
    return auth.response;
  }

  const examples = {

    employees: {

      list: {
        module: "employees",
        action: "list"
      },

      pagination: {
        module: "employees",
        action: "list",
        page: 1,
        limit: 20
      },

      search: {
        module: "employees",
        action: "list",
        search: "สมชาย"
      },

      filter: {
        module: "employees",
        action: "list",
        filter: {
          status: "ACTIVE"
        }
      },

      get: {
        module: "employees",
        action: "get",
        id: "UUID"
      },

      count: {
        module: "employees",
        action: "count"
      },

      summary: {
        module: "employees",
        action: "summary"
      }

    },

    branches: {

      list: {
        module: "branches",
        action: "list"
      },

      search: {
        module: "branches",
        action: "list",
        search: "Phuket"
      },

      get: {
        module: "branches",
        action: "get",
        id: "UUID"
      }

    },

    departments: {

      list: {
        module: "departments",
        action: "list"
      }

    },

    divisions: {

      list: {
        module: "divisions",
        action: "list"
      }

    },

    units: {

      list: {
        module: "units",
        action: "list"
      }

    },

    positions: {

      list: {
        module: "positions",
        action: "list"
      },

      filter: {
        module: "positions",
        action: "list",
        filter: {
          position_level: "P7"
        }
      }

    }

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
      success: true
    }
  });

  return NextResponse.json({
    success: true,
    endpoint: "/api/integration/query",
    examples
  });

}