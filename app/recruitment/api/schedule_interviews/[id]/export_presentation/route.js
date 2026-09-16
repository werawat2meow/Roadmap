// API

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: "ไม่พบ application id",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ---------------------------------------------------------
     * Application
     * ---------------------------------------------------------
     */
    const {
      data: application,
      error: applicationError,
    } = await supabaseAdmin
      .from("recruit_job_applications")
      .select(
        `
          id,
          first_name,
          last_name,
          nickname_th,
          phone_number,
          expected_salary,
          profile_image_url,
          position_id,
          job_id,
          source_branch_id,
          positions (
            id,
            position_name
          )
        `,
      )
      .eq("id", id)
      .eq("status", 5)
      .single();

    if (applicationError) {
      console.error(
        "Get application error:",
        applicationError,
      );

      return NextResponse.json(
        {
          error: applicationError.message,
        },
        {
          status: 500,
        },
      );
    }

    if (!application) {
      return NextResponse.json(
        {
          error: "ไม่พบข้อมูลผู้สมัคร",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * ---------------------------------------------------------
     * Candidate photo
     *
     * 1. profile_image_url
     * 2. recruit_job_documents.photo
     * ---------------------------------------------------------
     */
    let photoUrl = application.profile_image_url || null;

    if (!photoUrl) {
      const {
        data: photoDocument,
        error: photoError,
      } = await supabaseAdmin
        .from("recruit_job_documents")
        .select("file_url")
        .eq("application_id", id)
        .eq("document_type", "photo")
        .not("file_url", "is", null)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (photoError) {
        console.error(
          "Get candidate photo error:",
          photoError,
        );
      }

      photoUrl = photoDocument?.file_url || null;
    }

    /*
     * ---------------------------------------------------------
     * Branch image
     *
     * Priority:
     *
     * 1. application.job_id
     *    -> recruit_job_open.branch_id
     *    -> branches.branch_image_url
     *
     * 2. application.source_branch_id
     *    -> branches.branch_image_url
     *
     * 3. null
     * ---------------------------------------------------------
     */
    let branchImageUrl = null;

    // ---------------------------------------------------------
    // Priority 1: job_id
    // ---------------------------------------------------------
    if (application.job_id) {
      const {
        data: jobOpen,
        error: jobOpenError,
      } = await supabaseAdmin
        .from("recruit_job_open")
        .select("branch_id")
        .eq("id", application.job_id)
        .maybeSingle();

      if (jobOpenError) {
        console.error(
          "Get recruit_job_open error:",
          jobOpenError,
        );
      }

      if (jobOpen?.branch_id) {
        const {
          data: branch,
          error: branchError,
        } = await supabaseAdmin
          .from("branches")
          .select("branch_image_url")
          .eq("id", jobOpen.branch_id)
          .maybeSingle();

        if (branchError) {
          console.error(
            "Get branch image from job_id error:",
            branchError,
          );
        }

        branchImageUrl =
          branch?.branch_image_url || null;
      }
    }

    // ---------------------------------------------------------
    // Priority 2: source_branch_id
    // ---------------------------------------------------------
    if (!branchImageUrl && application.source_branch_id) {
      const {
        data: branch,
        error: branchError,
      } = await supabaseAdmin
        .from("branches")
        .select("branch_image_url")
        .eq("id", application.source_branch_id)
        .maybeSingle();

      if (branchError) {
        console.error(
          "Get branch image from source_branch_id error:",
          branchError,
        );
      }

      branchImageUrl =
        branch?.branch_image_url || null;
    }

    /*
     * ---------------------------------------------------------
     * Interview
     *
     * status = 5
     * = ยืนยันการสัมภาษณ์
     * ---------------------------------------------------------
     */
    const {
      data: interview,
      error: interviewError,
    } = await supabaseAdmin
      .from("recruit_job_interviews")
      .select(
        `
          id,
          interview_datetime,
          location,
          status,
          interview_order,
          created_at
        `,
      )
      .eq("application_id", id)
      .eq("status", 5)
      .order("interview_order", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (interviewError) {
      console.error(
        "Get interview error:",
        interviewError,
      );
    }

    /*
     * ---------------------------------------------------------
     * Create proxy image URL
     *
     * จาก:
     * https://hw1.sgp1.digitaloceanspaces.com/...
     *
     * เป็น:
     * /recruitment/api/image-proxy?url=...
     * ---------------------------------------------------------
     */
    let proxyPhotoUrl = null;

    if (photoUrl) {
      proxyPhotoUrl =
        `/recruitment/api/image-proxy?url=${encodeURIComponent(
          photoUrl,
        )}`;
    }

    /*
     * ---------------------------------------------------------
     * Response
     * ---------------------------------------------------------
     */
    return NextResponse.json({
      id: application.id,
      first_name: application.first_name,
      last_name: application.last_name,
      nickname_th: application.nickname_th,
      phone_number: application.phone_number,
      expected_salary: application.expected_salary,

      profile_image_url:
        application.profile_image_url || null,

      photo_file_url: photoUrl || null,

      // Branch image
      branche_image_url: branchImageUrl,

      // ใช้ตัวนี้ใน Component
      proxy_photo_url: proxyPhotoUrl,

      position_id: application.position_id,

      position_name:
        application.positions?.position_name || null,

      interview_datetime:
        interview?.interview_datetime || null,

      interview_location:
        interview?.location || null,

      interview_status:
        interview?.status ?? null,
    });
  } catch (error) {
    console.error(
      "Export image API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}