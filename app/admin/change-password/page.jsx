"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { swalSuccess, swalError } from "../../components/Swal";
import useAuth from "@/hooks/useAuth";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Avatar from "@mui/material/Avatar";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockResetIcon from "@mui/icons-material/LockReset";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasMinLength = newPassword.length >= 6;

  const passwordsMatch =
    newPassword && confirmPassword && newPassword === confirmPassword;

  const passwordsMismatch = confirmPassword && newPassword !== confirmPassword;

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      swalError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    if (!hasMinLength) {
      swalError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      swalError("ยืนยันรหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      }

      await swalSuccess(
        "เปลี่ยนรหัสผ่านสำเร็จ",
        "กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
      );

      localStorage.removeItem("employee_user");
      setUser(null);

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("CHANGE_PASSWORD_ERROR:", error);
      swalError(error?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const eyeButton = (show, setShow) => (
    <InputAdornment position="end">
      <IconButton
        onClick={() => setShow(!show)}
        edge="end"
        size="small"
        tabIndex={-1}
      >
        {show ? (
          <VisibilityOffIcon sx={{ fontSize: 18, color: "text.disabled" }} />
        ) : (
          <VisibilityIcon sx={{ fontSize: 18, color: "text.disabled" }} />
        )}
      </IconButton>
    </InputAdornment>
  );

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2.5,
      bgcolor: "grey.50",
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: "transparent",
        p: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 520, mx: "auto" }}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 5,
            border: "1px solid",
            borderColor: "grey.200",
            overflow: "hidden",
            mb: 3,
          }}
        >
          <Box
            sx={{
              height: 6,
              background:
                "linear-gradient(90deg, #0F172A 0%, #1E293B 50%, #334155 100%)",
            }}
          />

          <CardContent sx={{ p: 3.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 3,
                  bgcolor: "#E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <LockResetIcon sx={{ color: "#0F172A", fontSize: 24 }} />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  เปลี่ยนรหัสผ่าน
                </Typography>

                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  ใช้รหัสผ่านเดียวกับ Employee Master
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2.5 }}>
                  <Avatar
                    src={user?.employee_photo_url || undefined}
                    sx={{ width: 54, height: 54 }}
                  />

                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
                      {user?.full_name || user?.username || "-"}
                    </Typography>

                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {user?.role_name || user?.role_code || "User"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            borderRadius: 5,
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <CardContent sx={{ p: 3.5 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary", mb: 1 }}>
                รหัสผ่านเดิม
              </Typography>

              <TextField
                fullWidth
                size="small"
                type={showCurrent ? "text" : "password"}
                placeholder="กรอกรหัสผ่านเดิม"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                      </InputAdornment>
                    ),
                    endAdornment: eyeButton(showCurrent, setShowCurrent),
                  },
                }}
                sx={fieldSx}
              />
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ mb: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary", mb: 1 }}>
                รหัสผ่านใหม่
              </Typography>

              <TextField
                fullWidth
                size="small"
                type={showNew ? "text" : "password"}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                      </InputAdornment>
                    ),
                    endAdornment: eyeButton(showNew, setShowNew),
                  },
                }}
                sx={fieldSx}
              />

              {newPassword && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                  {hasMinLength ? (
                    <CheckCircleIcon sx={{ fontSize: 13, color: "success.main" }} />
                  ) : (
                    <CancelIcon sx={{ fontSize: 13, color: "error.main" }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{ color: hasMinLength ? "success.main" : "error.main" }}
                  >
                    อย่างน้อย 6 ตัวอักษร
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary", mb: 1 }}>
                ยืนยันรหัสผ่านใหม่
              </Typography>

              <TextField
                fullWidth
                size="small"
                type={showConfirm ? "text" : "password"}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!passwordsMismatch}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                      </InputAdornment>
                    ),
                    endAdornment: eyeButton(showConfirm, setShowConfirm),
                  },
                }}
                sx={fieldSx}
              />

              {confirmPassword && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                  {passwordsMatch ? (
                    <CheckCircleIcon sx={{ fontSize: 13, color: "success.main" }} />
                  ) : (
                    <CancelIcon sx={{ fontSize: 13, color: "error.main" }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{ color: passwordsMatch ? "success.main" : "error.main" }}
                  >
                    {passwordsMatch ? "รหัสผ่านตรงกัน" : "รหัสผ่านไม่ตรงกัน"}
                  </Typography>
                </Box>
              )}
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              disableElevation
              startIcon={loading ? null : <LockResetIcon />}
              sx={{
                borderRadius: 2.5,
                fontWeight: 700,
                py: 1.4,
                fontSize: 15,
                bgcolor: "#0F172A",
                "&:hover": { bgcolor: "#020617" },
                "&.Mui-disabled": {
                  bgcolor: "grey.200",
                  color: "grey.400",
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: "grey.400" }} />
                  <span>กำลังบันทึก...</span>
                </Box>
              ) : (
                "เปลี่ยนรหัสผ่าน"
              )}
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}