"use client";

import Swal from "sweetalert2";


export function swalSuccess(
  title = "สำเร็จ",
  text = ""
) {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer: 1800,
    showConfirmButton: false,
  });
}



export function swalError(
  title = "เกิดข้อผิดพลาด",
  text = ""
) {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "ตกลง",
  });
}


export function swalWarning(
  title = "แจ้งเตือน",
  text = ""
) {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonText: "ตกลง",
  });
}


export function swalInfo(
  title = "ข้อมูล",
  text = ""
) {
  return Swal.fire({
    icon: "info",
    title,
    text,
    confirmButtonText: "ตกลง",
  });
}


export function swalConfirm({
  title = "ยืนยันรายการ",
  text = "",
  confirmButtonText = "ยืนยัน",
  cancelButtonText = "ยกเลิก",
  icon = "warning",
} = {}) {
  return Swal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: "#1677ff",
    cancelButtonColor: "#d9d9d9",
  });
}


export function swalLoading(
  title = "กำลังดำเนินการ..."
) {
  Swal.fire({
    title,
    allowEscapeKey: false,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}



export function swalClose() {
  Swal.close();
}