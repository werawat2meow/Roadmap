// "use client";

// import { useEffect, useState } from "react";
// import { swalSuccess, swalError, swalConfirm } from "../../../components/Swal";
// import { Tooltip } from "antd";
// import LoadingOrb from "../../../components/LoadingOrb";
// import useScopedPermissions from "@/hooks/useScopedPermissions";

// const initialForm = {
//   code: "",
//   name: "",
//   department_color: "#E2E8F0",
//   department_icon: "",
//   branch_ids: [],
//   status: "active",
// };

// export default function DepartmentsPage() {
//   const [search, setSearch] = useState("");
//   const [departments, setDepartments] = useState([]);
//   const [branches, setBranches] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [deletingId, setDeletingId] = useState("");
//   const [error, setError] = useState("");
//   const [form, setForm] = useState(initialForm);
//   const [openModal, setOpenModal] = useState(false);
//   const [editingDepartment, setEditingDepartment] = useState(null);
//   const [viewMode, setViewMode] = useState("matrix");
 

//   /* =========================================================
//    Permission + Access Scope
//   ========================================================= */
//   const {
//     user,
//     loadingUser,

//     /* Permission */
//     canView,
//     canCreate,
//     canEdit,
//     canDelete,

//     /* Permission + Scope */
//     canEditRecord,
//     canDeleteRecord,

//     /* Scope */
//     hasAllScope,
//     accessibleIds,
//     accessibleCompanyIds,
//     accessibleBranchGroupIds,
//     accessibleBranchIds,
//   } = useScopedPermissions(
//     "ems.departments",
//     {
//       scopeType: "department",
//     }
//   );

//   const loadBranches = async () => {
//     try {
//       const res = await fetch(
//         "/api/admin/branches?scope_context=ems.departments",
//         {
//           method: "GET",
//           cache: "no-store",
//         }
//       );

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data?.error || "Load branches failed");
//       }

//       const rows = data.data || [];

//       /*
//        * Branch API ถูกกรองด้วย Current User + ems.departments.view
//        * แล้ว จึงไม่ filter Company/Group/Branch ซ้ำฝั่ง Client
//        */
//       setBranches(rows);
//     } catch (err) {
//       console.error(err);
//       swalError(err.message || "ไม่สามารถโหลดข้อมูลสังกัดได้");
//     }
//   };

//   const loadDepartments = async (keyword = "") => {
//     try {
//       setLoading(true);
//       setError("");

//       const url = keyword ? `/api/admin/departments?search=${encodeURIComponent(keyword)}` : "/api/admin/departments";

//       const res = await fetch(url, {
//         method: "GET",
//         cache: "no-store",
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data?.error || "Load departments failed");
//       }

//       const mapped = (data.data || []).map((department) => ({
//         id: department.id,
//         code: department.department_code,
//         name: department.department_name,
//         branch_ids: department.branch_ids || [],
//         branch_names: department.branch_names || [],
//         department_color: department.department_color || "#E2E8F0",
//         department_icon: department.department_icon || "",
//         status: department.status,
//       }));

//       setDepartments(mapped);
//     } catch (err) {
//       console.error(err);
//       setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (loadingUser || !user || !canView) {
//       return;
//     }

//     loadBranches();
//   }, [
//     loadingUser,
//     user,
//     canView,
//     hasAllScope,
//     accessibleCompanyIds,
//     accessibleBranchGroupIds,
//     accessibleBranchIds,
//   ]);

//   useEffect(() => {
//     if (loadingUser || !user || !canView) {
//       return;
//     }

//     const timer = setTimeout(() => {
//       loadDepartments(search);
//     }, 300);

//     return () => clearTimeout(timer);
//   }, [search, loadingUser, user, canView]);

//   const resetForm = () => {
//     setForm(initialForm);
//     setEditingDepartment(null);
//   };

//   const handleOpenCreate = () => {
//     if (!canCreate) {
//       swalError("คุณไม่มีสิทธิ์เพิ่มแผนก");
//       return;
//     }

//     resetForm();
//     setOpenModal(true);
//   };

//   const handleOpenEdit = (department) => {

//     if (!canEditRecord(department)) {
//       swalError("คุณไม่มีสิทธิ์แก้ไขแผนก");
//       return;
//     }

//     setEditingDepartment(department);

//     setForm({
//       code: department.code || "",
//       name: department.name || "",
//       department_color: department.department_color || "#E2E8F0",
//       department_icon: department.department_icon || "",
//       branch_ids: department.branch_ids || [],
//       status: department.status || "active",
//     });

//     setOpenModal(true);
//   };

//   const handleCloseModal = () => {
//     resetForm();
//     setOpenModal(false);
//   };

//   const handleSave = async () => {

//     const isEdit = !!editingDepartment;

//     if (isEdit && !canEditRecord(editingDepartment)) {
//       swalError("คุณไม่มีสิทธิ์แก้ไขแผนก");
//       return;
//     }

//     if (!isEdit && !canCreate) {
//       swalError("คุณไม่มีสิทธิ์เพิ่มแผนก");
//       return;
//     }

//     if (!form.code.trim() || !form.name.trim()) {
//       swalError("กรุณากรอกรหัสแผนกและชื่อแผนก");
//       return;
//     }

//     if (!form.branch_ids.length) {
//       swalError("กรุณาเลือกสังกัดอย่างน้อย 1 รายการ");
//       return;
//     }

//     try {
//       setSaving(true);

//       const isEdit = !!editingDepartment;
//       const url = isEdit
//         ? `/api/admin/departments/${editingDepartment.id}`
//         : "/api/admin/departments";

//       const method = isEdit ? "PATCH" : "POST";

//       const res = await fetch(url, {
//         method,
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           department_code: form.code.trim(),
//           department_name: form.name.trim(),
//           department_color: form.department_color || "#E2E8F0",
//           department_icon: form.department_icon || null,
//           branch_ids: form.branch_ids,
//           status: form.status,
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data?.error || "Save failed");
//       }

//       const savedDepartment = {
//         id: data.data.id,
//         code: data.data.department_code,
//         name: data.data.department_name,
//         branch_ids: data.data.branch_ids || [],
//         branch_names: data.data.branch_names || [],
//         status: data.data.status,
//       };

//       if (isEdit) {
//         setDepartments((prev) =>
//           prev.map((item) =>
//             item.id === savedDepartment.id ? savedDepartment : item
//           )
//         );
//         swalSuccess("อัพเดทข้อมูลแผนกเรียบร้อยแล้ว");
//       } else {
//         setDepartments((prev) => [savedDepartment, ...prev]);
//         swalSuccess("บันทึกข้อมูลแผนกเรียบร้อยแล้ว");
//       }

//       handleCloseModal();
//     } catch (err) {
//       console.error(err);
//       swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async (department) => {
//      if (!canDeleteRecord(department)) {
//       swalError("คุณไม่มีสิทธิ์ลบแผนก");
//       return;
//     }

//     const confirmed = await swalConfirm(
//       `ต้องการลบแผนก "${department.name}" ใช่หรือไม่?`
//     );

//     if (!confirmed) return;

//     try {
//       setDeletingId(department.id);

//       const res = await fetch(`/api/admin/departments/${department.id}`, {
//         method: "DELETE",
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data?.error || "Delete failed");
//       }

//       setDepartments((prev) =>
//         prev.filter((item) => item.id !== department.id)
//       );

//       swalSuccess("ลบข้อมูลเรียบร้อยแล้ว");
//     } catch (err) {
//       console.error(err);
//       swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
//     } finally {
//       setDeletingId("");
//     }
//   };

//   const BranchBadges = ({ names = [] }) => {
//     const SHOW = 4;
//     const visible = names.slice(0, SHOW);
//     const hidden = names.slice(SHOW);

//     if (!names.length) return <span className="text-slate-400">-</span>;

//     return (
//       <div className="flex flex-wrap items-center gap-1.5">
//         {visible.map((name) => (
//           <span
//             key={name}
//             className="inline-flex items-center gap-1.5 rounded-[5px] border border-slate-400 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-700 whitespace-nowrap"
//           >
//             <span className="h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
//             {name}
//           </span>
//         ))}

//         {hidden.length > 0 && (
//           <Tooltip
//             title={
//               <div className="flex flex-col gap-1 py-0.5">
//                 {hidden.map((name) => (
//                   <div key={name} className="flex items-center gap-2 text-[11px]">
//                     <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
//                     {name}
//                   </div>
//                 ))}
//               </div>
//             }
//             placement="top"
//             color="#0f172a"
//           >
//             <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-[5px] border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 whitespace-nowrap">
//               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
//               +{hidden.length} more
//             </span>
//           </Tooltip>
//         )}
//       </div>
//     );
//   };


//   /* =========================================================
//    Matrix helpers
//    - อ้างอิงหน้าตา BUSINESS STRUCTURE: GROUP อยู่ด้านซ้าย
//    - ถ้าแผนกเลือกครบทุกสังกัด ให้ใช้สีเทา
//    - ถ้าเลือกครบทั้ง Group ให้ Cell ของ Group นั้นเป็นสีเทาเหมือนกัน
//   ========================================================= */
//   const MATRIX_ALL_COLOR = "#D1D5DB";
//   const MATRIX_EMPTY_COLOR = "#F8FAFC";

//   const getBranchGroupKey = (branch) => {
//     return (
//       branch?.branch_group_id ||
//       branch?.group_id ||
//       branch?.group_name ||
//       "NO_GROUP"
//     );
//   };

//   const branchGroups = Array.from(
//     new Map(
//       branches.map((branch) => {
//         const key = getBranchGroupKey(branch);
//         const groupLabel = branch.group_name || "ไม่ระบุกลุ่ม";

//         return [
//           key,
//           {
//             key,
//             name: groupLabel,
//             color: branch.group_color || "#E2E8F0",
//           },
//         ];
//       })
//     ).values()
//   );

//   const getBranchesByGroup = (groupKey) => {
//     return branches.filter(
//       (branch) => getBranchGroupKey(branch) === groupKey
//     );
//   };

//   const getDepartmentBranchesByGroup = (
//     department,
//     groupKey
//   ) => {
//     return branches.filter(
//       (branch) =>
//         department.branch_ids?.includes(branch.id) &&
//         getBranchGroupKey(branch) === groupKey
//     );
//   };

//   const isDepartmentAllBranches = (department) => {
//     if (!branches.length) return false;

//     const selectedIds = new Set(
//       department.branch_ids || []
//     );

//     return branches.every((branch) =>
//       selectedIds.has(branch.id)
//     );
//   };

//   const isDepartmentAllGroupBranches = (
//     department,
//     groupKey
//   ) => {
//     const groupBranches =
//       getBranchesByGroup(groupKey);

//     if (!groupBranches.length) return false;

//     const selectedIds = new Set(
//       department.branch_ids || []
//     );

//     return groupBranches.every((branch) =>
//       selectedIds.has(branch.id)
//     );
//   };

//   const getDepartmentSelectedGroupKeys = (
//     department
//   ) => {
//     const selectedIds = new Set(
//       department.branch_ids || []
//     );

//     return Array.from(
//       new Set(
//         branches
//           .filter((branch) =>
//             selectedIds.has(branch.id)
//           )
//           .map((branch) =>
//             getBranchGroupKey(branch)
//           )
//       )
//     );
//   };

//   const getDepartmentMatrixColor = (
//     department
//   ) => {
//     if (isDepartmentAllBranches(department)) {
//       return MATRIX_ALL_COLOR;
//     }

//     const selectedGroupKeys =
//       getDepartmentSelectedGroupKeys(
//         department
//       );

//     /*
//      * อยู่ใน Group เดียว = ใช้สีของ Group ตาม BUSINESS STRUCTURE
//      * ข้ามหลาย Group = สีเทา เพื่อสื่อว่าเป็น Shared / Multi Group
//      */
//     if (selectedGroupKeys.length === 1) {
//       const selectedGroup =
//         branchGroups.find(
//           (group) =>
//             group.key ===
//             selectedGroupKeys[0]
//         );

//       return (
//         selectedGroup?.color ||
//         department.department_color ||
//         MATRIX_EMPTY_COLOR
//       );
//     }

//     if (selectedGroupKeys.length > 1) {
//       return MATRIX_ALL_COLOR;
//     }

//     return (
//       department.department_color ||
//       MATRIX_EMPTY_COLOR
//     );
//   };

//   const getDepartmentScopeLabel = (
//     department
//   ) => {
//     if (isDepartmentAllBranches(department)) {
//       return "ทุกสังกัด";
//     }

//     const selectedGroupKeys =
//       getDepartmentSelectedGroupKeys(
//         department
//       );

//     if (selectedGroupKeys.length === 1) {
//       const selectedGroup =
//         branchGroups.find(
//           (group) =>
//             group.key ===
//             selectedGroupKeys[0]
//         );

//       return selectedGroup?.name || "1 Group";
//     }

//     if (selectedGroupKeys.length > 1) {
//       return "หลาย Group";
//     }

//     return "ยังไม่ระบุสังกัด";
//   };

//   const getGroupMatrixColor = (
//     department,
//     group
//   ) => {
//     if (
//       isDepartmentAllBranches(department) ||
//       isDepartmentAllGroupBranches(
//         department,
//         group.key
//       )
//     ) {
//       return MATRIX_ALL_COLOR;
//     }

//     return group.color || MATRIX_EMPTY_COLOR;
//   };

//   if (loadingUser) return <LoadingOrb />;
//   if (!user) return null;
//   if (!canView) return null;

//   return (
//     <div className="space-y-6">
//       <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
//         <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-slate-800">แผนก</h1>
//             <p className="mt-1 text-sm text-slate-500">
//               จัดการข้อมูลแผนกในแต่ละสังกัด สามารถเพิ่ม แก้ไข หรือลบแผนกได้ตามสิทธิ์ที่ได้รับ
//             </p>
//           </div>

//           {canCreate && (
//             <button
//               type="button"
//               onClick={handleOpenCreate}
//               className="rounded-2xl bg-[#0D2842] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
//             >
//               + เพิ่มแผนก
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
//         <input
//           type="text"
//           placeholder="ค้นหารหัสแผนก / ชื่อแผนก / ชื่อหรือรหัสสังกัด"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
//         />
//       </div>

//       <div className="flex justify-end gap-2">
//         <button
//           type="button"
//           onClick={() => setViewMode("matrix")}
//           className={`rounded-xl px-4 py-2 text-sm font-semibold ${
//             viewMode === "matrix"
//               ? "bg-[#123A63] text-white"
//               : "border border-slate-300 bg-white text-slate-600"
//           }`}
//         >
//           Matrix View
//         </button>

//         <button
//           type="button"
//           onClick={() => setViewMode("table")}
//           className={`rounded-xl px-4 py-2 text-sm font-semibold ${
//             viewMode === "table"
//               ? "bg-[#123A63] text-white"
//               : "border border-slate-300 bg-white text-slate-600"
//           }`}
//         >
//           Table View
//         </button>
//       </div>

//       {error ? (
//         <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
//           {error}
//         </div>
//       ) : null}

//       {/* Table */}
//       {viewMode === "table" && (
//       <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
//         <div className="overflow-x-auto">
//           <table className="min-w-full text-sm">
//             <thead className="bg-slate-100 text-slate-600">
//               <tr>
//                 <th className="px-6 py-4 text-left font-semibold">ลำดับ</th>
//                 <th className="px-6 py-4 text-left font-semibold">รหัสแผนก</th>
//                 <th className="px-6 py-4 text-left font-semibold">ชื่อแผนก</th>
//                 <th className="px-6 py-4 text-left font-semibold">สังกัดที่ดูแล</th>
//                 <th className="px-6 py-4 text-left font-semibold">สถานะ</th>
//                 <th className="px-6 py-4 text-right font-semibold">จัดการ</th>
//               </tr>
//             </thead>

//             <tbody>
//               {loading ? (
//                 [...Array(5)].map((_, i) => (
//                   <tr key={i} className="border-t border-slate-200">
//                     <td className="px-6 py-4">
//                       <div className="h-3.5 w-16 animate-pulse rounded-md bg-slate-200" />
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="h-3.5 w-32 animate-pulse rounded-md bg-slate-200" />
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="h-3.5 w-28 animate-pulse rounded-md bg-slate-200" />
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex justify-end gap-2">
//                         <div className="h-8 w-14 animate-pulse rounded-xl bg-slate-200" />
//                         <div className="h-8 w-16 animate-pulse rounded-xl bg-slate-200" />
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               ) : departments.length > 0 ? (
//                 departments.map((department,index) => (
//                   <tr
//                     key={department.id}
//                     className="border-t border-slate-200 hover:bg-slate-50"
//                   >
//                     <td className="px-6 py-4 font-medium text-slate-700">
//                       {index + 1}
//                     </td>

//                     <td className="px-6 py-4 font-medium text-slate-700">
//                       {department.code}
//                     </td>

//                     <td className="px-6 py-4 text-slate-700">
//                       {department.name}
//                     </td>

//                     <td className="px-6 py-4 text-slate-600">
//                       {department.branch_names?.length ? (
//                         <BranchBadges names={department.branch_names ?? []} />
//                       ) : (
//                         "-"
//                       )}
//                     </td>

//                     <td className="px-6 py-4">
//                       <span
//                         className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
//                           department.status === "active"
//                             ? "bg-green-100 text-green-700"
//                             : "bg-red-100 text-red-600"
//                         }`}
//                       >
//                         {department.status === "active" ? "Active" : "Inactive"}
//                       </span>
//                     </td>

//                     <td className="px-6 py-4">
//                       {canEditRecord(
//                         department
//                       ) ||
//                       canDeleteRecord(
//                         department
//                       ) ? (
//                         <div className="flex justify-end gap-2">

//                           {canEditRecord(
//                             department
//                           ) && (
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 handleOpenEdit(
//                                   department
//                                 )
//                               }
//                               className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
//                             >
//                               Edit
//                             </button>
//                           )}

//                           {canDeleteRecord(
//                             department
//                           ) && (
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 handleDelete(
//                                   department
//                                 )
//                               }
//                               disabled={
//                                 deletingId ===
//                                 department.id
//                               }
//                               className={`rounded-xl border px-3 py-2 text-xs font-medium ${
//                                 deletingId ===
//                                 department.id
//                                   ? "cursor-not-allowed border-slate-200 text-slate-400"
//                                   : "border-red-200 text-red-600 hover:bg-red-50"
//                               }`}
//                             >
//                               {deletingId ===
//                               department.id
//                                 ? "Deleting..."
//                                 : "Delete"}
//                             </button>
//                           )}

//                         </div>
//                       ) : (
//                         <div className="text-right text-slate-400">
//                           -
//                         </div>
//                       )}
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
//                     ไม่พบข้อมูลแผนก
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//       )}

//       {/* Matrix View */}
//       {viewMode === "matrix" && (
//         <div className="space-y-4">
//           {/* Mobile Matrix Card */}
//           <div className="space-y-4 lg:hidden">
//             {loading ? (
//               [...Array(4)].map((_, index) => (
//                 <div
//                   key={index}
//                   className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm"
//                 >
//                   <div className="h-16 animate-pulse bg-slate-200" />
//                   <div className="grid grid-cols-2 gap-px bg-slate-300 p-px">
//                     <div className="h-28 animate-pulse bg-slate-100" />
//                     <div className="h-28 animate-pulse bg-slate-100" />
//                   </div>
//                 </div>
//               ))
//             ) : departments.length > 0 ? (
//               departments.map((department, index) => {
//                 const allBranches =
//                   isDepartmentAllBranches(
//                     department
//                   );

//                 return (
//                   <div
//                     key={department.id}
//                     className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm"
//                   >
//                     <div
//                       className="border-b border-slate-300 p-4"
//                       style={{
//                         backgroundColor:
//                           getDepartmentMatrixColor(
//                             department
//                           ),
//                       }}
//                     >
//                       <div className="flex items-start justify-between gap-3">
//                         <div>
//                           <div className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
//                             Department {index + 1}
//                           </div>
//                           <div className="mt-1 text-base font-bold text-slate-900">
//                             {department.name}
//                           </div>
//                           <div className="mt-0.5 text-xs text-slate-600">
//                             {department.code}
//                             {allBranches
//                               ? " · ทุกสังกัด"
//                               : ` · ${
//                                   department
//                                     .branch_ids
//                                     ?.length || 0
//                                 } สังกัด`}
//                           </div>
//                         </div>

//                         <span
//                           className={`shrink-0 border px-2.5 py-1 text-[10px] font-bold ${
//                             department.status ===
//                             "active"
//                               ? "border-green-600/30 bg-green-50 text-green-700"
//                               : "border-red-600/30 bg-red-50 text-red-600"
//                           }`}
//                         >
//                           {department.status ===
//                           "active"
//                             ? "ACTIVE"
//                             : "INACTIVE"}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="border-b border-slate-300 bg-[#666666] px-3 py-2 text-center text-[11px] font-bold tracking-wider text-white">
//                       GROUP
//                     </div>

//                     <div className="divide-y divide-slate-300">
//                       {branchGroups.map((group) => {
//                         const groupBranches =
//                           getDepartmentBranchesByGroup(
//                             department,
//                             group.key
//                           );

//                         const allGroupBranches =
//                           isDepartmentAllGroupBranches(
//                             department,
//                             group.key
//                           );

//                         return (
//                           <div
//                             key={group.key}
//                             className="grid grid-cols-[120px_1fr]"
//                           >
//                             <div className="border-r border-slate-300 bg-[#666666] px-3 py-3 text-center text-xs font-bold text-white">
//                               {group.name}
//                             </div>

//                             <div
//                               className="min-h-[72px] px-3 py-2"
//                               style={{
//                                 backgroundColor:
//                                   getGroupMatrixColor(
//                                     department,
//                                     group
//                                   ),
//                               }}
//                             >
//                               {groupBranches.length ? (
//                                 <div className="space-y-1">
//                                   {groupBranches.map(
//                                     (branch) => (
//                                       <div
//                                         key={branch.id}
//                                         className="flex items-center gap-2 border-b border-black/10 py-1.5 last:border-b-0"
//                                       >
//                                         <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-white/80 p-1">
//                                           {branch.branch_image_url ? (
//                                             <img
//                                               src={
//                                                 branch.branch_image_url
//                                               }
//                                               alt={
//                                                 branch.branch_name
//                                               }
//                                               className="max-h-full max-w-full object-contain"
//                                             />
//                                           ) : (
//                                             <span className="text-[8px] text-slate-400">
//                                               LOGO
//                                             </span>
//                                           )}
//                                         </div>

//                                         <div className="min-w-0">
//                                           <div className="truncate text-[11px] font-bold text-slate-800">
//                                             {branch.branch_code ||
//                                               "-"}
//                                           </div>
//                                           <div className="truncate text-[10px] text-slate-600">
//                                             {branch.branch_name ||
//                                               "-"}
//                                           </div>
//                                         </div>
//                                       </div>
//                                     )
//                                   )}

//                                   {allGroupBranches && (
//                                     <div className="pt-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">
//                                       ทุกสังกัดในกลุ่ม
//                                     </div>
//                                   )}
//                                 </div>
//                               ) : (
//                                 <div className="flex min-h-[52px] items-center justify-center text-xs text-slate-500">
//                                   -
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>

//                     {(canEdit || canDelete) &&
//                       (canEditRecord(department) ||
//                         canDeleteRecord(
//                           department
//                         )) && (
//                         <div className="flex justify-end gap-2 border-t border-slate-300 bg-white p-3">
//                           {canEditRecord(
//                             department
//                           ) && (
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 handleOpenEdit(
//                                   department
//                                 )
//                               }
//                               className="border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
//                             >
//                               Edit
//                             </button>
//                           )}

//                           {canDeleteRecord(
//                             department
//                           ) && (
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 handleDelete(
//                                   department
//                                 )
//                               }
//                               disabled={
//                                 deletingId ===
//                                 department.id
//                               }
//                               className="border border-red-300 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
//                             >
//                               {deletingId ===
//                               department.id
//                                 ? "Deleting..."
//                                 : "Delete"}
//                             </button>
//                           )}
//                         </div>
//                       )}
//                   </div>
//                 );
//               })
//             ) : (
//               <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-400">
//                 ไม่พบข้อมูลแผนก
//               </div>
//             )}
//           </div>

//           {/* Desktop Matrix Table - BUSINESS STRUCTURE style */}
//           <div className="hidden overflow-hidden border border-slate-300 bg-white shadow-sm lg:block">
//             <div className="border-b border-slate-300 bg-white px-6 py-4 text-center">
//               <h2 className="text-3xl font-black tracking-tight text-black">
//                 BUSINESS STRUCTURE 2026
//               </h2>
//               <p className="mt-1 text-xs text-slate-500">
//                 GROUP / สังกัด อยู่ด้านซ้าย และ Department อยู่ด้านขวาตามรูปแบบโครงสร้างบริษัท
//               </p>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="min-w-[1250px] w-full border-collapse text-[11px]">
//                 <thead>
//                   <tr className="bg-[#666666] text-white">
//                     <th
//                       colSpan={Math.max(
//                         branchGroups.length,
//                         1
//                       )}
//                       className="border border-slate-400 px-3 py-2 text-center text-xs font-bold tracking-wider"
//                     >
//                       GROUP
//                     </th>

//                     <th
//                       rowSpan={2}
//                       className="w-[58px] border border-slate-400 px-2 py-2 text-center font-bold"
//                     >
//                       NO.
//                     </th>

//                     <th
//                       rowSpan={2}
//                       className="min-w-[220px] border border-slate-400 px-3 py-2 text-center font-bold"
//                     >
//                       Department
//                     </th>

//                     <th
//                       rowSpan={2}
//                       className="w-[92px] border border-slate-400 px-2 py-2 text-center font-bold"
//                     >
//                       Status
//                     </th>

//                     {(canEdit || canDelete) && (
//                       <th
//                         rowSpan={2}
//                         className="w-[132px] border border-slate-400 px-2 py-2 text-center font-bold"
//                       >
//                         Manage
//                       </th>
//                     )}
//                   </tr>

//                   <tr className="bg-[#666666] text-white">
//                     {branchGroups.length > 0 ? (
//                       branchGroups.map((group) => (
//                         <th
//                           key={group.key}
//                           className="min-w-[155px] border border-slate-400 px-3 py-2 text-center font-bold"
//                         >
//                           {group.name}
//                         </th>
//                       ))
//                     ) : (
//                       <th className="min-w-[155px] border border-slate-400 px-3 py-2 text-center font-bold">
//                         -
//                       </th>
//                     )}
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {loading ? (
//                     [...Array(6)].map((_, index) => (
//                       <tr key={index}>
//                         {(branchGroups.length
//                           ? branchGroups
//                           : [{ key: "loading" }]
//                         ).map((group) => (
//                           <td
//                             key={`${group.key}-${index}`}
//                             className="h-24 border border-slate-300 bg-slate-100 px-3 py-3"
//                           >
//                             <div className="mx-auto h-12 w-16 animate-pulse bg-slate-200" />
//                           </td>
//                         ))}

//                         <td className="border border-slate-300 bg-white px-2 py-3 text-center">
//                           <div className="mx-auto h-4 w-6 animate-pulse bg-slate-200" />
//                         </td>
//                         <td className="border border-slate-300 bg-white px-3 py-3">
//                           <div className="h-4 w-32 animate-pulse bg-slate-200" />
//                         </td>
//                         <td className="border border-slate-300 bg-white px-2 py-3">
//                           <div className="mx-auto h-5 w-14 animate-pulse bg-slate-200" />
//                         </td>
//                         {(canEdit || canDelete) && (
//                           <td className="border border-slate-300 bg-white px-2 py-3">
//                             <div className="mx-auto h-7 w-20 animate-pulse bg-slate-200" />
//                           </td>
//                         )}
//                       </tr>
//                     ))
//                   ) : departments.length > 0 ? (
//                     departments.map(
//                       (department, index) => {
//                         const allBranches =
//                           isDepartmentAllBranches(
//                             department
//                           );

//                         return (
//                           <tr key={department.id}>
//                             {/*
//                               GROUP columns แสดงเพียงครั้งเดียวและลากยาวลงมา
//                               เหมือน BUSINESS STRUCTURE ตัวอย่าง
//                             */}
//                             {index === 0 &&
//                               (branchGroups.length > 0 ? (
//                                 branchGroups.map(
//                                   (group) => {
//                                     const groupBranches =
//                                       getBranchesByGroup(
//                                         group.key
//                                       );

//                                     return (
//                                       <td
//                                         key={group.key}
//                                         rowSpan={
//                                           departments.length
//                                         }
//                                         className="border border-slate-300 p-0 align-top"
//                                         style={{
//                                           backgroundColor:
//                                             group.color ||
//                                             MATRIX_EMPTY_COLOR,
//                                         }}
//                                       >
//                                         <div className="divide-y divide-black/10">
//                                           {groupBranches.length >
//                                           0 ? (
//                                             groupBranches.map(
//                                               (branch) => (
//                                                 <Tooltip
//                                                   key={
//                                                     branch.id
//                                                   }
//                                                   title={`${
//                                                     branch.branch_code ||
//                                                     ""
//                                                   } ${
//                                                     branch.branch_name ||
//                                                     ""
//                                                   }`}
//                                                   placement="top"
//                                                   color="#0f172a"
//                                                 >
//                                                   <div className="flex min-h-[92px] flex-col items-center justify-center px-2 py-3 text-center">
//                                                     <div className="flex h-14 w-14 items-center justify-center bg-white/70 p-1.5">
//                                                       {branch.branch_image_url ? (
//                                                         <img
//                                                           src={
//                                                             branch.branch_image_url
//                                                           }
//                                                           alt={
//                                                             branch.branch_name
//                                                           }
//                                                           className="max-h-full max-w-full object-contain"
//                                                         />
//                                                       ) : (
//                                                         <span className="text-[8px] text-slate-400">
//                                                           LOGO
//                                                         </span>
//                                                       )}
//                                                     </div>

//                                                     <div className="mt-2 max-w-[135px] truncate text-[10px] font-bold text-slate-800">
//                                                       {branch.branch_code ||
//                                                         "-"}
//                                                     </div>
//                                                     <div className="mt-0.5 max-w-[135px] truncate text-[9px] text-slate-600">
//                                                       {branch.branch_name ||
//                                                         "-"}
//                                                     </div>
//                                                   </div>
//                                                 </Tooltip>
//                                               )
//                                             )
//                                           ) : (
//                                             <div className="flex min-h-[100px] items-center justify-center text-slate-500">
//                                               -
//                                             </div>
//                                           )}
//                                         </div>
//                                       </td>
//                                     );
//                                   }
//                                 )
//                               ) : (
//                                 <td
//                                   rowSpan={
//                                     departments.length
//                                   }
//                                   className="border border-slate-300 bg-slate-50 px-3 py-3 text-center text-slate-400"
//                                 >
//                                   -
//                                 </td>
//                               ))}

//                             <td
//                               className="border border-slate-300 px-2 py-3 text-center align-middle font-bold text-slate-800"
//                               style={{
//                                 backgroundColor:
//                                   getDepartmentMatrixColor(
//                                     department
//                                   ),
//                               }}
//                             >
//                               {index + 1}
//                             </td>

//                             <td
//                               className="border border-slate-300 px-3 py-3 align-middle"
//                               style={{
//                                 backgroundColor:
//                                   getDepartmentMatrixColor(
//                                     department
//                                   ),
//                               }}
//                             >
//                               <div className="font-bold text-slate-900">
//                                 {department.name}
//                               </div>
//                               <div className="mt-0.5 text-[10px] text-slate-700">
//                                 {department.code}
//                               </div>
//                               <div className="mt-1 text-[9px] font-medium text-slate-600">
//                                 {getDepartmentScopeLabel(
//                                   department
//                                 )}
//                                 {allBranches
//                                   ? " · สีเทา"
//                                   : ""}
//                               </div>
//                             </td>

//                             <td className="border border-slate-300 bg-white px-2 py-3 text-center align-middle">
//                               <span
//                                 className={`inline-flex border px-2 py-1 text-[9px] font-bold ${
//                                   department.status ===
//                                   "active"
//                                     ? "border-green-300 bg-green-50 text-green-700"
//                                     : "border-red-300 bg-red-50 text-red-600"
//                                 }`}
//                               >
//                                 {department.status ===
//                                 "active"
//                                   ? "ACTIVE"
//                                   : "INACTIVE"}
//                               </span>
//                             </td>

//                             {(canEdit || canDelete) && (
//                               <td className="border border-slate-300 bg-white px-2 py-3 align-middle">
//                                 {canEditRecord(
//                                   department
//                                 ) ||
//                                 canDeleteRecord(
//                                   department
//                                 ) ? (
//                                   <div className="flex justify-center gap-1.5">
//                                     {canEditRecord(
//                                       department
//                                     ) && (
//                                       <button
//                                         type="button"
//                                         onClick={() =>
//                                           handleOpenEdit(
//                                             department
//                                           )
//                                         }
//                                         className="border border-slate-300 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
//                                       >
//                                         Edit
//                                       </button>
//                                     )}

//                                     {canDeleteRecord(
//                                       department
//                                     ) && (
//                                       <button
//                                         type="button"
//                                         onClick={() =>
//                                           handleDelete(
//                                             department
//                                           )
//                                         }
//                                         disabled={
//                                           deletingId ===
//                                           department.id
//                                         }
//                                         className="border border-red-300 bg-white px-2 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
//                                       >
//                                         {deletingId ===
//                                         department.id
//                                           ? "..."
//                                           : "Delete"}
//                                       </button>
//                                     )}
//                                   </div>
//                                 ) : (
//                                   <div className="text-center text-slate-400">
//                                     -
//                                   </div>
//                                 )}
//                               </td>
//                             )}
//                           </tr>
//                         );
//                       }
//                     )
//                   ) : (
//                     <tr>
//                       <td
//                         colSpan={
//                           Math.max(
//                             branchGroups.length,
//                             1
//                           ) +
//                           3 +
//                           (canEdit || canDelete
//                             ? 1
//                             : 0)
//                         }
//                         className="border border-slate-300 bg-white px-6 py-12 text-center text-slate-400"
//                       >
//                         ไม่พบข้อมูลแผนก
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>

//                 {!loading &&
//                   departments.length > 0 && (
//                     <tfoot>
//                       <tr className="bg-[#666666] text-white">
//                         {branchGroups.length > 0 ? (
//                           branchGroups.map(
//                             (group) => (
//                               <td
//                                 key={group.key}
//                                 className="border border-slate-400 px-3 py-2 text-center font-bold"
//                               >
//                                 {
//                                   getBranchesByGroup(
//                                     group.key
//                                   ).length
//                                 }
//                               </td>
//                             )
//                           )
//                         ) : (
//                           <td className="border border-slate-400 px-3 py-2 text-center font-bold">
//                             0
//                           </td>
//                         )}

//                         <td className="border border-slate-400 px-2 py-2 text-center font-bold">
//                           -
//                         </td>
//                         <td className="border border-slate-400 px-3 py-2 text-right font-bold">
//                           รวม {departments.length} แผนก
//                         </td>
//                         <td className="border border-slate-400 px-2 py-2 text-center font-bold">
//                           -
//                         </td>
//                         {(canEdit || canDelete) && (
//                           <td className="border border-slate-400 px-2 py-2 text-center font-bold">
//                             -
//                           </td>
//                         )}
//                       </tr>
//                     </tfoot>
//                   )}
//               </table>
//             </div>

//             <div className="flex flex-wrap items-center gap-4 border-t border-slate-300 bg-slate-50 px-4 py-2 text-[10px] text-slate-600">
//               <div className="flex items-center gap-1.5">
//                 <span
//                   className="h-3 w-5 border border-slate-400"
//                   style={{
//                     backgroundColor:
//                       MATRIX_ALL_COLOR,
//                   }}
//                 />
//                 สีเทา = ทุกสังกัด / ข้ามหลาย Group
//               </div>
//               <div>
//                 อยู่ Group เดียว = ใช้สีของ Branch Group อัตโนมัติ
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {openModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//           <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
//             <div className="border-b border-slate-200 px-6 py-4">
//               <h2 className="text-xl font-bold text-slate-800">
//                 {editingDepartment ? "แก้ไขแผนก" : "เพิ่มแผนก"}
//               </h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 {editingDepartment ? "ปรับปรุงข้อมูลแผนก" : "กรอกข้อมูลแผนกใหม่"}
//               </p>
//             </div>

//             <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
//               <div>
//                 <label className="mb-2 block text-sm font-medium text-slate-700">
//                   รหัสแผนก
//                 </label>
//                 <input
//                   type="text"
//                   value={form.code}
//                   onChange={(e) =>
//                     setForm((prev) => ({
//                       ...prev,
//                       code: e.target.value,
//                     }))
//                   }
//                   placeholder="เช่น OPS"
//                   className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div>
//                 <label className="mb-2 block text-sm font-medium text-slate-700">
//                   ชื่อแผนก
//                 </label>
//                 <input
//                   type="text"
//                   value={form.name}
//                   onChange={(e) =>
//                     setForm((prev) => ({
//                       ...prev,
//                       name: e.target.value,
//                     }))
//                   }
//                   placeholder="เช่น Operations"
//                   className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
//                 />
//               </div>

//               <div className="md:col-span-2">
//                 <label className="mb-2 block text-sm font-medium text-slate-700">
//                   สังกัดที่ดูแล
//                 </label>

//                 <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
//                   <div className="mb-3 flex flex-wrap gap-2">
//                     {form.branch_ids.length > 0 ? (
//                       form.branch_ids.map((selectedId) => {
//                         const selectedBranch = branches.find(
//                           (branch) => branch.id === selectedId
//                         );

//                         return (
//                           <span
//                             key={selectedId}
//                             className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
//                           >
//                             {selectedBranch?.branch_name || selectedId}
//                             <button
//                               type="button"
//                               disabled={editingDepartment ? !canEdit : !canCreate}
//                               onClick={() =>
//                                 setForm((prev) => ({
//                                   ...prev,
//                                   branch_ids: prev.branch_ids.filter(
//                                     (id) => id !== selectedId
//                                   ),
//                                 }))
//                               }
//                               className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] hover:bg-white/30"
//                             >
//                               ✕
//                             </button>
//                           </span>
//                         );
//                       })
//                     ) : (
//                       <p className="text-sm text-slate-400">ยังไม่ได้เลือกสังกัดที่ดูแล</p>
//                     )}
//                   </div>

//                   <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
//                     <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
//                       {branches.map((branch) => {
//                         const isChecked = form.branch_ids.includes(branch.id);

//                         return (
//                           <label
//                             key={branch.id}
//                             className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
//                               isChecked
//                                 ? "border-slate-900 bg-slate-900/5"
//                                 : "border-slate-200 hover:bg-slate-50"
//                             }`}
//                           >
//                             <input
//                               type="checkbox"
//                               checked={isChecked}
//                               disabled={editingDepartment ? !canEdit : !canCreate}
//                               onChange={(e) => {
//                                 const value = branch.id;
//                                 const nextIds = e.target.checked
//                                   ? [...form.branch_ids, value]
//                                   : form.branch_ids.filter((id) => id !== value);

//                                 setForm((prev) => ({
//                                   ...prev,
//                                   branch_ids: nextIds,
//                                 }));
//                               }}
//                               className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
//                             />

//                             <div className="min-w-0">
//                               <p
//                                 className={`truncate text-sm ${
//                                   isChecked
//                                     ? "font-semibold text-slate-900"
//                                     : "text-slate-700"
//                                 }`}
//                               >
//                                 {branch.branch_name}
//                               </p>
//                               <p className="text-xs text-slate-400">
//                                 {branch.branch_code || "Branch"}
//                               </p>
//                             </div>
//                           </label>
//                         );
//                       })}
//                     </div>
//                   </div>

//                   <div className="mt-3 flex items-center justify-between">
//                     <p className="text-xs text-slate-400">
//                       เลือกได้มากกว่า 1 สังกัดที่ดูแล
//                     </p>
//                     <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
//                       เลือกแล้ว {form.branch_ids.length} รายการ
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="md:col-span-2">
//                 <label className="mb-2 block text-sm font-medium text-slate-700">
//                   สถานะ
//                 </label>

//                 <select
//                   value={form.status}
//                   onChange={(e) =>
//                     setForm((prev) => ({
//                       ...prev,
//                       status: e.target.value,
//                     }))
//                   }
//                   className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
//                 >
//                   <option value="active">Active</option>
//                   <option value="inactive">Inactive</option>
//                 </select>
//               </div>
//             </div>

//             <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
//               <button
//                 type="button"
//                 onClick={handleCloseModal}
//                 disabled={saving}
//                 className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
//               >
//                 Cancel
//               </button>

//               {((editingDepartment  && canEditRecord(editingDepartment)) || (!editingDepartment  && canCreate)) && (
//                 <button
//                   type="button"
//                   onClick={handleSave}
//                   disabled={saving}
//                   className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${
//                     saving
//                       ? "cursor-not-allowed bg-slate-400"
//                       : "bg-slate-900 hover:bg-slate-800"
//                   }`}
//                 >
//                   {saving ? "Saving..." : editingDepartment ? "Update" : "Save"}
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



"use client";

import { useEffect, useState } from "react";

import { swalConfirm, swalError, swalSuccess } from "../../../components/Swal";
import LoadingOrb from "../../../components/LoadingOrb";
import useScopedPermissions from "@/hooks/useScopedPermissions";

import DepartmentFormModal from "./components/DepartmentFormModal";
import DepartmentHeader from "./components/DepartmentHeader";
import DepartmentMatrixView from "./components/DepartmentMatrixView";
import DepartmentSearch from "./components/DepartmentSearch";
import DepartmentTableView from "./components/DepartmentTableView";
import DepartmentViewSwitcher from "./components/DepartmentViewSwitcher";

const INITIAL_FORM = {
  code: "",
  name: "",
  department_color: "#E2E8F0",
  department_icon: "",
  branch_ids: [],
  status: "active",
};

function mapDepartment(department, fallback = {}) {
  return {
    id: department.id,
    code: department.department_code,
    name: department.department_name,
    branch_ids: department.branch_ids || fallback.branch_ids || [],
    branch_names: department.branch_names || fallback.branch_names || [],
    department_color:
      department.department_color ||
      fallback.department_color ||
      "#E2E8F0",
    department_icon:
      department.department_icon || fallback.department_icon || "",
    status: department.status || fallback.status || "active",
  };
}

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [openModal, setOpenModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [viewMode, setViewMode] = useState("matrix");

  const {
    user,
    loadingUser,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canEditRecord,
    canDeleteRecord,
    hasAllScope,
    accessibleCompanyIds,
    accessibleBranchGroupIds,
    accessibleBranchIds,
  } = useScopedPermissions("ems.departments", {
    scopeType: "department",
  });

  const loadBranches = async () => {
    try {
      const response = await fetch(
        "/api/admin/branches?scope_context=ems.departments",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Load branches failed");
      }

      setBranches(payload.data || []);
    } catch (requestError) {
      console.error(requestError);
      swalError(requestError.message || "ไม่สามารถโหลดข้อมูลสังกัดได้");
    }
  };

  const loadDepartments = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const url = keyword
        ? `/api/admin/departments?search=${encodeURIComponent(keyword)}`
        : "/api/admin/departments";

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Load departments failed");
      }

      setDepartments((payload.data || []).map((item) => mapDepartment(item)));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingUser || !user || !canView) return;

    loadBranches();
  }, [
    loadingUser,
    user,
    canView,
    hasAllScope,
    accessibleCompanyIds,
    accessibleBranchGroupIds,
    accessibleBranchIds,
  ]);

  useEffect(() => {
    if (loadingUser || !user || !canView) return;

    const timer = setTimeout(() => {
      loadDepartments(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, loadingUser, user, canView]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingDepartment(null);
  };

  const handleOpenCreate = () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มแผนก");
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (department) => {
    if (!canEditRecord(department)) {
      swalError("คุณไม่มีสิทธิ์แก้ไขแผนก");
      return;
    }

    setEditingDepartment(department);
    setForm({
      code: department.code || "",
      name: department.name || "",
      department_color: department.department_color || "#E2E8F0",
      department_icon: department.department_icon || "",
      branch_ids: department.branch_ids || [],
      status: department.status || "active",
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleSave = async () => {
    const isEdit = Boolean(editingDepartment);

    if (isEdit && !canEditRecord(editingDepartment)) {
      swalError("คุณไม่มีสิทธิ์แก้ไขแผนก");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มแผนก");
      return;
    }

    if (!form.code.trim() || !form.name.trim()) {
      swalError("กรุณากรอกรหัสแผนกและชื่อแผนก");
      return;
    }

    if (!form.branch_ids.length) {
      swalError("กรุณาเลือกสังกัดอย่างน้อย 1 รายการ");
      return;
    }

    try {
      setSaving(true);

      const url = isEdit
        ? `/api/admin/departments/${editingDepartment.id}`
        : "/api/admin/departments";

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          department_code: form.code.trim(),
          department_name: form.name.trim(),
          department_color: form.department_color || "#E2E8F0",
          department_icon: form.department_icon || null,
          branch_ids: form.branch_ids,
          status: form.status,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Save failed");
      }

      const savedDepartment = mapDepartment(payload.data, {
        branch_ids: form.branch_ids,
        department_color: form.department_color,
        department_icon: form.department_icon,
        status: form.status,
      });

      if (isEdit) {
        setDepartments((previous) =>
          previous.map((item) =>
            item.id === savedDepartment.id ? savedDepartment : item
          )
        );
        swalSuccess("อัพเดทข้อมูลแผนกเรียบร้อยแล้ว");
      } else {
        setDepartments((previous) => [savedDepartment, ...previous]);
        swalSuccess("บันทึกข้อมูลแผนกเรียบร้อยแล้ว");
      }

      handleCloseModal();
    } catch (requestError) {
      console.error(requestError);
      swalError(requestError.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (department) => {
    if (!canDeleteRecord(department)) {
      swalError("คุณไม่มีสิทธิ์ลบแผนก");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบแผนก "${department.name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(department.id);

      const response = await fetch(`/api/admin/departments/${department.id}`, {
        method: "DELETE",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Delete failed");
      }

      setDepartments((previous) =>
        previous.filter((item) => item.id !== department.id)
      );

      swalSuccess("ลบข้อมูลเรียบร้อยแล้ว");
    } catch (requestError) {
      console.error(requestError);
      swalError(requestError.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  if (loadingUser) return <LoadingOrb />;
  if (!user || !canView) return null;

  const canSubmitModal = editingDepartment
    ? canEditRecord(editingDepartment)
    : canCreate;

  return (
    <div className="space-y-6">
      <DepartmentHeader canCreate={canCreate} onCreate={handleOpenCreate} />

      <DepartmentSearch value={search} onChange={setSearch} />

      <DepartmentViewSwitcher value={viewMode} onChange={setViewMode} />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {viewMode === "table" && (
        <DepartmentTableView
          loading={loading}
          departments={departments}
          deletingId={deletingId}
          canEditRecord={canEditRecord}
          canDeleteRecord={canDeleteRecord}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      {viewMode === "matrix" && (
        <DepartmentMatrixView
          loading={loading}
          departments={departments}
          branches={branches}
          deletingId={deletingId}
          canEdit={canEdit}
          canDelete={canDelete}
          canEditRecord={canEditRecord}
          canDeleteRecord={canDeleteRecord}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      <DepartmentFormModal
        open={openModal}
        form={form}
        setForm={setForm}
        branches={branches}
        editingDepartment={editingDepartment}
        saving={saving}
        canSubmit={canSubmitModal}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </div>
  );
}
