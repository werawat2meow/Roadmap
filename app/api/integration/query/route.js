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
<<<<<<< HEAD
import { NextResponse } from "next/server";
=======


import { NextResponse } from "next/server";
import crypto from "crypto";

>>>>>>> test_merge_all
import { supabaseAdmin } from "@/lib/supabaseServer";
import { validateApiKey } from "@/lib/validateApiKey";
import { logApiAccess } from "@/lib/logApiAccess";
import { getIntegrationModule } from "@/lib/integrationRegistry";

<<<<<<< HEAD
function applyFilters(query, config, filter = {}) {
  Object.entries(filter || {}).forEach(([key, value]) => {
    if (!config.filterFields.includes(key)) return;
    if (value === undefined || value === null || value === "") return;

    query = query.eq(key, value);
  });
=======
const EMPLOYEE_CACHE_TTL_MS = 60 * 1000;

const MASTER_CACHE_TTL_MS = 10 * 60 * 1000;

const MAX_PAGE_SIZE = 1000;


function getRequestIp(req) {
  const forwarded =
    req.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded
      .split(",")[0]
      ?.trim() || null;
  }

  return (
    req.headers.get("x-real-ip") ||
    null
  );
}

function normalizeForHash(value) {
  if (Array.isArray(value)) {
    return value.map(
      normalizeForHash
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] =
          normalizeForHash(
            value[key]
          );

        return result;
      }, {});
  }

  return value;
}

function createFingerprint({
  clientId,
  moduleName,
  action,
  body,
}) {
  const payload = {
    client_id: clientId,
    module: moduleName,
    action,

    id:
      body?.id || null,

    search:
      String(
        body?.search || ""
      ).trim(),

    filter:
      body?.filter || {},

    page:
      Number(
        body?.page || 1
      ),

    limit:
      Number(
        body?.limit || 100
      ),

    updated_after:
      body?.updated_after || null,

    updated_before:
      body?.updated_before || null,
  };

  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify(
        normalizeForHash(payload)
      )
    )
    .digest("hex");
}

function getCacheTtl(moduleName) {
  if (
    moduleName === "employees"
  ) {
    return EMPLOYEE_CACHE_TTL_MS;
  }

  return MASTER_CACHE_TTL_MS;
}

function sanitizeSearch(value) {
  return String(value || "")
    .trim()
    .replace(/[(),]/g, " ")
    .slice(0, 200);
}

function applyFilters(
  query,
  config,
  filter = {}
) {
  for (
    const [key, value]
    of Object.entries(
      filter || {}
    )
  ) {
    if (
      !config.filterFields?.includes(
        key
      )
    ) {
      continue;
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      const values =
        value
          .filter(
            (item) =>
              item !== null &&
              item !== undefined &&
              item !== ""
          )
          .slice(0, 500);

      if (values.length) {
        query =
          query.in(
            key,
            values
          );
      }

      continue;
    }

    query =
      query.eq(
        key,
        value
      );
  }
>>>>>>> test_merge_all

  return query;
}

<<<<<<< HEAD
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
=======
function applySearch(
  query,
  config,
  search = ""
) {
  const keyword =
    sanitizeSearch(search);

  if (!keyword) {
    return query;
  }

  if (
    !config.searchFields
      ?.length
  ) {
    return query;
  }

  const expression =
    config.searchFields
      .map(
        (field) =>
          `${field}.ilike.%${keyword}%`
      )
      .join(",");

  return query.or(
    expression
  );
}

function getPagination(
  page,
  limit
) {
  const safePage =
    Math.max(
      Number(page || 1),
      1
    );

  const safeLimit =
    Math.min(
      Math.max(
        Number(limit || 100),
        1
      ),
      MAX_PAGE_SIZE
    );

  return {
    page:
      safePage,

    limit:
      safeLimit,

    from:
      (safePage - 1) *
      safeLimit,

    to:
      safePage *
        safeLimit -
      1,
  };
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}


async function getCachedResponse({
  clientId,
  fingerprint,
}) {
  const now =
    new Date().toISOString();

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "integration_request_cache"
      )
      .select(`
        id,
        response_body,
        expires_at,
        last_requested_at,
        hit_count
      `)
      .eq(
        "client_id",
        clientId
      )
      .eq(
        "fingerprint",
        fingerprint
      )
      .gt(
        "expires_at",
        now
      )
      .maybeSingle();

  if (error) {
    console.error(
      "INTEGRATION_CACHE_READ_ERROR:",
      error
    );

    /*
     * Cache Error ไม่ควรทำให้ API หลักพัง
     */
    return null;
  }

  return data || null;
}

async function saveCachedResponse({
  clientId,
  fingerprint,
  moduleName,
  action,
  responseBody,
  ttlMs,
}) {
  const now =
    new Date();

  const expiresAt =
    new Date(
      now.getTime() +
        ttlMs
    );

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "integration_request_cache"
      )
      .upsert(
        {
          client_id:
            clientId,

          fingerprint,

          module_code:
            moduleName,

          action_code:
            action,

          last_requested_at:
            now.toISOString(),

          expires_at:
            expiresAt.toISOString(),

          response_body:
            responseBody,

          hit_count:
            1,
        },
        {
          onConflict:
            "client_id,fingerprint",
        }
      );

  if (error) {
    /*
     * Cache Save Error
     * ไม่ทำให้ API หลักพัง
     */
    console.error(
      "INTEGRATION_CACHE_SAVE_ERROR:",
      error
    );
  }

  return expiresAt.toISOString();
}


async function executeQuery({
  config,
  moduleName,
  action,
  body,
  auth,
}) {
  const {
    page,
    limit,
    from,
    to,
  } =
    getPagination(
      body?.page,
      body?.limit
    );

  const updatedAfter =
    body?.updated_after
      ? normalizeDate(
          body.updated_after
        )
      : null;

  if (
    body?.updated_after &&
    !updatedAfter
  ) {
    return {
      status: 400,
      body: {
        success: false,
        error:
          "updated_after is invalid",
      },
    };
  }

  /*
   * Snapshot ของรอบนี้
   */
  const watermark =
    body?.updated_before
      ? normalizeDate(
          body.updated_before
        )
      : new Date()
          .toISOString();

  if (
    body?.updated_before &&
    !watermark
  ) {
    return {
      status: 400,
      body: {
        success: false,
        error:
          "updated_before is invalid",
      },
    };
  }

  const syncField =
    config.syncField === false
      ? null
      : config.syncField ||
        "updated_at";

  /* =====================================================
     GET
  ===================================================== */

  if (action === "get") {
    const id =
      body?.id ||
      body?.filter?.id;

    if (!id) {
      return {
        status: 400,
        body: {
          success: false,
          error:
            "id is required for get action",
        },
      };
    }

    let query =
      supabaseAdmin
        .from(
          config.table
        )
        .select(
          config.select
        )
        .eq(
          config.primaryKey ||
            "id",
          id
        );

    query =
      applyFilters(
        query,
        config,
        body?.filter || {}
      );

    const {
      data,
      error,
    } =
      await query
        .maybeSingle();

    if (error) {
      throw error;
    }

    return {
      status: 200,

      body: {
        success: true,

        client: {
          id:
            auth.client.id,

          client_code:
            auth.client
              .client_code,

          client_name:
            auth.client
              .client_name,
        },

        module:
          moduleName,

        action,

        sync: {
          updated_after:
            updatedAfter,

          watermark,
        },

        data:
          data || null,
      },
    };
  }

  /* =====================================================
     COUNT
  ===================================================== */

  if (action === "count") {
    let query =
      supabaseAdmin
        .from(
          config.table
        )
        .select(
          config.primaryKey ||
            "id",
          {
            count: "exact",
            head: true,
          }
        );

    query =
      applyFilters(
        query,
        config,
        body?.filter || {}
      );

    query =
      applySearch(
        query,
        config,
        body?.search || ""
      );

    if (
      syncField &&
      updatedAfter
    ) {
      query =
        query.gt(
          syncField,
          updatedAfter
        );
    }

    if (
      syncField
    ) {
      query =
        query.lte(
          syncField,
          watermark
        );
    }

    const {
      count,
      error,
    } =
      await query;

    if (error) {
      throw error;
    }

    return {
      status: 200,

      body: {
        success: true,

        client: {
          id:
            auth.client.id,

          client_code:
            auth.client
              .client_code,

          client_name:
            auth.client
              .client_name,
        },

        module:
          moduleName,

        action,

        count:
          count || 0,

        sync: {
          updated_after:
            updatedAfter,

          watermark,
        },
      },
    };
  }

  /* =====================================================
     LIST / SUMMARY
  ===================================================== */

  let query =
    supabaseAdmin
      .from(
        config.table
      )
      .select(
        config.select,
        {
          count: "exact",
        }
      );

  query =
    applyFilters(
      query,
      config,
      body?.filter || {}
    );

  query =
    applySearch(
      query,
      config,
      body?.search || ""
    );

  if (
    syncField &&
    updatedAfter
  ) {
    query =
      query.gt(
        syncField,
        updatedAfter
      );
  }

  if (syncField) {
    query =
      query.lte(
        syncField,
        watermark
      );
  }

  /*
   * Registry ปัจจุบันของเราใช้:
   *
   * defaultSort: {
   *   field,
   *   order
   * }
   */

  const sortField =
    config
      ?.defaultSort
      ?.field ||
    "created_at";

  const ascending =
    String(
      config
        ?.defaultSort
        ?.order ||
        "desc"
    ).toLowerCase() ===
    "asc";

  query =
    query
      .order(
        sortField,
        {
          ascending,
        }
      )
      .range(
        from,
        to
      );

  const {
    data,
    error,
    count,
  } =
    await query;

  if (error) {
    throw error;
  }

  const rows =
    data || [];

  const total =
    Number(
      count || 0
    );

  return {
    status: 200,

    body: {
      success: true,

      client: {
        id:
          auth.client.id,

        client_code:
          auth.client
            .client_code,

        client_name:
          auth.client
            .client_name,
      },

      module:
        moduleName,

      action,

      pagination: {
        page,
        limit,
        total,

        totalPages:
          total > 0
            ? Math.ceil(
                total /
                  limit
              )
            : 0,

        hasMore:
          page *
            limit <
          total,
      },

      sync: {
        updated_after:
          updatedAfter,

        watermark,
      },

      data:
        rows,
    },
>>>>>>> test_merge_all
  };
}

export async function POST(req) {
<<<<<<< HEAD
  const url = new URL(req.url);
  const requestIp =req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
  const userAgent = req.headers.get("user-agent") || null;
=======
  const url =
    new URL(req.url);

  const requestIp =
    getRequestIp(req);

  const userAgent =
    req.headers.get(
      "user-agent"
    ) || null;
>>>>>>> test_merge_all

  let body = {};

  try {
<<<<<<< HEAD
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
=======
    body =
      await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid JSON body",
      },
      {
        status: 400,
      }
    );
  }

  /* =====================================================
     AUTH
  ===================================================== */

  const auth =
    await validateApiKey(
      req
    );

  if (!auth.success) {
    await logApiAccess({
      clientId:
        null,

      tokenId:
        null,

      method:
        "POST",

      endpoint:
        url.pathname,

      requestIp,

      userAgent,

      statusCode:
        401,

      isSuccess:
        false,

      requestQuery:
        body,

      errorMessage:
        "Unauthorized: Invalid or missing API token",
>>>>>>> test_merge_all
    });

    return auth.response;
  }

  try {
<<<<<<< HEAD
    const moduleName = body?.module?.trim();
    const action = body?.action?.trim() || "list";

    const config = getIntegrationModule(moduleName);
=======
    /* ===================================================
       MODULE / ACTION
    =================================================== */

    const moduleName =
      String(
        body?.module || ""
      )
        .trim()
        .toLowerCase();

    const action =
      String(
        body?.action ||
          "list"
      )
        .trim()
        .toLowerCase();

    const config =
      getIntegrationModule(
        moduleName
      );
>>>>>>> test_merge_all

    if (!config) {
      return NextResponse.json(
        {
          success: false,
<<<<<<< HEAD
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
=======
          error:
            "Invalid module",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !config.actions
        ?.includes(action)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid action",
        },
        {
          status: 400,
        }
      );
    }

    /* ===================================================
       FINGERPRINT
    =================================================== */

    const fingerprint =
      createFingerprint({
        clientId:
          auth.client.id,

        moduleName,

        action,

        body,
      });

    /* ===================================================
       CACHE CHECK
    =================================================== */

    const cached =
      await getCachedResponse({
        clientId:
          auth.client.id,

        fingerprint,
      });

    if (
      cached?.response_body
    ) {
      /*
       * IMPORTANT:
       *
       * ตรงนี้ไม่มี Query employees /
       * departments / positions
       *
       * อ่านแค่ Cache Table
       */

      return NextResponse.json(
        {
          ...cached.response_body,

          meta: {
            cached:
              true,

            duplicate:
              true,

            fingerprint,

            cache_expires_at:
              cached.expires_at,
          },
        },
        {
          status: 200,

          headers: {
            "X-Integration-Cache":
              "HIT",

            "X-Request-Fingerprint":
              fingerprint,
          },
        }
      );
    }

    /* ===================================================
       QUERY จริง
    =================================================== */

    const result =
      await executeQuery({
        config,

        moduleName,

        action,

        body,

        auth,
      });

    /* ===================================================
       CACHE SUCCESS RESPONSE
    =================================================== */

    let cacheExpiresAt =
      null;

    if (
      result.status >= 200 &&
      result.status < 300
    ) {
      cacheExpiresAt =
        await saveCachedResponse({
          clientId:
            auth.client.id,

          fingerprint,

          moduleName,

          action,

          responseBody:
            result.body,

          ttlMs:
            getCacheTtl(
              moduleName
            ),
        });
    }

    /* ===================================================
       ACCESS LOG

       Log เฉพาะ CACHE MISS
       Cache Hit ไม่ INSERT Log ซ้ำ
    =================================================== */

    await logApiAccess({
      clientId:
        auth.client.id,

      tokenId:
        auth.token.id,

      method:
        "POST",

      endpoint:
        url.pathname,

      requestIp,

      userAgent,

      statusCode:
        result.status,

      isSuccess:
        result.status >= 200 &&
        result.status < 300,

      requestQuery:
        body,

      responseBody: {
        success:
          result.body
            ?.success,

        module:
          moduleName,

        action,

        count:
          result.body
            ?.data
            ?.length ||
          result.body
            ?.count ||
          0,

        cached:
          false,

        fingerprint,
      },
    });

    return NextResponse.json(
      {
        ...result.body,

        meta: {
          cached:
            false,

          fingerprint,

          cache_expires_at:
            cacheExpiresAt,

          generated_at:
            new Date()
              .toISOString(),
        },
      },
      {
        status:
          result.status,

        headers: {
          "X-Integration-Cache":
            "MISS",

          "X-Request-Fingerprint":
            fingerprint,
        },
      }
    );
  } catch (error) {
    console.error(
      "INTEGRATION_QUERY_API_ERROR:",
      error
    );

    await logApiAccess({
      clientId:
        auth.client?.id ||
        null,

      tokenId:
        auth.token?.id ||
        null,

      method:
        "POST",

      endpoint:
        url.pathname,

      requestIp,

      userAgent,

      statusCode:
        500,

      isSuccess:
        false,

      requestQuery:
        body,

      errorMessage:
        error?.message ||
        "Integration query failed",
>>>>>>> test_merge_all
    });

    return NextResponse.json(
      {
        success: false,
<<<<<<< HEAD
        error: error.message || "Integration query failed",
      },
      { status: 500 }
=======

        /*
         * ไม่เปิด Database Error
         * ให้ Client ภายนอก
         */
        error:
          "Integration query failed",
      },
      {
        status: 500,
      }
>>>>>>> test_merge_all
    );
  }
}