import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export async function GET() {
  try {
    const [{ data: levels, error: levelsError }, { data: categories, error: categoriesError }, { data: authorities, error: authoritiesError }, { data: rules, error: rulesError }, { data: categoryRules, error: categoryRulesError }] = await Promise.all([
      supabaseAdmin.from("position_levels").select("id,level_code,level_name,status,sort_order").order("sort_order", { ascending: true }),
      supabaseAdmin.from("authority_categories").select("id,category_code,category_name,description,sort_order,is_active").order("sort_order", { ascending: true }),
      supabaseAdmin.from("authorities").select("id,category_id,authority_code,authority_name,description,sort_order,is_active").order("sort_order", { ascending: true }),
      supabaseAdmin.from("authority_level_rules").select("id,authority_id,position_level_id,is_allowed,limit_amount,limit_unit,scope_text,condition_text,effective_from,effective_to,is_active").order("created_at", { ascending: true }),
      supabaseAdmin.from("authority_category_level_rules").select("id,category_id,position_level_id,is_allowed").order("created_at", { ascending: true }),
    ]);

    const error = levelsError || categoriesError || authoritiesError || rulesError || categoryRulesError;
    if (error) return json({ success: false, error: error.message }, 500);

    const availableLevels = (levels || []).filter((level: any) => level.level_code !== "P1");
    const data = (categories || []).map((category: any) => ({
      ...category,
      levelRules: (categoryRules || []).filter((rule: any) => rule.category_id === category.id),
      authorities: (authorities || [])
        .filter((authority: any) => authority.category_id === category.id)
        .map((authority: any) => ({
          ...authority,
          rules: (rules || []).filter((rule: any) => rule.authority_id === authority.id),
        })),
    }));

    return json({ success: true, data, levels: availableLevels });
  } catch (error: any) {
    return json({ success: false, error: error?.message || "Failed to load authority settings" }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resource = String(body?.resource || "");
    let table = "";
    let payload: Record<string, unknown> = {};

    if (resource === "category") {
      table = "authority_categories";
      payload = {
        category_code: String(body.categoryCode || "").trim(),
        category_name: String(body.categoryName || "").trim(),
        description: body.description ? String(body.description).trim() : null,
        sort_order: Number(body.sortOrder || 0),
      };
      if (!payload.category_code || !payload.category_name) return json({ success: false, error: "กรุณาระบุรหัสและชื่อหมวดอำนาจ" }, 400);
    } else if (resource === "authority") {
      table = "authorities";
      const requestedAuthorityCode = String(body.authorityCode || "").trim();
      let authorityCode = requestedAuthorityCode;

      if (!authorityCode || authorityCode === "-" || authorityCode === "_") {
        authorityCode = `authority_${String(body.categoryId || "").slice(0, 8)}_${Date.now()}`;
      }

      const { data: existingAuthority, error: authorityLookupError } = await supabaseAdmin
        .from("authorities")
        .select("id")
        .eq("authority_code", authorityCode)
        .maybeSingle();

      if (authorityLookupError) return json({ success: false, error: authorityLookupError.message }, 500);
      if (existingAuthority) {
        authorityCode = `${authorityCode}_${Date.now()}`;
      }

      payload = {
        category_id: String(body.categoryId || ""),
        authority_code: authorityCode,
        authority_name: String(body.authorityName || "").trim(),
        description: body.description ? String(body.description).trim() : null,
        sort_order: Number(body.sortOrder || 0),
      };
      if (!payload.category_id || !payload.authority_code || !payload.authority_name) return json({ success: false, error: "กรุณาระบุหมวด รหัส และชื่ออำนาจ" }, 400);
    } else if (resource === "category_rule") {
      table = "authority_category_level_rules";
      payload = {
        category_id: String(body.categoryId || ""),
        position_level_id: String(body.positionLevelId || ""),
        is_allowed: Boolean(body.isAllowed),
      };
      if (!payload.category_id || !payload.position_level_id) return json({ success: false, error: "กรุณาระบุหมวดและ Level" }, 400);
    } else if (resource === "rule") {
      table = "authority_level_rules";
      payload = {
        authority_id: String(body.authorityId || ""),
        position_level_id: String(body.positionLevelId || ""),
        is_allowed: Boolean(body.isAllowed),
        limit_amount: body.limitAmount === "" || body.limitAmount == null ? null : Number(body.limitAmount),
        limit_unit: body.limitUnit ? String(body.limitUnit).trim() : null,
        scope_text: body.scopeText ? String(body.scopeText).trim() : null,
        condition_text: body.conditionText ? String(body.conditionText).trim() : null,
        effective_from: body.effectiveFrom || null,
        effective_to: body.effectiveTo || null,
      };
      if (!payload.authority_id || !payload.position_level_id) return json({ success: false, error: "กรุณาระบุรายการอำนาจและ Level" }, 400);
    } else return json({ success: false, error: "Invalid resource" }, 400);

    const { data, error } = await supabaseAdmin.from(table).insert(payload).select().single();
    if (error) return json({ success: false, error: error.message }, 500);
    return json({ success: true, data });
  } catch (error: any) {
    return json({ success: false, error: error?.message || "Failed to create authority setting" }, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const resource = String(body?.resource || "");
    const id = String(body?.id || "");
    if (!id) return json({ success: false, error: "id is required" }, 400);

    const tableByResource: Record<string, string> = {
      level: "position_levels",
      category: "authority_categories",
      authority: "authorities",
      category_rule: "authority_category_level_rules",
      rule: "authority_level_rules",
    };
    const table = tableByResource[resource];
    if (!table) return json({ success: false, error: "Invalid resource" }, 400);

    const allowedFields: Record<string, string[]> = {
      level: ["status"],
      category: ["category_code", "category_name", "description", "sort_order", "is_active"],
      authority: ["category_id", "authority_code", "authority_name", "description", "sort_order", "is_active"],
      category_rule: ["is_allowed"],
      rule: ["is_allowed", "limit_amount", "limit_unit", "scope_text", "condition_text", "effective_from", "effective_to", "is_active"],
    };
    const payload = Object.fromEntries(
      allowedFields[resource].filter((field) => Object.prototype.hasOwnProperty.call(body, field)).map((field) => [field, body[field]]),
    );
    if (Object.keys(payload).length === 0) return json({ success: false, error: "No fields to update" }, 400);

    const { data, error } = await supabaseAdmin.from(table).update(payload).eq("id", id).select().single();
    if (error) return json({ success: false, error: error.message }, 500);
    return json({ success: true, data });
  } catch (error: any) {
    return json({ success: false, error: error?.message || "Failed to update authority setting" }, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const tableByResource: Record<string, string> = {
      category: "authority_categories",
      authority: "authorities",
      rule: "authority_level_rules",
    };
    const table = tableByResource[String(body?.resource || "")];
    const id = String(body?.id || "");
    if (!table || !id) return json({ success: false, error: "resource and id are required" }, 400);

    const { error } = await supabaseAdmin.from(table).delete().eq("id", id);
    if (error) return json({ success: false, error: error.message }, 500);
    return json({ success: true });
  } catch (error: any) {
    return json({ success: false, error: error?.message || "Failed to delete authority setting" }, 500);
  }
}
