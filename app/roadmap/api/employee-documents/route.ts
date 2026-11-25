import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { uploadFileToSpaces, deleteFileFromSpaces } from "@/lib/spaces";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Missing employeeId" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("employee_documents")
      .select(
        "id, employee_id, document_type, original_filename, file_url, mime_type, file_size, status, created_at",
      )
      .eq("employee_id", employeeId)
      .eq("document_type", "OUTSIDE_EMPLOYMENT")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to load employee documents",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const employeeId = String(formData.get("employeeId") || "");
    const uploadedByValue = String(formData.get("uploadedBy") || "");
    const file = formData.get("file");

    if (!employeeId || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Missing employeeId or PDF file" },
        { status: 400 },
      );
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
        { status: 400 },
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "PDF file must not exceed 20 MB" },
        { status: 400 },
      );
    }

    const uploaded = await uploadFileToSpaces(
      file,
      `employee-documents/${employeeId}`,
      undefined,
      { metadata: { documentType: "OUTSIDE_EMPLOYMENT", employeeId } },
    );

    const { data, error } = await supabaseAdmin
      .from("employee_documents")
      .insert({
        employee_id: employeeId,
        document_type: "OUTSIDE_EMPLOYMENT",
        original_filename: file.name,
        storage_path: uploaded.key,
        file_url: uploaded.url,
        mime_type: file.type || "application/pdf",
        file_size: file.size,
        status: "IMPORTED",
        uploaded_by: uploadedByValue || null,
      })
      .select()
      .single();

    if (error) {
      await deleteFileFromSpaces(uploaded.key);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to import document" },
      { status: 500 },
    );
  }
}
