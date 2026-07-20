/*
   POST : http://localhost:3000/api/integration/query
   Body
    {
      "module": "positions",
      "action": "list"
    }





    # HR Integration AI Gateway API

## Endpoint

```
POST /api/integration/query
```

---

## Header

```
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

---

# Supported Modules

```
employees
branches
departments
divisions
units
positions
companies
employment_types
employee_statuses
```

---

# Supported Actions

```
list
get
count
summary
```

---

# =====================================================

# EMPLOYEES

# =====================================================

## List Employees

```json
{
    "module":"employees",
    "action":"list"
}
```

---

## List Employees (Pagination)

```json
{
    "module":"employees",
    "action":"list",
    "page":1,
    "limit":20
}
```

---

## Search Employees

```json
{
    "module":"employees",
    "action":"list",
    "search":"สมชาย"
}
```

---

## Filter Employees

```json
{
    "module":"employees",
    "action":"list",
    "filter":{
        "status":"ACTIVE"
    }
}
```

---

## Filter Multiple

```json
{
    "module":"employees",
    "action":"list",
    "filter":{
        "status":"ACTIVE",
        "branch_id":"UUID",
        "department_id":"UUID"
    }
}
```

---

## Get Employee

```json
{
    "module":"employees",
    "action":"get",
    "id":"UUID"
}
```

---

## Count Employees

```json
{
    "module":"employees",
    "action":"count"
}
```

---

## Count Active Employees

```json
{
    "module":"employees",
    "action":"count",
    "filter":{
        "status":"ACTIVE"
    }
}
```

---

## Summary Employees

```json
{
    "module":"employees",
    "action":"summary"
}
```

---

# =====================================================

# BRANCHES

# =====================================================

## List

```json
{
    "module":"branches",
    "action":"list"
}
```

---

## Search

```json
{
    "module":"branches",
    "action":"list",
    "search":"Phuket"
}
```

---

## Get

```json
{
    "module":"branches",
    "action":"get",
    "id":"UUID"
}
```

---

## Count

```json
{
    "module":"branches",
    "action":"count"
}
```

---

# =====================================================

# DEPARTMENTS

# =====================================================

## List

```json
{
    "module":"departments",
    "action":"list"
}
```

---

## Search

```json
{
    "module":"departments",
    "action":"list",
    "search":"HR"
}
```

---

## Filter

```json
{
    "module":"departments",
    "action":"list",
    "filter":{
        "status":"ACTIVE"
    }
}
```

---

## Get

```json
{
    "module":"departments",
    "action":"get",
    "id":"UUID"
}
```

---

## Count

```json
{
    "module":"departments",
    "action":"count"
}
```

---

# =====================================================

# DIVISIONS

# =====================================================

## List

```json
{
    "module":"divisions",
    "action":"list"
}
```

---

## Search

```json
{
    "module":"divisions",
    "action":"list",
    "search":"Development"
}
```

---

## Filter

```json
{
    "module":"divisions",
    "action":"list",
    "filter":{
        "department_id":"UUID"
    }
}
```

---

## Get

```json
{
    "module":"divisions",
    "action":"get",
    "id":"UUID"
}
```

---

## Count

```json
{
    "module":"divisions",
    "action":"count"
}
```

---

# =====================================================

# UNITS

# =====================================================

## List

```json
{
    "module":"units",
    "action":"list"
}
```

---

## Search

```json
{
    "module":"units",
    "action":"list",
    "search":"Software"
}
```

---

## Filter

```json
{
    "module":"units",
    "action":"list",
    "filter":{
        "division_id":"UUID"
    }
}
```

---

## Get

```json
{
    "module":"units",
    "action":"get",
    "id":"UUID"
}
```

---

## Count

```json
{
    "module":"units",
    "action":"count"
}
```

---

# =====================================================

# POSITIONS

# =====================================================

## List

```json
{
    "module":"positions",
    "action":"list"
}
```

---

## Search

```json
{
    "module":"positions",
    "action":"list",
    "search":"Manager"
}
```

---

## Filter Position Level

```json
{
    "module":"positions",
    "action":"list",
    "filter":{
        "position_level":"P7"
    }
}
```

---

## Get

```json
{
    "module":"positions",
    "action":"get",
    "id":"UUID"
}
```

---

## Count

```json
{
    "module":"positions",
    "action":"count"
}
```

---

# =====================================================

# COMPANIES

# =====================================================

## List

```json
{
    "module":"companies",
    "action":"list"
}
```

---

## Get

```json
{
    "module":"companies",
    "action":"get",
    "id":"UUID"
}
```

---

## Count

```json
{
    "module":"companies",
    "action":"count"
}
```

---

# =====================================================

# EMPLOYMENT TYPES

# =====================================================

## List

```json
{
    "module":"employment_types",
    "action":"list"
}
```

---

## Get

```json
{
    "module":"employment_types",
    "action":"get",
    "id":"UUID"
}
```

---

## Count

```json
{
    "module":"employment_types",
    "action":"count"
}
```

---

# =====================================================

# EMPLOYEE STATUSES

# =====================================================

## List

```json
{
    "module":"employee_statuses",
    "action":"list"
}
```

---

## Get

```json
{
    "module":"employee_statuses",
    "action":"get",
    "id":"UUID"
}
```

---

## Count

```json
{
    "module":"employee_statuses",
    "action":"count"
}
```

---

# Future Modules

```
benefits
benefit_categories
benefit_rules
benefit_requests
benefit_entitlements
users
roles
permissions
workflows
running_numbers
attachments
activity_logs
```

Future modules will use the exact same request format without changing the endpoint.

*/
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { validateApiKey } from "@/lib/validateApiKey";
import { logApiAccess } from "@/lib/logApiAccess";
import { getIntegrationModule } from "@/lib/integrationRegistry";

function applyFilters(query, config, filter = {}) {
  Object.entries(filter || {}).forEach(([key, value]) => {
    if (!config.filterFields.includes(key)) return;
    if (value === undefined || value === null || value === "") return;

    query = query.eq(key, value);
  });

  return query;
}

function applySearch(query, config, search = "") {
  const keyword = search?.trim();

  if (!keyword) return query;
  if (!config.searchFields?.length) return query;

  const orQuery = config.searchFields
    .map((field) => `${field}.ilike.%${keyword}%`)
    .join(",");

  return query.or(orQuery);
}

function getPagination(page, limit) {
  const safePage = Math.max(Number(page || 1), 1);
  const safeLimit = Math.min(Math.max(Number(limit || 20), 1), 100);

  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  return {
    page: safePage,
    limit: safeLimit,
    from,
    to,
  };
}

export async function POST(req) {
  const url = new URL(req.url);
  const requestIp =req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
  const userAgent = req.headers.get("user-agent") || null;

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
    const moduleName = body?.module?.trim();
    const action = body?.action?.trim() || "list";

    const config = getIntegrationModule(moduleName);

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid module",
        },
        { status: 400 }
      );
    }

    if (!["get", "list", "count", "summary"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action",
        },
        { status: 400 }
      );
    }

    const { page, limit, from, to } = getPagination(body?.page, body?.limit);

    let query = supabaseAdmin
      .from(config.table)
      .select(config.select, { count: "exact" });

    query = applyFilters(query, config, body?.filter || {});
    query = applySearch(query, config, body?.search || "");

    if (action === "get") {
      const id = body?.id || body?.filter?.id;

      if (!id) {
        return NextResponse.json(
          {
            success: false,
            error: "id is required for get action",
          },
          { status: 400 }
        );
      }

      query = query.eq("id", id).maybeSingle();

      const { data, error } = await query;

      if (error) throw error;

      const responseBody = {
        success: true,
        client: {
          id: auth.client.id,
          client_code: auth.client.client_code,
          client_name: auth.client.client_name,
        },
        module: moduleName,
        action,
        data,
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
          module: moduleName,
          action,
        },
      });

      return NextResponse.json(responseBody);
    }


    if (action === "count") {
      query = query.select("id", { count: "exact", head: true });

      const { count, error } = await query;

      if (error) throw error;

      const responseBody = {
        success: true,
        client: {
          id: auth.client.id,
          client_code: auth.client.client_code,
          client_name: auth.client.client_name,
        },
        module: moduleName,
        action,
        count: count || 0,
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
          module: moduleName,
          action,
          count: count || 0,
        },
      });

      return NextResponse.json(responseBody);
    }

    query = query
      .order(config.defaultOrder || "created_at", { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const responseBody = {
      success: true,
      client: {
        id: auth.client.id,
        client_code: auth.client.client_code,
        client_name: auth.client.client_name,
      },
      module: moduleName,
      action,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      data: data || [],
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
        module: moduleName,
        action,
        count: data?.length || 0,
      },
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("INTEGRATION_QUERY_API_ERROR:", error);

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
      errorMessage: error.message || "Integration query failed",
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Integration query failed",
      },
      { status: 500 }
    );
  }
}