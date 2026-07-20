import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/validateApiKey";
import { logApiAccess } from "@/lib/logApiAccess";

export async function GET(req) {
  const url = new URL(req.url);
  const requestIp =
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
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

  const spec = {
    openapi: "3.0.0",
    info: {
      title: "HR Integration AI Gateway",
      version: "1.0.0",
      description:
        "API Gateway สำหรับให้ AI Local, MCP, Open WebUI, LangChain และระบบภายนอก Query ข้อมูล HR",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Development",
      },
      {
        url: "http://192.168.1.50:3000",
        description: "Local Network / LAN",
      },
      {
        url: "https://hrm.onephuket.co",
        description: "Production",
      },
    ],
    paths: {
      "/api/integration/query": {
        post: {
          summary: "Query HR data by module and action",
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["module", "action"],
                  properties: {
                    module: {
                      type: "string",
                      enum: [
                        "employees",
                        "branches",
                        "departments",
                        "divisions",
                        "units",
                        "positions",
                      ],
                    },
                    action: {
                      type: "string",
                      enum: ["get", "list", "count", "summary"],
                    },
                    id: {
                      type: "string",
                      description: "UUID ใช้กับ action get",
                    },
                    page: {
                      type: "integer",
                      default: 1,
                    },
                    limit: {
                      type: "integer",
                      default: 20,
                    },
                    search: {
                      type: "string",
                    },
                    filter: {
                      type: "object",
                      additionalProperties: true,
                    },
                  },
                },
                examples: {
                  listEmployees: {
                    summary: "List employees",
                    value: {
                      module: "employees",
                      action: "list",
                      page: 1,
                      limit: 20,
                    },
                  },
                  searchEmployees: {
                    summary: "Search employees",
                    value: {
                      module: "employees",
                      action: "list",
                      search: "สมชาย",
                    },
                  },
                  getEmployee: {
                    summary: "Get employee by id",
                    value: {
                      module: "employees",
                      action: "get",
                      id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                    },
                  },
                  countEmployees: {
                    summary: "Count employees",
                    value: {
                      module: "employees",
                      action: "count",
                    },
                  },
                  summaryEmployees: {
                    summary: "Summary employees",
                    value: {
                      module: "employees",
                      action: "summary",
                    },
                  },
                  listBranches: {
                    summary: "List branches",
                    value: {
                      module: "branches",
                      action: "list",
                    },
                  },
                  listPositionsP7: {
                    summary: "List positions P7",
                    value: {
                      module: "positions",
                      action: "list",
                      filter: {
                        position_level: "P7",
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Successful response",
            },
            400: {
              description: "Invalid module or action",
            },
            401: {
              description: "Unauthorized",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },

      "/api/integration/modules": {
        get: {
          summary: "Get supported HR modules and actions",
          security: [{ ApiKeyAuth: [] }],
          responses: {
            200: {
              description: "Supported modules",
            },
            401: {
              description: "Unauthorized",
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
    },
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
      spec: "openapi",
      version: "1.0.0",
    },
  });

  return NextResponse.json(spec);
}