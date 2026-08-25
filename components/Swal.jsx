"use client";

import Swal from "sweetalert2";

/* =========================================================
   Success
========================================================= */

export async function swalSuccess(
  title = "สำเร็จ",
  text = ""
) {
  const result = await Swal.fire({
    icon: "success",
    title,
    text,
    timer: 1800,
    showConfirmButton: false,
  });

  return result;
}

/* =========================================================
   Error
========================================================= */

export async function swalError(
  title = "เกิดข้อผิดพลาด",
  text = ""
) {
  const result = await Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "ตกลง",
  });

  return result;
}

/* =========================================================
   Warning
========================================================= */

export async function swalWarning(
  title = "แจ้งเตือน",
  text = ""
) {
  const result = await Swal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonText: "ตกลง",
  });

  return result;
}

/* =========================================================
   Info
========================================================= */

export async function swalInfo(
  title = "ข้อมูล",
  text = ""
) {
  const result = await Swal.fire({
    icon: "info",
    title,
    text,
    confirmButtonText: "ตกลง",
  });

  return result;
}

/* =========================================================
   Confirm
========================================================= */

export async function swalConfirm({
  title = "ยืนยันรายการ",
  text = "",
  confirmButtonText = "ยืนยัน",
  cancelButtonText = "ยกเลิก",
  icon = "warning",
} = {}) {
  const result = await Swal.fire({
    icon,
    title,
    text,

    showCancelButton: true,
    reverseButtons: true,

    confirmButtonText,
    cancelButtonText,

    confirmButtonColor: "#1677ff",
    cancelButtonColor: "#d9d9d9",

    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  return result.isConfirmed === true;
}

/* =========================================================
   Loading
========================================================= */

export async function swalLoading(
  title = "กำลังดำเนินการ..."
) {
  return Swal.fire({
    title,
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,

    didOpen: () => {
      Swal.showLoading();
    },
  });
}

/* =========================================================
   Close
========================================================= */

export async function swalClose() {
  Swal.close();
}