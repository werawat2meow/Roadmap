import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function getCurrentUser() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("employee_token")?.value;

  if (!token) return null;

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "dev-secret-key"
  );

  const userId = decoded?.user_id;

  if (!userId) return null;

  const { data, error } = await supabaseAdmin
    .from("user_accounts")
    .select(`
      id,
      employee_id,
      role_id,
      username,
      is_active,
      roles (
        id,
        role_code,
        role_name
      )
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || !data.is_active) {
    return null;
  }

  let permissions = [];

  if (data.role_id) {
    const {
      data: permissionRows,
      error: permissionError,
    } = await supabaseAdmin
      .from("role_permissions")
      .select(`
        permission_id,
        permissions (
          id,
          permission_code,
          permission_name,
          module_code,
          action_code,
          is_active
        )
      `)
      .eq("role_id", data.role_id);

    if (!permissionError) {
      permissions =
        permissionRows
          ?.map((row) => row.permissions)
          ?.filter((perm) => perm?.is_active)
          ?.map((perm) => perm.permission_code) || [];
    }
  }

  return {
    ...data,
    permissions,
  };
}

function hasPermission(user, permission) {
  const roleCode =
    user?.roles?.role_code ||
    user?.role_code;

  if (roleCode === "SUPER_ADMIN") {
    return true;
  }

  return (
    user?.permissions?.includes(permission) ||
    false
  );
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (
      !hasPermission(
        user,
        "benefit.master.view"
      ) &&
      !hasPermission(
        user,
        "benefit.master.manage"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่มีสิทธิ์ดูข้อมูลสวัสดิการ",
        },
        { status: 403 }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("benefits")
        .select(`
          id,
          category_id,
          benefit_code,
          benefit_name,
          description,
          benefit_type,
          active_period,
          is_active,
          created_at,
          updated_at,
          benefit_categories (
            id,
            category_code,
            category_name
          )
        `)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "BENEFIT_MASTER_GET_ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const {
      data: categories,
      error: categoryError,
    } = await supabaseAdmin
      .from("benefit_categories")
      .select(`
        id,
        category_code,
        category_name
      `)
      .eq("is_active", true)
      .order("category_name", {
        ascending: true,
      });

    if (categoryError) {
      console.error(
        "BENEFIT_CATEGORY_ERROR:",
        categoryError
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      categories: categories || [],
    });
  } catch (error) {
    console.error(
      "BENEFIT_MASTER_GET_FATAL:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "โหลดข้อมูลสวัสดิการไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (
      !hasPermission(
        user,
        "benefit.master.create"
      ) &&
      !hasPermission(
        user,
        "benefit.master.manage"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่มีสิทธิ์เพิ่มสวัสดิการ",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const payload = {
      category_id:
        body.category_id || null,

      benefit_code:
        body.benefit_code,

      benefit_name:
        body.benefit_name,

      description:
        body.description || null,

      benefit_type:
        body.benefit_type || null,

      active_period:
        body.active_period || null,

      is_active:
        body.is_active ?? true,

      updated_at:
        new Date().toISOString(),
    };

    const { data, error } =
      await supabaseAdmin
        .from("benefits")
        .insert(payload)
        .select()
        .single();

    if (error) {
      console.error(
        "BENEFIT_MASTER_POST_ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "BENEFIT_MASTER_POST_FATAL:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "เพิ่มสวัสดิการไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (
      !hasPermission(
        user,
        "benefit.master.update"
      ) &&
      !hasPermission(
        user,
        "benefit.master.manage"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่มีสิทธิ์แก้ไขสวัสดิการ",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ id สวัสดิการ",
        },
        { status: 400 }
      );
    }

    const payload = {
      category_id:
        body.category_id || null,

      benefit_code:
        body.benefit_code,

      benefit_name:
        body.benefit_name,

      description:
        body.description || null,

      benefit_type:
        body.benefit_type || null,

      active_period:
        body.active_period || null,

      is_active:
        body.is_active ?? true,

      updated_at:
        new Date().toISOString(),
    };

    const { data, error } =
      await supabaseAdmin
        .from("benefits")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();

    if (error) {
      console.error(
        "BENEFIT_MASTER_PUT_ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "BENEFIT_MASTER_PUT_FATAL:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "แก้ไขสวัสดิการไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (
      !hasPermission(
        user,
        "benefit.master.delete"
      ) &&
      !hasPermission(
        user,
        "benefit.master.manage"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่มีสิทธิ์ลบสวัสดิการ",
        },
        { status: 403 }
      );
    }

    const { searchParams } =
      new URL(req.url);

    const id =
      searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ id สวัสดิการ",
        },
        { status: 400 }
      );
    }

    const { error } =
      await supabaseAdmin
        .from("benefits")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "BENEFIT_MASTER_DELETE_ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "BENEFIT_MASTER_DELETE_FATAL:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "ลบสวัสดิการไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}