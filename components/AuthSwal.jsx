"use client";

import Swal from "sweetalert2";

const authTheme = {
  background: "#111b29",
  color: "#fff4d6",
  width: 400,
  didOpen: (popup) => {
    popup.style.border = "1px solid rgba(255, 222, 160, .35)";
    popup.style.borderRadius = "24px";
    popup.style.boxShadow = "0 30px 90px rgba(0, 0, 0, .55)";
  },
};

export function authSuccess(title) {
  return Swal.fire({
    ...authTheme,
    icon: "success",
    title,
    timer: 1000,
    showConfirmButton: false,
    iconColor: "#f3c874",
  });
}

export function authError(title, text = "") {
  return Swal.fire({
    ...authTheme,
    icon: "error",
    title,
    text,
    confirmButtonText: "ตกลง",
    confirmButtonColor: "#d6a64f",
  });
}

export async function authLogoutConfirm() {
  const result = await Swal.fire({
    ...authTheme,
    icon: "question",
    iconColor: "#f3c874",
    title: "ออกจากระบบ?",
    text: "คุณต้องการออกจากระบบใช่หรือไม่",
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonText: "ออกจากระบบ",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#d6a64f",
    cancelButtonColor: "#475569",
    allowOutsideClick: false,
  });

  return result.isConfirmed === true;
}
