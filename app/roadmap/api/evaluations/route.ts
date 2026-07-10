import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const isUuid = (value: string) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    value,
  );
export async function GET(req: Request) {
  const url = new URL(req.url);
  const employeeId = url.searchParams.get("employeeId");

  if (!employeeId) {
    return NextResponse.json(
      { success: false, error: "Missing employeeId query parameter" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("rm_evaluations")
    .select(
      `id,status,created_at,totalScore,companyScore,departmentScore,expectationScore,examScore,maxScore,managerComment,evaluation_type_id,extra_data,rm_evaluation_types(name),rm_evaluation_scores(category_item_id,score,remark,is_included),rm_evaluation_reviewers(manager_id)`,
    )
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load evaluation history", error, employeeId);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  const records = (data ?? []).map((item: any) => ({
    ...item,
    evaluationType: item.rm_evaluation_types?.name ?? null,
  }));

  return NextResponse.json({ success: true, data: records });
}
async function resolveEvaluationTypeId(value?: string) {
  if (!value) return null;
  if (isUuid(value)) return value;

  const normalizedCode = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const { data: existingTypes, error: typeError } = await supabaseAdmin
    .from("rm_evaluation_types")
    .select("id")
    .or(`name.eq.${value},code.eq.${normalizedCode}`)
    .limit(1);

  if (typeError) {
    throw typeError;
  }

  if (existingTypes?.[0]?.id) {
    return existingTypes[0].id;
  }

  const { data: insertedType, error: insertTypeError } = await supabaseAdmin
    .from("rm_evaluation_types")
    .insert([{ name: value, code: normalizedCode }])
    .select()
    .single();

  if (insertTypeError) {
    throw insertTypeError;
  }

  return insertedType?.id;
}

export async function POST(req: Request) {
  const body = await req.json();
  const evaluatorId = body.evaluatorId;
  const employeeId = body.employeeId;
  const status = body.status;
  const requestedTypeId = body.evaluationTypeId;
  const requestedTypeName = body.evaluationType;

  if (
    !employeeId ||
    !evaluatorId ||
    !status ||
    (!requestedTypeId && !requestedTypeName)
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Missing required fields (employeeId, evaluatorId, evaluationTypeId or evaluationType, status)",
      },
      { status: 400 },
    );
  }

  let evaluationTypeId = requestedTypeId || null;
  if (!evaluationTypeId) {
    try {
      evaluationTypeId = await resolveEvaluationTypeId(requestedTypeName);
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error?.message || "Failed to resolve evaluation type",
        },
        { status: 500 },
      );
    }
  }

  if (!evaluationTypeId) {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to determine evaluation type ID",
      },
      { status: 400 },
    );
  }

  const evalPayload = {
    employee_id: body.employeeId,
    evaluator_id: body.evaluatorId,
    evaluation_type_id: evaluationTypeId,
    status: body.status,
    companyScore: body.companyScore ?? null,
    departmentScore: body.departmentScore ?? null,
    expectationScore: body.expectationScore ?? null,
    totalScore: body.totalScore ?? null,
    currentSalary: body.currentSalary ?? null,
    newSalary: body.newSalary ?? null,
    managerComment: body.managerComment ?? null,
    examScore: body.examScore ?? null,
    maxScore: body.maxScore ?? null,
    extra_data: body.extra_data ?? null,
  };

  const evaluationId = body.evaluationId?.trim();
  let evalData: any = null;
  let evalError: any = null;

  if (evaluationId) {
    const updateResult = await supabaseAdmin
      .from("rm_evaluations")
      .update(evalPayload)
      .eq("id", evaluationId)
      .select()
      .single();

    evalData = updateResult.data;
    evalError = updateResult.error;
  } else {
    const insertResult = await supabaseAdmin
      .from("rm_evaluations")
      .insert([evalPayload])
      .select()
      .single();

    evalData = insertResult.data;
    evalError = insertResult.error;
  }

  if (evalError || !evalData) {
    console.error("rm_evaluations save failed", evalError, body);
    return NextResponse.json(
      {
        success: false,
        error: evalError?.message ?? "Failed to save evaluation",
      },
      { status: 500 },
    );
  }

  if (Array.isArray(body.managerIds) && body.managerIds.length > 0) {
    // Bug fix: delete existing reviewers before re-inserting to avoid duplicates
    if (evaluationId) {
      await supabaseAdmin
        .from("rm_evaluation_reviewers")
        .delete()
        .eq("evaluation_id", evaluationId);
    }

    const reviewerPayload = body.managerIds.map((managerId: string) => ({
      evaluation_id: evalData.id,
      manager_id: managerId,
      status: "Pending",
    }));

    const { error: reviewerError } = await supabaseAdmin
      .from("rm_evaluation_reviewers")
      .insert(reviewerPayload);

    if (reviewerError) {
      console.error(
        "rm_evaluation_reviewers insert failed",
        reviewerError,
        reviewerPayload,
      );
      return NextResponse.json(
        { success: false, error: reviewerError.message },
        { status: 500 },
      );
    }
  }

  if (Array.isArray(body.scores)) {
    const scorePayload = body.scores.map((score: any) => ({
      evaluation_id: evalData.id,
      category_item_id: score.categoryItemId,
      score: score.score,
      remark: score.remark ?? null,
      is_included: score.isIncluded ?? true,
    }));

    if (evaluationId) {
      const { error: deleteError } = await supabaseAdmin
        .from("rm_evaluation_scores")
        .delete()
        .eq("evaluation_id", evaluationId);

      if (deleteError) {
        console.error(
          "rm_evaluation_scores delete failed",
          deleteError,
          evaluationId,
        );
        return NextResponse.json(
          { success: false, error: deleteError.message },
          { status: 500 },
        );
      }
    }

    if (scorePayload.length > 0) {
      const { error: scoreError } = await supabaseAdmin
        .from("rm_evaluation_scores")
        .insert(scorePayload);

      if (scoreError) {
        return NextResponse.json(
          { success: false, error: scoreError.message },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({ success: true, data: evalData }, { status: 201 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const evaluationId = url.searchParams.get("id");

  if (!evaluationId) {
    return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  }

await supabaseAdmin.from("rm_evaluation_reviewers").delete().eq("evaluation_id", evaluationId);
  await supabaseAdmin.from("rm_evaluation_scores").delete().eq("evaluation_id", evaluationId);

  const { error } = await supabaseAdmin.from("rm_evaluations").delete().eq("id", evaluationId);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
