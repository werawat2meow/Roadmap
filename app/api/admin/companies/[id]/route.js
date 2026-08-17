<<<<<<< HEAD
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
=======
import {NextResponse,} from "next/server";
import {supabaseAdmin,} from "@/lib/supabaseServer";
import {writeActivityLog,} from "@/lib/activityLogger";
>>>>>>> test_merge_all


import {requirePermission,} from "@/lib/auth/requirePortalAccess";
import {canAccessCompany,} from "@/lib/auth/applyAccessScope";

/* =========================================================
   PATCH /api/admin/companies/[id]

   Permission:
   ems.companies.edit

   Scope:
   company.id ต้องอยู่ใน allowed_company_ids
   หรือเป็น ALL / SUPER_ADMIN
========================================================= */

export async function PATCH(req,{ params }) {
  try {

<<<<<<< HEAD
    const company_code = body?.company_code?.trim();
    const company_name_th = body?.company_name_th?.trim();
    const company_name_en = body?.company_name_en?.trim() || null;

    const tax_id = body?.tax_id?.trim() || null;
    const branch_no = body?.branch_no?.trim() || null;

    const address = body?.address?.trim() || null;

    const country_code = body?.country_code?.trim() || "TH";

    const province_code = body?.province_code?.trim() || null;
    const province = body?.province?.trim() || null;

    const district_code = body?.district_code?.trim() || null;
    const district = body?.district?.trim() || null;

    const subdistrict_code = body?.subdistrict_code?.trim() || null;
    const subdistrict = body?.subdistrict?.trim() || null;

    const postcode = body?.postcode?.trim() || null;

    const phone = body?.phone?.trim() || null;
    const email = body?.email?.trim() || null;
    const website = body?.website?.trim() || null;

    const logo_url = body?.logo_url?.trim() || null;
    const logo_path = body?.logo_path?.trim() || null;

    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0);

    if (!company_code || !company_name_th) {
      return NextResponse.json(
        {
          error: "กรุณากรอกรหัสบริษัทและชื่อบริษัท",
=======
    /* =====================================================
       1. Permission
    ===================================================== */

    const guard = await requirePermission("ems.companies.edit");
    if (!guard.ok) {
      return guard.response;
    }

    /* =====================================================
       2. Params
    ===================================================== */

    const { id } =await params;
    if (!id) {
      return NextResponse.json({
          success: false,
          error:
            "ไม่พบรหัสบริษัท",
>>>>>>> test_merge_all
        },
        {
          status: 400,
        }
      );
    }

<<<<<<< HEAD
    // =========================
    // Old Data
    // =========================

    const { data: oldData } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();

    // =========================
    // Update
    // =========================

    const { data, error } = await supabaseAdmin
      .from("companies")
      .update({
        company_code,
        company_name_th,
        company_name_en,

        tax_id,
        branch_no,

        address,

        country_code,

        province_code,
        province,

        district_code,
        district,

        subdistrict_code,
        subdistrict,

        postcode,

        phone,
        email,
        website,

        logo_url,
        logo_path,

        status,
        sort_order,

        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        id,
        company_code,
        company_name_th,
        company_name_en,

        tax_id,
        branch_no,

        address,

        country_code,

        province_code,
        province,

        district_code,
        district,

        subdistrict_code,
        subdistrict,

        postcode,

        phone,
        email,
        website,

        logo_url,
        logo_path,

        status,
        sort_order,

        created_at,
        updated_at
      `)
      .single();
=======
    /* =====================================================
       3. Load Existing Company

       ใช้สำหรับ:
       - ตรวจว่ามีจริง
       - ตรวจ Scope
       - Activity Log
    ===================================================== */

    const {data: oldData,error: oldError,} =
      await supabaseAdmin
        .from("companies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (oldError) {
      throw oldError;
    }

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบข้อมูลบริษัท",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       4. Scope

       Permission edit ผ่านแล้ว
       แต่ต้องมีสิทธิ์ใน Company นี้ด้วย
    ===================================================== */

    if (!canAccessCompany(guard.access,oldData.id)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "คุณไม่มีสิทธิ์แก้ไขบริษัทนี้",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       5. Body
    ===================================================== */

    const body =await req.json();
    const company_code =
      body?.company_code
        ?.trim();

    const company_name_th =
      body?.company_name_th
        ?.trim();

    const company_name_en =
      body?.company_name_en
        ?.trim() ||
      null;

    const tax_id =
      body?.tax_id
        ?.trim() ||
      null;

    const branch_no =
      body?.branch_no
        ?.trim() ||
      null;

    const address =
      body?.address
        ?.trim() ||
      null;

    const country_code =
      body?.country_code
        ?.trim() ||
      "TH";

    const province_code =
      body?.province_code
        ?.trim() ||
      null;

    const province =
      body?.province
        ?.trim() ||
      null;

    const district_code =
      body?.district_code
        ?.trim() ||
      null;

    const district =
      body?.district
        ?.trim() ||
      null;

    const subdistrict_code =
      body?.subdistrict_code
        ?.trim() ||
      null;

    const subdistrict =
      body?.subdistrict
        ?.trim() ||
      null;

    const postcode =
      body?.postcode
        ?.trim() ||
      null;

    const phone =
      body?.phone
        ?.trim() ||
      null;

    const email =
      body?.email
        ?.trim() ||
      null;

    const website =
      body?.website
        ?.trim() ||
      null;

    const logo_url =
      body?.logo_url
        ?.trim() ||
      null;

    const logo_path =
      body?.logo_path
        ?.trim() ||
      null;

    const status =
      body?.status ||
      "active";

    const sort_order =
      Number(
        body?.sort_order ||
          0
      );

    /* =====================================================
       6. Validate
    ===================================================== */

    if (!company_code || !company_name_th) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสบริษัทและชื่อบริษัท",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       7. Update
    ===================================================== */

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("companies")
        .update({
          company_code,
          company_name_th,
          company_name_en,

          tax_id,
          branch_no,

          address,

          country_code,

          province_code,
          province,

          district_code,
          district,

          subdistrict_code,
          subdistrict,

          postcode,

          phone,
          email,
          website,

          logo_url,
          logo_path,

          status,
          sort_order,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq("id", id)
        .select(`
          id,
          company_code,
          company_name_th,
          company_name_en,

          tax_id,
          branch_no,

          address,

          country_code,

          province_code,
          province,

          district_code,
          district,

          subdistrict_code,
          subdistrict,

          postcode,

          phone,
          email,
          website,

          logo_url,
          logo_path,

          status,
          sort_order,

          created_at,
          updated_at
        `)
        .single();

    /* =====================================================
       8. DB Error
    ===================================================== */
>>>>>>> test_merge_all

    if (error) {
      if (
        error.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
<<<<<<< HEAD
            error: "รหัสบริษัทนี้มีอยู่แล้ว",
=======
            success: false,
            error:
              "รหัสบริษัทนี้มีอยู่แล้ว",
>>>>>>> test_merge_all
          },
          {
            status: 400,
          }
        );
      }

      throw error;
    }

<<<<<<< HEAD
    // =========================
    // Activity Log
    // =========================

    await writeActivityLog({
      module_name: "companies",
      action_type: "update",
      reference_table: "companies",
      reference_id: data.id,
      description: `แก้ไขบริษัท ${data.company_code} - ${data.company_name_th}`,
      old_data: oldData,
      new_data: data,
    });

=======
    /* =====================================================
       9. Activity Log
    ===================================================== */

    await writeActivityLog({
      module_name:
        "companies",

      action_type:
        "update",

      reference_table:
        "companies",

      reference_id:
        data.id,

      description:
        `แก้ไขบริษัท ${data.company_code} - ${data.company_name_th}`,

      old_data:
        oldData,

      new_data:
        data,
    });

    /* =====================================================
       10. Response
    ===================================================== */

>>>>>>> test_merge_all
    return NextResponse.json({
      success: true,

      message:
        "แก้ไขข้อมูลบริษัทสำเร็จ",

      data,
    });

  } catch (error) {
    console.error(
      "UPDATE_COMPANY_ERROR:",
      error
    );

    return NextResponse.json(
      {
<<<<<<< HEAD
        error: "ไม่สามารถแก้ไขข้อมูลบริษัทได้",
=======
        success: false,
        error:
          "ไม่สามารถแก้ไขข้อมูลบริษัทได้",
>>>>>>> test_merge_all
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE /api/admin/companies/[id]

   Permission:
   ems.companies.delete

   Scope:
   company.id ต้องอยู่ใน allowed_company_ids
   หรือ ALL / SUPER_ADMIN
========================================================= */

export async function DELETE(
  req,
  { params }
) {
  try {
    /* =====================================================
       1. Permission
    ===================================================== */

<<<<<<< HEAD
    // =========================
    // Check Branch
    // =========================

    const { data: usedBranches, error: checkError } = await supabaseAdmin
      .from("branches")
      .select("id")
      .eq("company_id", id)
      .limit(1);
=======
    const guard =
      await requirePermission(
        "ems.companies.delete"
      );
>>>>>>> test_merge_all

    if (!guard.ok) {
      return guard.response;
    }

<<<<<<< HEAD
    if (usedBranches?.length > 0) {
      return NextResponse.json(
        {
          error: "ไม่สามารถลบบริษัทได้ เพราะมีสาขาที่อ้างอิงบริษัทนี้อยู่",
=======
    /* =====================================================
       2. Params
    ===================================================== */

    const { id } =
      await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบรหัสบริษัท",
>>>>>>> test_merge_all
        },
        {
          status: 400,
        }
      );
    }

<<<<<<< HEAD
    // =========================
    // Old Data
    // =========================

    const { data: oldData } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();

    // =========================
    // Delete
    // =========================

    const { error } = await supabaseAdmin
      .from("companies")
      .delete()
      .eq("id", id);
=======
    /* =====================================================
       3. Load Existing Company
>>>>>>> test_merge_all

       ต้องโหลดก่อนเช็ค Branch
       เพราะเราต้องตรวจ Scope ก่อน
    ===================================================== */

    const {
      data: oldData,
      error: oldError,
    } =
      await supabaseAdmin
        .from("companies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (oldError) {
      throw oldError;
    }

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบข้อมูลบริษัท",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       4. Scope
    ===================================================== */

    if (
      !canAccessCompany(
        guard.access,
        oldData.id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "คุณไม่มีสิทธิ์ลบบริษัทนี้",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       5. Check References

       ห้ามลบ Company ที่มี Branch
    ===================================================== */

    const {
      data:
        usedBranches,

      error:
        checkError,
    } =
      await supabaseAdmin
        .from("branches")
        .select("id")
        .eq(
          "company_id",
          id
        )
        .limit(1);

    if (checkError) {
      throw checkError;
    }

    if (
      usedBranches?.length >
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "ไม่สามารถลบบริษัทได้ เพราะมีสาขาที่อ้างอิงบริษัทนี้อยู่",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       6. Delete
    ===================================================== */

    const {
      error,
    } =
      await supabaseAdmin
        .from("companies")
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {
      throw error;
    }

    /* =====================================================
       7. Activity Log
    ===================================================== */

    await writeActivityLog({
      module_name:
        "companies",

      action_type:
        "delete",

      reference_table:
        "companies",

      reference_id:
        id,

      description:
        `ลบบริษัท ${oldData.company_code} - ${oldData.company_name_th}`,

      old_data:
        oldData,
    });

    /* =====================================================
       8. Response
    ===================================================== */

    // =========================
    // Activity Log
    // =========================

    await writeActivityLog({
      module_name: "companies",
      action_type: "delete",
      reference_table: "companies",
      reference_id: id,
      description: `ลบบริษัท ${oldData?.company_code} - ${oldData?.company_name_th}`,
      old_data: oldData,
    });

    return NextResponse.json({
      success: true,

      message:
        "ลบข้อมูลบริษัทสำเร็จ",
    });

  } catch (error) {
    console.error(
      "DELETE_COMPANY_ERROR:",
      error
    );

    return NextResponse.json(
      {
<<<<<<< HEAD
        error: "ไม่สามารถลบข้อมูลบริษัทได้",
=======
        success: false,

        error:
          "ไม่สามารถลบข้อมูลบริษัทได้",
>>>>>>> test_merge_all
      },
      {
        status: 500,
      }
    );
  }
}