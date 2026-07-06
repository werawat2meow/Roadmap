// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // ค่าเริ่มต้นของ Next + TS
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // กฎหลักของโปรเจกต์
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      // ห้ามใช้ any (ถ้าจำเป็นจะ convert เป็น unknown แทน)
      "@typescript-eslint/no-explicit-any": ["error", {
        fixToUnknown: true,
        ignoreRestArgs: false
      }],

      // ห้ามใช้ Function (ให้ระบุลายเซ็นให้ชัด)
      "@typescript-eslint/no-unsafe-function-type": "error",

      // (เสริม) ช่วยแนะวิธีแก้เวลาเจอ Function
      "@typescript-eslint/ban-types": ["error", {
        extendDefaults: true,
        types: {
          Function: {
            message: "หลีกเลี่ยง 'Function' กรุณาระบุพารามิเตอร์/ผลลัพธ์ให้ชัด เช่น '(...args: unknown[]) => unknown'",
            fixWith: "(...args: unknown[]) => unknown"
          }
        }
      }],
    },
  },

  // ผ่อนกฎเฉพาะไฟล์ legacy / ทดสอบ
  {
    files: ["**/legacy/**", "**/*.test.*", "**/*.spec.*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
    },
  },
];
