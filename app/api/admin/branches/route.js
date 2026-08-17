import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {requireScopedAccess,} from "@/lib/auth/requireScopedAccess";

export async function GET(req) {
  try {
    /* =====================================================
       Permission + Scope
    ===================================================== */

    const { searchParams } = new URL(req.url);
    const scopeContext = searchParams.get("scope_context")?.trim() || "";

<<<<<<< HEAD
    const { data, error } = await supabaseAdmin
      .from("branches")
      .select(`
        id,
        branch_code,
        branch_name,
        company_id,
        group_id,
        phone,
        status,
        sort_order,
        branch_image_url,
        branch_image_path,
        created_at,
        companies (
          id,
          company_code,
          company_name_th,
          company_name_en
        ),
        branch_groups (
          id,
          group_code,
          group_name,
          group_color
=======
    const allowedScopeContexts = new Set([
      "ems.employees",
      "ems.departments",
      "ems.divisions",
      "ems.units",
    ]);

    const permissionModule =
      allowedScopeContexts.has(scopeContext)
        ? scopeContext
        : "ems.branches";

    const guard = await requireScopedAccess(
      permissionModule,
      "view",
      { scopeType: "branch" }
    );

    if (!guard.ok) {
      return guard.response;
    }
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    let query =
      supabaseAdmin
        .from("branches")
        .select(`
          id,
          branch_code,
          branch_name,
          company_id,
          group_id,
          phone,
          status,
          sort_order,
          branch_image_url,
          branch_image_path,
          created_at,

          companies (
            id,
            company_code,
            company_name_th,
            company_name_en
          ),

          branch_groups (
            id,
            group_code,
            group_name,
            group_color
          )
        `)
        .order(
          "sort_order",
          {
            ascending: true,
          }
>>>>>>> test_merge_all
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    /* =====================================================
       Scope
    ===================================================== */

<<<<<<< HEAD
    const mappedData = (data || []).map((branch) => ({
      id: branch.id,
      branch_code: branch.branch_code,
      branch_name: branch.branch_name,
      company_id: branch.company_id,
      company_name:
        branch.companies?.company_name_th ||
        branch.companies?.company_name_en ||
        "-",
      company_code: branch.companies?.company_code || "",
      phone: branch.phone,
      status: branch.status,
      sort_order: branch.sort_order,
      branch_image_url: branch.branch_image_url || "",
      branch_image_path: branch.branch_image_path || "",
      created_at: branch.created_at,
      group_id: branch.group_id || "",
      group_code: branch.branch_groups?.group_code || "",
      group_name: branch.branch_groups?.group_name || "",
      group_color: branch.branch_groups?.group_color || "#E2E8F0",
    }));

    const filteredData = search ? mappedData.filter((item) => {
          const keyword = search.toLowerCase();
          return (
            item.branch_code?.toLowerCase().includes(keyword) ||
            item.branch_name?.toLowerCase().includes(keyword) ||
            item.company_name?.toLowerCase().includes(keyword) ||
            item.company_code?.toLowerCase().includes(keyword) ||
            item.group_name?.toLowerCase().includes(keyword) ||
            item.group_code?.toLowerCase().includes(keyword) 
          );
=======
    query =
      guard.applyScope(
        query,
        "id"
      );

    /* =====================================================
       Execute
    ===================================================== */

    const {data,error,} = await query;
    if (error) {
      throw error;
    }

    /* =====================================================
       Map
    ===================================================== */

    const mappedData = (data || []).map(
        (branch) => ({
          id: branch.id,
          branch_code: branch.branch_code || "",
          branch_name: branch.branch_name || "",
          company_id: branch.company_id || "",
          company_name: branch.companies?.company_name_th || branch.companies ?.company_name_en ||"-",
          company_code: branch.companies ?.company_code || "",
          phone: branch.phone || "",

          status:
            branch.status,

          sort_order:
            Number(
              branch.sort_order ||
                0
            ),

          branch_image_url:
            branch.branch_image_url ||
            "",

          branch_image_path:
            branch.branch_image_path ||
            "",

          created_at:
            branch.created_at,

          group_id:
            branch.group_id ||
            "",

          group_code:
            branch.branch_groups
              ?.group_code ||
            "",

          group_name:
            branch.branch_groups
              ?.group_name ||
            "",

          group_color:
            branch.branch_groups
              ?.group_color ||
            "#E2E8F0",
>>>>>>> test_merge_all
        })
      );

    /* =====================================================
       Search
    ===================================================== */

    const filteredData =
      search
        ? mappedData.filter(
            (item) =>
              item.branch_code
                ?.toLowerCase()
                .includes(
                  search
                ) ||
              item.branch_name
                ?.toLowerCase()
                .includes(
                  search
                ) ||
              item.company_name
                ?.toLowerCase()
                .includes(
                  search
                ) ||
              item.company_code
                ?.toLowerCase()
                .includes(
                  search
                ) ||
              item.group_name
                ?.toLowerCase()
                .includes(
                  search
                ) ||
              item.group_code
                ?.toLowerCase()
                .includes(
                  search
                )
          )
        : mappedData;

    return NextResponse.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    console.error(
      "GET_BRANCHES_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "ไม่สามารถดึงข้อมูลสาขาได้",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req) {
  try {

    /* =====================================================
       1. Permission
       scopeType ยังระบุ branch_group
       แต่ CREATE ไม่บังคับ ALL Scope
    ===================================================== */
    const guard = await requireScopedAccess("ems.branches","create",{scopeType:"branch",});
    if (!guard.ok) {
      return guard.response;
    }

    const body = await req.json();

    const branch_code = body?.branch_code?.trim();
    const branch_name = body?.branch_name?.trim();
    const company_id = body?.company_id || null;
    const phone = body?.phone?.trim() || null;
    const status = body?.status || "active";
    const group_id = body?.group_id || null;
    const branch_image_url = body?.branch_image_url || null;
    const branch_image_path = body?.branch_image_path || null;

    if (!branch_code || !branch_name) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสสังกัดและชื่อสังกัด" },
        { status: 400 }
      );
    }

    if (!company_id) {
      return NextResponse.json(
        { error: "กรุณาเลือกบริษัท" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("branches")
      .insert([
        {
          branch_code,
          branch_name,
          company_id,
          phone,
          status,
          branch_image_url,
          branch_image_path,
          group_id,
        },
      ])
      .select(`
        id,
        branch_code,
        branch_name,
        company_id,
        phone,
        status,
        sort_order,
        branch_image_url,
        branch_image_path,
        created_at,
        group_id,
        branch_groups (
          id,
          group_code,
          group_name,
          group_color
        ),
        companies (
          id,
          company_code,
          company_name_th,
          company_name_en
        )
      `)
      .single();
      
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "รหัสสังกัดนี้มีอยู่แล้ว" },
          { status: 400 }
        );
      }

      throw error;
    }

    await writeActivityLog({
      module_name: "branches",
      action_type: "create",
      reference_table: "branches",
      reference_id: data.id,
      description: `เพิ่มสังกัด ${data.branch_code} - ${data.branch_name}`,
      new_data: {
        branch_code: data.branch_code,
        branch_name: data.branch_name,
        company_id: data.company_id,
        company_code: data.companies?.company_code || "",
        company_name:
          data.companies?.company_name_th ||
          data.companies?.company_name_en ||
          "",
        phone: data.phone,
        status: data.status,
        branch_image_url: data.branch_image_url,
        branch_image_path: data.branch_image_path,
        group_id: data.group_id,
        group_code: data.branch_groups?.group_code || "",
        group_name: data.branch_groups?.group_name || "",
        group_color: data.branch_groups?.group_color || "",
      },
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มสังกัดสำเร็จ",
      data: {
        id: data.id,
        branch_code: data.branch_code,
        branch_name: data.branch_name,
        company_id: data.company_id,
        company_name:
          data.companies?.company_name_th ||
          data.companies?.company_name_en ||
          "-",
        company_code: data.companies?.company_code || "",
        phone: data.phone,
        status: data.status,
        sort_order: data.sort_order,
        branch_image_url: data.branch_image_url || "",
        branch_image_path: data.branch_image_path || "",
        created_at: data.created_at,
        group_id: data.group_id || "",
        group_code: data.branch_groups?.group_code || "",
        group_name: data.branch_groups?.group_name || "",
        group_color: data.branch_groups?.group_color || "#E2E8F0",
      },
    });
  } catch (error) {
    console.error("CREATE_BRANCH_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถบันทึกข้อมูลสังกัดได้" },
      { status: 500 }
    );
  }
}