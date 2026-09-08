import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const isUuid = (value: string) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    value,
  );

export async function GET(req: Request) {
  const url = new URL(req.url);
  const employeeId = url.searchParams.get("employeeId");
  const year = url.searchParams.get("year");

  if (!employeeId) {
    return NextResponse.json(
      { success: false, error: "Missing employeeId query parameter" },
      { status: 400 },
    );
  }

  let query = supabaseAdmin
    .from("rm_evaluations")
    .select(
      `id,status,created_at,totalScore,companyScore,departmentScore,expectationScore,examScore,maxScore,managerComment,evaluation_type_id,extra_data,currentSalary,newSalary,evaluation_period,evaluation_period_continued,special_compensation,new_designation,new_level,rm_evaluation_types(name),rm_evaluation_scores(category_item_id,score,remark,is_included),rm_evaluation_reviewers(manager_id,status)`,
    )
    .eq("employee_id", employeeId);

  if (year) {
    query = query
      .gte("created_at", `${year}-01-01T00:00:00.000Z`)
      .lt("created_at", `${Number(year) + 1}-01-01T00:00:00.000Z`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

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

const computeGrade = (percentage: number) => {
  if (percentage >= 85) return "A";
  if (percentage >= 75) return "B";
  if (percentage >= 65) return "C";
  if (percentage >= 50) return "D";
  return "F";
};

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

  const isManagerSubmitting = body.status === "Submitted";
  // ถ้ากด Submit ให้เป็น In_Review ไว้ก่อน จนกว่าจะตรวจพบว่าทุกคนกดครบแล้ว
  const targetStatus = isManagerSubmitting ? "In_Review" : body.status;

  const evaluationId = body.evaluationId?.trim();

  let existingReviewerSubmissions: Record<string, any> = {};
  if (evaluationId) {
    const { data: existingEval } = await supabaseAdmin
      .from("rm_evaluations")
      .select("extra_data")
      .eq("id", evaluationId)
      .maybeSingle();
    if (existingEval?.extra_data?.reviewer_submissions) {
      existingReviewerSubmissions =
        existingEval.extra_data.reviewer_submissions;
    }
  }

  // ถ้าผู้ประเมินคนนี้กด Submit ให้บันทึกคะแนนจริงของคนนี้ไว้ (รวม Company + Department + Expectations ครบ)
  if (isManagerSubmitting) {
    existingReviewerSubmissions[evaluatorId] = {
      totalScore: Number(body.totalScore ?? 0),
      companyScore: Number(body.companyScore ?? 0),
      departmentScore: Number(body.departmentScore ?? 0),
      expectationScore: Number(body.expectationScore ?? 0),
      maxScore: Number(body.maxScore ?? 160),
      comment: body.managerComment || "",
      submittedAt: new Date().toISOString(),
    };
  }

  const mergedExtraData = {
    ...(body.extra_data || {}),
    reviewer_submissions: existingReviewerSubmissions,
  };

  const evalPayload = {
    employee_id: body.employeeId,
    evaluator_id: body.evaluatorId,
    evaluation_type_id: evaluationTypeId,
    status: targetStatus,
    companyScore: body.companyScore ?? null,
    departmentScore: body.departmentScore ?? null,
    expectationScore: body.expectationScore ?? null,
    totalScore: body.totalScore ?? null,
    currentSalary: body.currentSalary ?? null,
    newSalary: body.newSalary ?? null,
    managerComment: body.managerComment ?? null,
    examScore: body.examScore ?? null,
    maxScore: body.maxScore ?? null,
    extra_data: mergedExtraData, // 👈 ใช้ mergedExtraData ที่จำคะแนนของผู้ประเมินแต่ละคน
    evaluation_period: body.evaluationPeriod ?? null,
    evaluation_period_continued: body.evaluationPeriodContinued ?? null,
    special_compensation: body.specialCompensation ?? null,
    new_designation: body.newDesignation ?? null,
    new_level: body.newLevel ?? null,
  };

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

  // 1. เพิ่มผู้ประเมิน: ทำเฉพาะตอนสร้างใหม่ หรือเมื่อมีการส่ง managerIds มาตอนสร้าง
  if (
    !evaluationId &&
    Array.isArray(body.managerIds) &&
    body.managerIds.length > 0
  ) {
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

  // 2. บันทึกคะแนนแยกรายบุคคลของผู้ประเมินคนนี้ลง rm_evaluation_reviewer_scores
  if (evaluatorId && Array.isArray(body.scores) && body.scores.length > 0) {
    const { data: currentReviewer } = await supabaseAdmin
      .from("rm_evaluation_reviewers")
      .select("id")
      .eq("evaluation_id", evalData.id)
      .eq("manager_id", evaluatorId)
      .maybeSingle();

    if (currentReviewer?.id) {
      await supabaseAdmin
        .from("rm_evaluation_reviewers")
        .update({
          status: isManagerSubmitting ? "Submitted" : "Draft",
          completedAt: isManagerSubmitting ? new Date().toISOString() : null,
          comment: body.managerComment || null,
        })
        .eq("id", currentReviewer.id);

      await supabaseAdmin
        .from("rm_evaluation_reviewer_scores")
        .delete()
        .eq("reviewer_id", currentReviewer.id);

      const reviewerScoreRows = body.scores.map((s: any) => {
        const maxAllowed = Number(s.max ?? s.weight ?? 0);
        const rawScore = Number(s.score ?? 0);
        const clamped =
          maxAllowed > 0 ? Math.min(rawScore, maxAllowed) : rawScore;
        return {
          reviewer_id: currentReviewer.id,
          category_item_id: s.categoryItemId,
          score: Math.round(clamped), // หรือ keep decimals if schema allows
          remark: s.remark ?? null,
        };
      });

      const { error: reviewerScoreError } = await supabaseAdmin
        .from("rm_evaluation_reviewer_scores")
        .insert(reviewerScoreRows);

      if (reviewerScoreError) {
        console.error(
          "rm_evaluation_reviewer_scores insert failed",
          reviewerScoreError,
        );
      }
    }
  }

  // 3. ตรวจสอบว่ามี Reviewers ทั้งหมดกี่คน และกด Submit ครบหรือยัง
  const { data: allReviewers } = await supabaseAdmin
    .from("rm_evaluation_reviewers")
    .select("id, manager_id, status")
    .eq("evaluation_id", evalData.id);

  const totalReviewers = allReviewers?.length || 0;
  const submittedCount =
    allReviewers?.filter((r) => r.status === "Submitted").length || 0;
  const isAllCompleted =
    totalReviewers === 0 ||
    (totalReviewers > 0 && submittedCount === totalReviewers);

  // 4. กรณีครบทุกคนแล้ว และผู้ประเมินกด Submit: นำคะแนนมารวมแล้วหาค่าเฉลี่ย
  // 4. กรณีครบทุกคนแล้ว และผู้ประเมินกด Submit: นำคะแนนมารวมแล้วหาค่าเฉลี่ย
  if (isAllCompleted && isManagerSubmitting) {
    const reviewerIds = (allReviewers || []).map((r) => r.id);
    const { data: allScores } = await supabaseAdmin
      .from("rm_evaluation_reviewer_scores")
      .select("reviewer_id, category_item_id, score, remark")
      .in("reviewer_id", reviewerIds);

    // คำนวณเฉลี่ยรายข้อสำหรับตาราง rm_evaluation_scores
    const itemMap = new Map<
      string,
      { totalScore: number; count: number; remark: string }
    >();
    (allScores || []).forEach((row: any) => {
      const prev = itemMap.get(row.category_item_id) || {
        totalScore: 0,
        count: 0,
        remark: "",
      };
      itemMap.set(row.category_item_id, {
        totalScore: prev.totalScore + Number(row.score || 0),
        count: prev.count + 1,
        remark: prev.remark
          ? `${prev.remark}; ${row.remark || ""}`
          : row.remark || "",
      });
    });

    const divisor = totalReviewers > 0 ? totalReviewers : 1;
    const finalScoresPayload: any[] = [];
    itemMap.forEach((val, itemId) => {
      const avgScore = val.totalScore / divisor;
      finalScoresPayload.push({
        evaluation_id: evalData.id,
        category_item_id: itemId,
        score: Number(avgScore.toFixed(2)),
        remark: val.remark || null,
        is_included: true,
      });
    });

    await supabaseAdmin
      .from("rm_evaluation_scores")
      .delete()
      .eq("evaluation_id", evalData.id);

    if (finalScoresPayload.length > 0) {
      await supabaseAdmin
        .from("rm_evaluation_scores")
        .insert(finalScoresPayload);
    }

    // ⭐️ คำนวณผลรวมตามโจทย์ลูกค้า: นำคะแนนรวมที่ได้ของผู้ประเมินทุกคนมาบวกกัน แล้วหารตามจำนวนผู้ประเมิน
    let finalTotalScore = Number(body.totalScore ?? 0);
    let finalCompanyScore = Number(body.companyScore ?? 0);
    let finalDepartmentScore = Number(body.departmentScore ?? 0);
    let finalExpectationScore = Number(body.expectationScore ?? 0);
    const summaryMaxScore = Number(body.maxScore) || 160;

    if (totalReviewers > 1) {
      const submissions = (allReviewers || [])
        .map((rev) => existingReviewerSubmissions[rev.manager_id])
        .filter(Boolean);

      const count =
        submissions.length > 0 ? submissions.length : totalReviewers;
      const sumTotal = submissions.reduce(
        (acc, s) => acc + Number(s.totalScore || 0),
        0,
      );
      const sumCompany = submissions.reduce(
        (acc, s) => acc + Number(s.companyScore || 0),
        0,
      );
      const sumDept = submissions.reduce(
        (acc, s) => acc + Number(s.departmentScore || 0),
        0,
      );
      const sumExp = submissions.reduce(
        (acc, s) => acc + Number(s.expectationScore || 0),
        0,
      );

      // คะแนนที่ได้บวกกัน แล้วหาร 2 (หรือหารจำนวนผู้ประเมิน)
      finalTotalScore = sumTotal / count;
      finalCompanyScore = Math.round((sumCompany / count) * 100) / 100;
      finalDepartmentScore = Math.round((sumDept / count) * 100) / 100;
      finalExpectationScore = Math.round((sumExp / count) * 100) / 100;
    }

    // คิดเป็นเปอร์เซ็นต์: (คะแนนที่ได้หารสอง / คะแนนเต็ม) * 100
    const percentage =
      summaryMaxScore > 0
        ? Math.round((finalTotalScore / summaryMaxScore) * 100 * 100) / 100
        : 0;

    const finalGrade = computeGrade(percentage);

    const { data: finalizedEval } = await supabaseAdmin
      .from("rm_evaluations")
      .update({
        status: "Submitted",
        companyScore: finalCompanyScore,
        departmentScore: finalDepartmentScore,
        expectationScore: finalExpectationScore,
        totalScore: finalTotalScore,
        maxScore: summaryMaxScore,
        grade: finalGrade,
        completedAt: new Date().toISOString(),
      })
      .eq("id", evalData.id)
      .select()
      .single();

    return NextResponse.json(
      {
        success: true,
        data: finalizedEval,
        isFullyCompleted: true,
        message:
          "ประเมินครบทุกคนแล้ว รวมคะแนนเฉลี่ยและส่งไปยัง Management เรียบร้อยแล้ว",
      },
      { status: 200 },
    );
  }

  // 5. ถ้ายังประเมินไม่ครบ (เช่น 1/2 คน) หรือเป็นการ Save Draft
  return NextResponse.json(
    {
      success: true,
      data: evalData,
      isFullyCompleted: false,
      submittedCount,
      totalReviewers,
      message: isManagerSubmitting
        ? `บันทึกคะแนนของคุณเรียบร้อยแล้ว (รอผู้ประเมินท่านอื่น ${submittedCount}/${totalReviewers})`
        : "บันทึกแบบร่างเรียบร้อยแล้ว",
    },
    { status: 201 },
  );
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const evaluationId = url.searchParams.get("id");

  if (!evaluationId) {
    return NextResponse.json(
      { success: false, error: "Missing id" },
      { status: 400 },
    );
  }

  await supabaseAdmin
    .from("rm_evaluation_reviewers")
    .delete()
    .eq("evaluation_id", evaluationId);
  await supabaseAdmin
    .from("rm_evaluation_scores")
    .delete()
    .eq("evaluation_id", evaluationId);

  const { error } = await supabaseAdmin
    .from("rm_evaluations")
    .delete()
    .eq("id", evaluationId);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true });
}
