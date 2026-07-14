"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Select } from "antd";
import { swalConfirm, swalError, swalSuccess } from "../../../components/Swal";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../../../components/LoadingOrb";
import { RiLineFill } from "react-icons/ri";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import {PayrollCompanySelect,PayrollTypeSelect,} from "@/app/components/selectors";

const initialForm = {
  first_name_th: "",
  last_name_th: "",
  first_name_en: "",
  last_name_en: "",
  nick_name: "",
  gender: "",
  phone: "",
  email: "",
  nationality: "thai",
  hire_date: "",
  employment_type: "",
  branch_group_id: "",
  branch_id: "",
  department_id: "",
  division_id: "",
  unit_id: "",
  position_id: "",
  job_id: "",
  business_unit_id: "",
  cost_center_id: "",
  profit_center_id: "",
  employee_status_id: "",
  resignation_date: "",
  employee_photo_url: "",
  status: "active",
  citizen_id: "",
  passport_no: "",
  birth_date: "",
  line_id: "",
  payroll_company_id: "",
  payroll_type_id: "",
  payment_day: null,
};

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [units, setUnits] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [employeeStatuses, setEmployeeStatuses] = useState([]);
  const [citizenIdError, setCitizenIdError] = useState("");
  const [citizenIdSuccess, setCitizenIdSuccess] = useState("");
  const [passportError, setPassportError] = useState("");
  const [passportSuccess, setPassportSuccess] = useState("");
  const [branchGroups, setBranchGroups] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [profitCenters, setProfitCenters] = useState([]);

  // เปิด modal ครั้งแรก ต้องรอโหลด master data ก่อน
  const [openingModal, setOpeningModal] = useState(false);

  // กัน master data ถูกโหลดซ้ำทุกครั้งที่เปิด modal
  const masterDataLoadedRef = useRef(false);
  const masterDataLoadingPromiseRef = useRef(null);

  // กันโหลด employees ซ้ำตอน mount (mount effect + debounce effect ชนกัน)
  const isFirstSearchRunRef = useRef(true);

  // Cascading fetch: กันข้อมูล division/unit เก่าค้างมาปนตอน department/division เปลี่ยน
  // (ใช้ token กันกรณีเปลี่ยน department เร็ว ๆ แล้ว response เก่ามาทับ response ใหม่)
  const divisionsRequestTokenRef = useRef(0);
  const unitsRequestTokenRef = useRef(0);
  const [divisionsLoading, setDivisionsLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);

  // Partition
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Photo upload
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // Crop รูป
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [photoZoom, setPhotoZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Lazy load Position
  const [positionLoading, setPositionLoading] = useState(false);
  const [positionPage, setPositionPage] = useState(1);
  const [positionTotalPages, setPositionTotalPages] = useState(1);
  const [positionKeyword, setPositionKeyword] = useState("");

  // เอาข้อมูล Payroll มาใส่ในพนักงาน
  const [selectedPayrollCompany, setSelectedPayrollCompany] = useState(null);
  const [selectedPayrollType, setSelectedPayrollType] = useState(null);

  // #region Permission
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const canView = hasPermission(user, "ems.employees.view");
  const canCreate = hasPermission(user, "ems.employees.create");
  const canEdit = hasPermission(user, "ems.employees.edit");
  const canDelete = hasPermission(user, "ems.employees.delete");

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [user, canView, loadingUser, router]);
  // #endregion

  const loadBusinessUnits = async () => {
    const res = await fetch("/api/admin/business-units", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load business units failed");
    setBusinessUnits(data.data || []);
  };

  const loadCostCenters = async () => {
    const res = await fetch("/api/admin/cost-centers", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load cost centers failed");
    setCostCenters(data.data || []);
  };

  const loadProfitCenters = async () => {
    const res = await fetch("/api/admin/profit-centers", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load profit centers failed");
    setProfitCenters(data.data || []);
  };

  const loadBranchGroups = async () => {
    const res = await fetch("/api/admin/branch-groups", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load branch groups failed");
    setBranchGroups(data.data || []);
  };

  const loadJobs = async () => {
    const res = await fetch("/api/admin/jobs", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load jobs failed");
    setJobs(data.data || []);
  };

  const loadEmploymentTypes = async () => {
    const res = await fetch("/api/admin/employment-types", {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Load employment types failed");
    }

    setEmploymentTypes(data.data || []);
  };

  const loadBranches = async () => {
    const res = await fetch("/api/admin/branches", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load branches failed");
    setBranches(data.data || []);
  };

  const loadDepartments = async () => {
    const res = await fetch("/api/admin/departments", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load departments failed");
    setDepartments(data.data || []);
  };

  /**
   * Cascading fetch — โหลดเฉพาะ division ของ department ที่เลือก
   * แทนการโหลดทั้งหมดด้วย all=true แล้ว filter ฝั่ง client
   */
  const loadDivisionsByDepartment = async (departmentId) => {
    if (!departmentId) {
      setDivisions([]);
      return;
    }

    const token = ++divisionsRequestTokenRef.current;

    try {
      setDivisionsLoading(true);

      const params = new URLSearchParams({
        department_id: departmentId,
        all: "true",
      });

      const res = await fetch(`/api/admin/divisions?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Load divisions failed");

      // ถ้าระหว่างนี้ department ถูกเปลี่ยนไปแล้ว ไม่ต้องเอา response เก่ามา set ทับ
      if (token !== divisionsRequestTokenRef.current) return;

      setDivisions(
        (data.data || []).map((item) => ({
          id: item.id,
          division_name: item.division_name,
          department_id: item.department_id,
          department_name: item.department_name || "",
          status: item.status,
        }))
      );
    } catch (err) {
      if (token !== divisionsRequestTokenRef.current) return;
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูลฝ่ายได้");
    } finally {
      if (token === divisionsRequestTokenRef.current) {
        setDivisionsLoading(false);
      }
    }
  };

  /**
   * Cascading fetch — โหลดเฉพาะ unit ของ division ที่เลือก
   * แทนการโหลดทั้งหมดด้วย all=true แล้ว filter ฝั่ง client
   */
  const loadUnitsByDivision = async (divisionId) => {
    if (!divisionId) {
      setUnits([]);
      return;
    }

    const token = ++unitsRequestTokenRef.current;

    try {
      setUnitsLoading(true);

      const params = new URLSearchParams({
        division_id: divisionId,
        all: "true",
      });

      const res = await fetch(`/api/admin/units?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Load units failed");

      if (token !== unitsRequestTokenRef.current) return;

      setUnits(
        (data.data || []).map((item) => ({
          id: item.id,
          unit_name: item.unit_name,
          division_id: item.division_id,
          division_name: item.division_name || "",
          department_name: item.department_name || "",
          status: item.status,
        }))
      );
    } catch (err) {
      if (token !== unitsRequestTokenRef.current) return;
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูลหน่วยงานได้");
    } finally {
      if (token === unitsRequestTokenRef.current) {
        setUnitsLoading(false);
      }
    }
  };

  const loadEmployeeStatuses = async () => {
    const res = await fetch("/api/admin/employee-statuses", {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Load employee statuses failed");
    }

    setEmployeeStatuses(data.data || []);
  };

  /**
   * Master data (branches / departments / employment types / employee statuses /
   * branch groups / jobs / business units / cost centers / profit centers)
   * ใช้แค่ตอนเปิด modal เพิ่ม/แก้ไขพนักงานเท่านั้น ไม่จำเป็นต้องโหลดตั้งแต่เปิดหน้า list
   *
   * หมายเหตุ: divisions/units ไม่รวมอยู่ในนี้แล้ว เพราะเปลี่ยนไปใช้ cascading fetch
   * ตาม department_id/division_id ที่เลือก (ดู loadDivisionsByDepartment / loadUnitsByDivision)
   *
   * โหลดครั้งแรกที่ user กด "เพิ่มพนักงาน" หรือ "Edit" เท่านั้น แล้ว cache ไว้
   * ไม่ยิงซ้ำทุกครั้งที่เปิด modal
   */
  const loadMasterData = useCallback(() => {
    if (masterDataLoadedRef.current) return Promise.resolve();

    // กันกดเปิด modal รัว ๆ แล้วยิงซ้ำซ้อนหลาย request
    if (masterDataLoadingPromiseRef.current) {
      return masterDataLoadingPromiseRef.current;
    }

    const promise = Promise.all([
      loadBranches(),
      loadDepartments(),
      loadEmploymentTypes(),
      loadEmployeeStatuses(),
      loadBranchGroups(),
      loadJobs(),
      loadBusinessUnits(),
      loadCostCenters(),
      loadProfitCenters(),
    ])
      .then(() => {
        masterDataLoadedRef.current = true;
      })
      .finally(() => {
        masterDataLoadingPromiseRef.current = null;
      });

    masterDataLoadingPromiseRef.current = promise;
    return promise;
  }, []);

  const loadPositions = async (keyword = "", nextPage = 1, append = false) => {
    try {
      setPositionLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("pageSize", "20");

      if (keyword) params.set("search", keyword);

      const res = await fetch(`/api/admin/positions?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load positions failed");
      }

      setPositions((prev) =>
        append ? [...prev, ...(data.data || [])] : data.data || []
      );

      setPositionPage(data.pagination?.page || nextPage);
      setPositionTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูลตำแหน่งได้");
    } finally {
      setPositionLoading(false);
    }
  };

  const loadEmployees = async (keyword = "", currentPage = 1) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (keyword) params.set("search", keyword);
      params.set("page", String(currentPage));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/admin/employees?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load employees failed");
      }

      setEmployees(data.data || []);
      setPage(data.pagination?.page || 1);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const selectedPosition = useMemo(() => { return positions.find((item) => item.id === form.position_id);}, [positions, form.position_id]);
  const selectedJob = useMemo(() => {return jobs.find((item) => item.id === form.job_id);}, [jobs, form.job_id]);
  const selectedEmploymentType = useMemo(() => { return employmentTypes.find( (item) => item.type_code === form.employment_type); }, [employmentTypes, form.employment_type]);
  const effectiveManagementLevel = selectedJob?.management_level || selectedPosition?.position_level || "";
  const effectiveScopeType = selectedJob?.scope_type || "";
  const isAllScope = effectiveScopeType === "all";
  const isCompanyScope = effectiveScopeType === "company";
  const isBranchGroupScope = effectiveScopeType === "branch_group";
  const isBranchScope = effectiveScopeType === "branch";
  const isDepartmentScope = effectiveScopeType === "department";
  const isDivisionScope = effectiveScopeType === "division";
  const isUnitScope = effectiveScopeType === "unit";
  const isExecutiveLevel = ["P11", "P12"].includes(effectiveManagementLevel);
  const isOperationLevel = !effectiveScopeType && !["P9", "P10", "P11", "P12"].includes(effectiveManagementLevel);

  // โหลดแค่ employees ตอนเปิดหน้า — master data ทั้งหมดย้ายไปโหลดแบบ lazy
  // ตอนกดเปิด modal แทน (ดู loadMasterData)
  useEffect(() => {
    loadEmployees();
  }, []);

  // Debounce search — ข้ามการรันครั้งแรกตอน mount เพราะ mount effect
  // ด้านบนโหลด employees ไปแล้ว ป้องกันการยิง API ซ้ำ 2 รอบตอนเปิดหน้า
  useEffect(() => {
    if (isFirstSearchRunRef.current) {
      isFirstSearchRunRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      loadEmployees(search, 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Cascading fetch: department_id เปลี่ยนเมื่อไหร่ (ไม่ว่าจะจากการเลือกเอง,
  // เปลี่ยนสาขาแล้วถูก reset, หรือ setForm ตอนเปิด modal edit) ให้โหลด
  // division ของ department นั้นอัตโนมัติ — department_id ว่างจะ clear list ให้เอง
  useEffect(() => {
    loadDivisionsByDepartment(form.department_id);
  }, [form.department_id]);

  // Cascading fetch: division_id เปลี่ยนเมื่อไหร่ ให้โหลด unit ของ division
  // นั้นอัตโนมัติเช่นกัน
  useEffect(() => {
    loadUnitsByDivision(form.division_id);
  }, [form.division_id]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingEmployee(null);
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
  };

  const handleOpenCreate = async () => {
    if (!canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มข้อมูลพนักงาน");
      return;
    }

    resetForm();

    try {
      setOpeningModal(true);
      await loadMasterData();
      setOpenModal(true);
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูล master ได้");
    } finally {
      setOpeningModal(false);
    }
  };

  const handleOpenEdit = async (employee) => {
    if (!canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงาน");
      return;
    }

    try {
      setOpeningModal(true);
      await loadMasterData();
    } catch (err) {
      console.error(err);
      swalError(err.message || "ไม่สามารถโหลดข้อมูล master ได้");
      setOpeningModal(false);
      return;
    }

    // กัน Select แสดง UUID กรณี position_id ไม่อยู่ใน options ที่ lazy load มา
    if (employee.position_id) {
      setPositions((prev) => {
        const exists = prev.some((item) => item.id === employee.position_id);
        if (exists) return prev;

        return [
          {
            id: employee.position_id,
            position_name: employee.position_name || "ไม่ระบุตำแหน่ง",
            position_level: employee.position_level || "",
            status: "active",
          },
          ...prev,
        ];
      });
    }

    // กัน Job Select แสดง UUID กรณี job_id ไม่อยู่ใน options
    if (employee.job_id) {
      setJobs((prev) => {
        const exists = prev.some((item) => item.id === employee.job_id);
        if (exists) return prev;

        return [
          {
            id: employee.job_id,
            job_code: employee.job_code || "",
            job_name: employee.job_name || "ไม่ระบุ Job",
            job_level: employee.job_level || "",
            management_level: employee.management_level || "",
            scope_type: employee.scope_type || "",
            job_color: employee.job_color || "#E2E8F0",
            job_icon: employee.job_icon || "",
          },
          ...prev,
        ];
      });
    }

    setEditingEmployee(employee);

    // ตั้ง form ครั้งเดียว — department_id/division_id ที่ set ตรงนี้จะไป trigger
    // useEffect cascading fetch ให้เองอัตโนมัติ (โหลด division ของ department นี้
    // และ unit ของ division นี้) ไม่ต้องเรียก loadDivisionsByDepartment/
    // loadUnitsByDivision ซ้ำตรงนี้
    setForm({
      first_name_th: employee.first_name_th || "",
      last_name_th: employee.last_name_th || "",
      first_name_en: employee.first_name_en || "",
      last_name_en: employee.last_name_en || "",
      nick_name: employee.nick_name || "",
      gender: employee.gender || "",
      phone: employee.phone || "",
      email: employee.email || "",
      nationality: employee.nationality || "thai",
      hire_date: employee.hire_date || "",
      employment_type: employee.employment_type || "",
      branch_id: employee.branch_id || "",
      branch_group_id: employee.branch_group_id || "",
      department_id: employee.department_id || "",
      division_id: employee.division_id || "",
      unit_id: employee.unit_id || "",
      position_id: employee.position_id || "",
      employee_status_id: employee.employee_status_id || "",
      resignation_date: employee.resignation_date || "",
      employee_photo_url: employee.employee_photo_url || "",
      status: employee.status || "active",
      citizen_id: employee.citizen_id || "",
      passport_no: employee.passport_no || "",
      birth_date: employee.birth_date || "",
      line_id: employee.line_id || "",
      job_id: employee.job_id || "",
      business_unit_id: employee.business_unit_id || "",
      cost_center_id: employee.cost_center_id || "",
      profit_center_id: employee.profit_center_id || "",
      payroll_company_id: employee.payroll_company_id || "", 
      payroll_type_id: employee.payroll_type_id || "",
      payment_day: employee.payment_day === null || employee.payment_day === undefined ? null : Number(employee.payment_day),
      
    });


    setSelectedPayrollCompany({
      id: employee.payroll_company_id || "",
      payroll_company_code:
        employee.payroll_company_code || "",
      payroll_company_name:
        employee.payroll_company_name || "",
      company_name:
        employee.payroll_company_master_name || "",
      company_tax_id:
        employee.payroll_company_tax_id || "",
    });

    setSelectedPayrollType({
      id: employee.payroll_type_id || "",
      payroll_type_code:
        employee.payroll_type_code || "",
      payroll_type_name:
        employee.payroll_type_name || "",
      payment_frequency:
        employee.payment_frequency || "",
      default_payment_day:
        employee.default_payment_day ?? null,
    });

    setPhotoFile(null);
    setPhotoPreview(employee.employee_photo_url || "");
    setCrop({ x: 0, y: 0 });
    setPhotoZoom(1);
    setCroppedAreaPixels(null);
    setOpeningModal(false);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const filteredDepartments = useMemo(() => {
    if (!form.branch_id) return departments;
    return departments.filter((dep) =>
      (dep.branch_ids || []).includes(form.branch_id)
    );
  }, [departments, form.branch_id]);

  const filteredCostCenters = useMemo(() => {
    if (!form.business_unit_id) return costCenters;
    return costCenters.filter(
      (item) => item.business_unit_id === form.business_unit_id
    );
  }, [costCenters, form.business_unit_id]);

  const filteredProfitCenters = useMemo(() => {
    if (!form.business_unit_id) return profitCenters;
    return profitCenters.filter(
      (item) => item.business_unit_id === form.business_unit_id
    );
  }, [profitCenters, form.business_unit_id]);

  const handlePhotoChange = (file) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      swalError("รองรับเฉพาะไฟล์ JPG, PNG, WEBP");
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      swalError("ไฟล์รูปต้องมีขนาดไม่เกิน 50 MB");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setPhotoZoom(1);
    setCroppedAreaPixels(null);
  };

  const createCroppedPhotoFile = async () => {
    if (!photoFile || !photoPreview) return photoFile;

    if (!croppedAreaPixels) {
      throw new Error("กรุณาจัดตำแหน่งรูปก่อนบันทึก");
    }

    return await getCroppedImg(photoPreview, croppedAreaPixels);
  };

  const uploadEmployeePhoto = async (file, employeeId = "") => {
    if (!file) return form.employee_photo_url || "";

    try {
      setUploadingPhoto(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("employeeId", employeeId || "");

      const res = await fetch("/api/admin/employees/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Upload photo failed");
      }

      return data?.url || "";
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    const isEdit = !!editingEmployee;

    const selectedStatus = employeeStatuses.find(
      (item) => item.id === form.employee_status_id
    );

    if (isEdit && !canEdit) {
      swalError("คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงาน");
      return;
    }

    if (!isEdit && !canCreate) {
      swalError("คุณไม่มีสิทธิ์เพิ่มข้อมูลพนักงาน");
      return;
    }

    if (!form.first_name_th.trim() || !form.last_name_th.trim()) {
      swalError("กรุณากรอกชื่อและนามสกุล");
      return;
    }

    if (!form.hire_date) {
      swalError("กรุณาเลือกวันที่เริ่มงาน");
      return;
    }

    if (!form.employment_type) {
      swalError("กรุณาเลือกประเภทการจ้าง");
      return;
    }

    if (!form.employee_status_id) {
      swalError("ประเภทการจ้างนี้ยังไม่ได้กำหนดสถานะพนักงานเริ่มต้น");
      return;
    }

    if (!form.position_id) {
      swalError("กรุณาเลือกตำแหน่ง");
      return;
    }

    if (isExecutiveLevel && !form.job_id) {
      swalError("กรุณาเลือก Job สำหรับตำแหน่งผู้บริหาร");
      return;
    }

    if (isBranchGroupScope && !form.branch_group_id) {
      swalError("กรุณาเลือกกรุ๊ปสังกัด");
      return;
    }

    if ((isBranchScope || isOperationLevel) && !form.branch_id) {
      swalError("กรุณาเลือกสาขา");
      return;
    }

    if ((isDepartmentScope || isOperationLevel) && !form.department_id) {
      swalError("กรุณาเลือกแผนก");
      return;
    }

    if ((isDivisionScope || isOperationLevel) && !form.division_id) {
      swalError("กรุณาเลือกฝ่าย");
      return;
    }

    if ((isUnitScope || isOperationLevel) && !form.unit_id) {
      swalError("กรุณาเลือกหน่วยงาน");
      return;
    }

    if (form.citizen_id && !isValidThaiCitizenId(form.citizen_id)) {
      swalError("เลขบัตรประชาชนไม่ถูกต้อง");
      return;
    }

    if (form.passport_no && !isValidPassportNo(form.passport_no)) {
      swalError("รูปแบบ Passport ไม่ถูกต้อง");
      return;
    }

    if (!form.nationality) {
      swalError("กรุณาเลือกสัญชาติ");
      return;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      swalError("กรุณากรอก Email ให้ถูกต้อง");
      return;
    }

    if (selectedStatus?.status_code === "RESIGNED" && !form.resignation_date) {
      swalError("กรุณาระบุวันที่ลาออก");
      return;
    }

    if (selectedJob?.business_unit_required && !form.business_unit_id) {
      swalError("กรุณาเลือก Business Unit");
      return;
    }

    if (selectedJob?.cost_center_required && !form.cost_center_id) {
      swalError("กรุณาเลือก Cost Center");
      return;
    }

    if (selectedJob?.profit_center_required && !form.profit_center_id) {
      swalError("กรุณาเลือก Profit Center");
      return;
    }

    if (!form.payroll_company_id) {
      swalError("กรุณาเลือก Payroll Company");
      return;
    }

    if (!form.payroll_type_id) {
      swalError("กรุณาเลือก Payroll Type");
      return;
    }

    try {
      setSaving(true);
      let employeePhotoUrl = form.employee_photo_url || "";
      if (photoFile) {
        const croppedFile = await createCroppedPhotoFile();
        employeePhotoUrl = await uploadEmployeePhoto(
          croppedFile,
          editingEmployee?.id || ""
        );
      }

      const payload = {
        ...form,
        employee_photo_url: employeePhotoUrl,
        branch_group_id: isBranchGroupScope ? form.branch_group_id : null,
        branch_id: isBranchScope || isOperationLevel ? form.branch_id : null,
        department_id: isDepartmentScope || isOperationLevel ? form.department_id : null,
        division_id: isDivisionScope || isOperationLevel ? form.division_id : null,
        unit_id: isUnitScope || isOperationLevel ? form.unit_id : null,
        job_id: form.job_id || null,
        business_unit_id: form.business_unit_id || null,
        cost_center_id: form.cost_center_id || null,
        profit_center_id: form.profit_center_id || null,
        payroll_company_id: form.payroll_company_id || null,
        payroll_type_id: form.payroll_type_id || null,
      };

      const url = isEdit
        ? `/api/admin/employees/${editingEmployee.id}`
        : "/api/admin/employees";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      if (isEdit) {
        setEmployees((prev) =>
          prev.map((item) => (item.id === data.data.id ? data.data : item))
        );
        swalSuccess("อัพเดทข้อมูลพนักงานเรียบร้อยแล้ว");
        await loadEmployees(search, page);
      } else {
        swalSuccess("เพิ่มข้อมูลพนักงานเรียบร้อยแล้ว");
        setPage(1);
        await loadEmployees(search, 1);
      }

      handleCloseModal();
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employee) => {
    if (!canDelete) {
      swalError("คุณไม่มีสิทธิ์ลบข้อมูลพนักงาน");
      return;
    }

    const confirmed = await swalConfirm(
      `ต้องการลบพนักงาน "${employee.full_name_th}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(employee.id);

      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setEmployees((prev) => prev.filter((item) => item.id !== employee.id));
      swalSuccess("ลบข้อมูลพนักงานเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      swalError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setDeletingId("");
    }
  };

  const formatThaiCitizenId = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 13);

  return digits
      .replace(/^(\d{1})(\d{0,4})(\d{0,5})(\d{0,2})(\d{0,1}).*/, (_, a, b, c, d, e) =>
        [a, b, c, d, e].filter(Boolean).join("-")
      );
  };

  const cleanThaiCitizenId = (value) => {
    return value.replace(/\D/g, "").slice(0, 13);
  };

  const isValidThaiCitizenId = (value) => {
    const digits = cleanThaiCitizenId(value);

    if (digits.length !== 13) return false;

    const sum = digits
      .slice(0, 12)
      .split("")
      .reduce((total, digit, index) => {
        return total + Number(digit) * (13 - index);
      }, 0);

    const checkDigit = (11 - (sum % 11)) % 10;

    return checkDigit === Number(digits[12]);
  };

  const cleanPassportNo = (value) => {
    return value.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 12);
  };

  const isValidPassportNo = (value) => {
    const passport = cleanPassportNo(value);

    if (!passport) return true;

    // รองรับ Passport หลายประเทศ: ตัวอักษร/ตัวเลข 6-12 ตัว
    return /^[A-Z0-9]{6,12}$/.test(passport);
  };

  // #region Permission
  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;
  // #endregion

  return (
    <div className="space-y-6">

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">พนักงาน</h1>
            <p className="mt-1 text-sm text-slate-500">
              จัดการข้อมูลพนักงานทั้งหมดในระบบ
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              disabled={openingModal}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {openingModal ? "กำลังโหลด..." : "+ เพิ่มพนักงาน"}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="ค้นหา : ชื่อ / นามสกุล / รหัสพนักงาน / สาขา / แผนก / ฝ่าย / เลขบัตรประชาชน / Passport / Line ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(pageSize)].map((_, i) => (
              <div key={i} className="rounded-3xl border border-slate-200 p-5">
                <div className="flex gap-4">
                  <div className="h-20 w-20 animate-pulse rounded-3xl bg-slate-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : employees.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {employees.map((employee) => {
              const isProtectedEmployee =
                employee.employee_code === "EMP000001" ||
                employee.full_name_th?.toLowerCase() === "system admin";

              const initials =
                employee.full_name_th
                  ?.split(" ")
                  ?.map((word) => word?.[0])
                  ?.join("")
                  ?.slice(0, 2) || "EMP";

              const statusClass =
                employee.employee_status_color === "green"
                  ? "bg-green-100 text-green-700 ring-green-200"
                  : employee.employee_status_color === "yellow"
                  ? "bg-yellow-100 text-yellow-700 ring-yellow-200"
                  : employee.employee_status_color === "red"
                  ? "bg-red-100 text-red-600 ring-red-200"
                  : employee.employee_status_color === "orange"
                  ? "bg-orange-100 text-orange-700 ring-orange-200"
                  : employee.employee_status_color === "blue"
                  ? "bg-blue-100 text-blue-700 ring-blue-200"
                  : "bg-slate-100 text-slate-600 ring-slate-200";

              return (
                <div
                  key={employee.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
                >
                  <div className="h-20 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500" />

                  <div className="-mt-10 px-5 pb-5">
                    <div className="flex items-end justify-between gap-3">
                      <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-md">
                        {employee.employee_photo_url ? (
                          <img
                            src={employee.employee_photo_url}
                            alt={employee.full_name_th || "Employee"}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-lg font-bold text-slate-500">
                            {initials}
                          </div>
                        )}
                      </div>

                      <span
                        className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClass}`}
                      >
                        {employee.employee_status_name || "-"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {employee.employee_code || "-"}
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-slate-800">
                        {employee.full_name_th || "-"}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {employee.position_name || "ไม่ระบุตำแหน่ง"}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs text-slate-400">สาขา</p>
                        <p className="mt-1 font-medium text-slate-700">
                          {employee.branch_name || "-"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs text-slate-400">ฝ่าย</p>
                          <p className="mt-1 truncate font-medium text-slate-700">
                            {employee.division_name || "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs text-slate-400">แผนก</p>
                          <p className="mt-1 truncate font-medium text-slate-700">
                            {employee.department_name || "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(employee)}
                          disabled={isProtectedEmployee || openingModal}
                          className={`rounded-xl border px-4 py-2 text-xs font-semibold ${
                            isProtectedEmployee || openingModal
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                              : "border-slate-300 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {isProtectedEmployee ? "Protected" : "Edit"}
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(employee)}
                          disabled={deletingId === employee.id || isProtectedEmployee}
                          className={`rounded-xl border px-4 py-2 text-xs font-semibold ${
                            deletingId === employee.id || isProtectedEmployee
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                              : "border-red-200 text-red-600 hover:bg-red-50"
                          }`}
                        >
                          {deletingId === employee.id
                            ? "Deleting..."
                            : isProtectedEmployee
                            ? "Protected"
                            : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 py-14 text-center text-sm text-slate-400">
            ไม่พบข้อมูลพนักงาน
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">ทั้งหมด {total} รายการ</p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => loadEmployees(search, page - 1)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ก่อนหน้า
            </button>

            <span className="text-sm text-slate-600">
              หน้า {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => loadEmployees(search, page + 1)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="modal-scrollbar max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingEmployee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงาน"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                เลือกตำแหน่งและ Job เพื่อให้ระบบแสดงโครงสร้างองค์กรตาม Scope
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="mb-4 text-base font-bold text-slate-800">
                  รูปพนักงาน
                </h3>

                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-64 w-64 overflow-hidden rounded-3xl bg-slate-900">
                      {photoPreview ? (
                        <Cropper
                          image={photoPreview}
                          crop={crop}
                          zoom={photoZoom}
                          aspect={1}
                          cropShape="rect"
                          showGrid={true}
                          onCropChange={setCrop}
                          onZoomChange={setPhotoZoom}
                          onCropComplete={(_, croppedPixels) => {
                            setCroppedAreaPixels(croppedPixels);
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white text-xs text-slate-400">
                          ไม่มีรูป
                        </div>
                      )}
                    </div>

                    {photoPreview && (
                      <div className="w-64 space-y-3">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                            <span>Zoom</span>
                            <span>{photoZoom.toFixed(2)}x</span>
                          </div>

                          <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.05"
                            value={photoZoom}
                            onChange={(e) => setPhotoZoom(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setCrop({ x: 0, y: 0 });
                            setPhotoZoom(1);
                          }}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Reset ตำแหน่งรูป
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                        Upload รูป
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                        />
                      </label>

                      {photoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview("");
                            setForm((prev) => ({
                              ...prev,
                              employee_photo_url: "",
                            }));
                          }}
                          className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          ลบรูป
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 50 MB
                    </p>

                    {uploadingPhoto && (
                      <p className="text-xs text-slate-500">กำลังอัปโหลดรูป...</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="mb-3 text-base font-bold text-slate-800">
                  ข้อมูลส่วนตัว
                </h3>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อ (TH)
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.first_name_th}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^ก-๙\s]/g, "");
                    setForm((prev) => ({ ...prev, first_name_th: val }));
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  นามสกุล (TH)
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.last_name_th}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^ก-๙\s]/g, "");
                    setForm((prev) => ({ ...prev, last_name_th: val }));
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อ (EN)
                </label>
                <input
                  type="text"
                  value={form.first_name_en}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                    setForm((prev) => ({ ...prev, first_name_en: val }));
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  นามสกุล (EN)
                </label>
                <input
                  type="text"
                  value={form.last_name_en}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                    setForm((prev) => ({ ...prev, last_name_en: val }));
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ชื่อเล่น
                </label>
                <input
                  type="text"
                  value={form.nick_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nick_name: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  เพศ
                </label>
                <select
                  value={form.gender}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, gender: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">เลือกเพศ</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  โทรศัพท์
                </label>
                <PhoneInput
                  defaultCountry="th"
                  forceDialCode={true}
                  disableFormatting={false}
                  value={form.phone}
                  onChange={(value) => {
                    let phone = value ?? "";
                    phone = phone.replace(/^\+660/, "+66");
                    setForm((prev) => ({ ...prev, phone }));
                  }}
                  inputClassName="!w-full !rounded-r-2xl !border-slate-300 !px-4 !py-3 !text-sm focus:!border-slate-500 focus:!ring-4 focus:!ring-slate-100 !h-auto"
                  countrySelectorStyleProps={{
                    buttonClassName:
                      "!rounded-l-2xl !border-slate-300 !px-3 !h-auto !py-3",
                  }}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  placeholder="example@email.com"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  เลขบัตรประชาชน
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  type="text"
                  maxLength={17}
                  value={formatThaiCitizenId(form.citizen_id)}
                  onChange={(e) => {
                    const val = cleanThaiCitizenId(e.target.value);

                    setForm((prev) => ({
                      ...prev,
                      citizen_id: val,
                    }));

                    if (!val) {
                      setCitizenIdError("");
                      setCitizenIdSuccess("");
                      return;
                    }

                    if (val.length < 13) {
                      setCitizenIdError("กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก");
                      setCitizenIdSuccess("");
                      return;
                    }

                    if (!isValidThaiCitizenId(val)) {
                      setCitizenIdError("เลขบัตรประชาชนไม่ถูกต้อง");
                      setCitizenIdSuccess("");
                      return;
                    }

                    setCitizenIdError("");
                    setCitizenIdSuccess("✓ เลขบัตรประชาชนถูกต้อง");
                  }}
                  placeholder="1-2345-67890-12-3"
                  className={`w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all ${
                    citizenIdError
                      ? "border border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                      : citizenIdSuccess
                      ? "border border-green-500 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                      : "border border-slate-300 focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                  }`}
                />

                {citizenIdError && (
                  <p className="mt-1 text-xs text-red-500">{citizenIdError}</p>
                )}

                {citizenIdSuccess && (
                  <p className="mt-1 text-xs font-medium text-green-600">
                    {citizenIdSuccess}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Passport
                </label>

                <input
                  type="text"
                  value={form.passport_no}
                  onChange={(e) => {
                    const val = cleanPassportNo(e.target.value);

                    setForm((prev) => ({
                      ...prev,
                      passport_no: val,
                    }));

                    if (!val) {
                      setPassportError("");
                      setPassportSuccess("");
                      return;
                    }

                    if (val.length < 6) {
                      setPassportError("กรุณากรอก Passport อย่างน้อย 6 ตัวอักษร");
                      setPassportSuccess("");
                      return;
                    }

                    if (!isValidPassportNo(val)) {
                      setPassportError("รูปแบบ Passport ไม่ถูกต้อง");
                      setPassportSuccess("");
                      return;
                    }

                    setPassportError("");
                    setPassportSuccess("Passport ถูกต้อง");
                  }}
                  placeholder="Passport Number"
                  className={`w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all ${
                    passportError
                      ? "border border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                      : passportSuccess
                      ? "border border-green-500 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                      : "border border-slate-300 focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                  }`}
                />

                {passportError && (
                  <p className="mt-1 text-xs text-red-500">{passportError}</p>
                )}

                {passportSuccess && (
                  <p className="mt-1 text-xs font-medium text-green-600">
                    ✓ {passportSuccess}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  วัน/เดือน/ปี เกิด
                </label>

                <input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      birth_date: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  LINE ID
                </label>

                <div className="group flex overflow-hidden rounded-2xl border border-slate-300 bg-white transition-all focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
                  <div className="flex items-center justify-center border-r border-slate-200 bg-green-500 px-4 text-xl text-white">
                    <RiLineFill />
                  </div>

                  <input
                    type="text"
                    value={form.line_id}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, "").replace(/^@+/, "");
                      setForm((prev) => ({ ...prev, line_id: value }));
                    }}
                    placeholder="line id"
                    className="w-full bg-transparent px-4 py-3 text-sm outline-none"
                  />
                </div>

                {form.line_id && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <span>LINE:</span>
                    <a
                      href={`https://line.me/ti/p/~${form.line_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-green-600 hover:underline"
                    >
                      @{form.line_id}
                    </a>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 border-t border-slate-200 pt-5">
                <h3 className="mb-3 text-base font-bold text-slate-800">
                  ข้อมูลการจ้างงาน / โครงสร้างองค์กร
                </h3>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  สัญชาติ
                </label>
                <select
                  value={form.nationality}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nationality: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="thai">ไทย</option>
                  <option value="non_b">ต่างชาติ Non-B</option>
                  <option value="myanmar">สัญชาติพม่า</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  วันที่เริ่มงาน
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.hire_date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, hire_date: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ประเภทการจ้าง
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <select
                  value={form.employment_type}
                  onChange={(e) => {
                    const typeCode = e.target.value;

                    const selectedType = employmentTypes.find(
                      (item) => item.type_code === typeCode
                    );

                    setForm((prev) => ({
                      ...prev,
                      employment_type: typeCode,
                      employee_status_id: selectedType?.default_employee_status_id || "",
                      resignation_date: "",
                    }));
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">เลือกประเภทการจ้าง</option>

                  {employmentTypes
                    .filter((item) => item.status === "active")
                    .map((item) => (
                      <option key={item.id} value={item.type_code}>
                        {item.type_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ตำแหน่ง
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <Select
                  showSearch
                  allowClear
                  filterOption={false}
                  placeholder="เลือกตำแหน่ง"
                  value={form.position_id || undefined}
                  onSearch={(value) => {
                    setPositionKeyword(value);
                    setPositionPage(1);
                    loadPositions(value, 1, false);
                  }}
                  onPopupScroll={(e) => {
                    const target = e.target;
                    const isBottom =
                      target.scrollTop + target.offsetHeight >=
                      target.scrollHeight - 20;

                    if (
                      isBottom &&
                      !positionLoading &&
                      positionPage < positionTotalPages
                    ) {
                      loadPositions(positionKeyword, positionPage + 1, true);
                    }
                  }}
                  onFocus={() => {
                    if (positions.length === 0) {
                      setPositionKeyword("");
                      setPositionPage(1);
                      loadPositions("", 1, false);
                    }
                  }}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      position_id: value ?? "",
                      job_id: "",
                      branch_group_id: "",
                      branch_id: "",
                      department_id: "",
                      division_id: "",
                      unit_id: "",
                    }))
                  }
                  notFoundContent={
                    positionLoading ? "กำลังโหลดตำแหน่ง..." : "ไม่พบข้อมูล"
                  }
                  options={positions.map((p) => ({
                    value: p.id,
                    label: `${p.position_name}${
                      p.position_level ? ` (${p.position_level})` : ""
                    }`,
                  }))}
                  className="w-full"
                  size="large"
                />
              </div>

              {["P9", "P10", "P11", "P12"].includes(
                selectedPosition?.position_level || ""
              ) && (
                <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Job / Business Role
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <Select
                    showSearch
                    allowClear
                    placeholder="เลือก Job ตามบทบาทงาน"
                    value={form.job_id || undefined}
                    onChange={(value) => {
                      const job = jobs.find((item) => item.id === value);

                      setForm((prev) => ({
                        ...prev,
                        job_id: value ?? "",
                        branch_group_id:
                          job?.scope_type === "branch_group"
                            ? prev.branch_group_id
                            : "",
                        branch_id:
                          job?.scope_type === "branch" ? prev.branch_id : "",
                        department_id:
                          job?.scope_type === "department"
                            ? prev.department_id
                            : "",
                        division_id:
                          job?.scope_type === "division" ? prev.division_id : "",
                        unit_id: job?.scope_type === "unit" ? prev.unit_id : "",
                      }));
                    }}
                    options={jobs.map((job) => ({
                      value: job.id,
                      label: `${job.job_icon || ""} ${job.job_code} - ${
                        job.job_name
                      }${
                        job.management_level ? ` (${job.management_level})` : ""
                      }`,
                    }))}
                    className="w-full"
                    size="large"
                  />

                  {selectedJob && (
                    <div
                      className="mt-4 rounded-2xl px-4 py-3 text-sm"
                      style={{
                        backgroundColor: selectedJob.job_color || "#E2E8F0",
                      }}
                    >
                      <p className="font-semibold text-slate-800">
                        {selectedJob.job_icon || "👤"} {selectedJob.job_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Level: {selectedJob.management_level || "-"} / Scope:{" "}
                        {selectedJob.scope_type || "-"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {isBranchGroupScope && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    กรุ๊ปสังกัด
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <Select
                    showSearch
                    allowClear
                    placeholder="เลือกกรุ๊ปสังกัด"
                    value={form.branch_group_id || undefined}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        branch_group_id: value ?? "",
                      }))
                    }
                    options={branchGroups.map((group) => ({
                      value: group.id,
                      label: group.group_name,
                    }))}
                    className="w-full"
                    size="large"
                  />
                </div>
              )}

              {(isBranchScope || isOperationLevel) && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    สาขา
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <Select
                    showSearch
                    allowClear
                    placeholder="เลือกสาขา"
                    value={form.branch_id || undefined}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        branch_id: value ?? "",
                        department_id: "",
                        division_id: "",
                        unit_id: "",
                      }))
                    }
                    options={branches.map((b) => ({
                      value: b.id,
                      label: b.branch_name,
                    }))}
                    className="w-full"
                    size="large"
                  />
                </div>
              )}

              {(isDepartmentScope || isOperationLevel) && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    แผนก
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <Select
                    showSearch
                    allowClear
                    placeholder="เลือกแผนก"
                    value={form.department_id || undefined}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        department_id: value ?? "",
                        division_id: "",
                        unit_id: "",
                      }))
                    }
                    options={filteredDepartments.map((d) => ({
                      value: d.id,
                      label: d.department_name,
                    }))}
                    className="w-full"
                    size="large"
                  />
                </div>
              )}

              {(isDivisionScope || isOperationLevel) && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    ฝ่าย
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <Select
                    showSearch
                    allowClear
                    disabled={!form.department_id}
                    placeholder={
                      form.department_id ? "เลือกฝ่าย" : "กรุณาเลือกแผนกก่อน"
                    }
                    value={form.division_id || undefined}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        division_id: value ?? "",
                        unit_id: "",
                      }))
                    }
                    notFoundContent={
                      divisionsLoading ? "กำลังโหลดฝ่าย..." : "ไม่พบข้อมูล"
                    }
                    options={divisions.map((d) => ({
                      value: d.id,
                      label: `${d.division_name}${
                        d.department_name ? ` (${d.department_name})` : ""
                      }`,
                    }))}
                    className="w-full"
                    size="large"
                  />
                </div>
              )}

              {(isUnitScope || isOperationLevel) && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    หน่วยงาน
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <Select
                    showSearch
                    allowClear
                    disabled={!form.division_id}
                    placeholder={
                      form.division_id ? "เลือกหน่วยงาน" : "กรุณาเลือกฝ่ายก่อน"
                    }
                    value={form.unit_id || undefined}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        unit_id: value ?? "",
                      }))
                    }
                    notFoundContent={
                      unitsLoading ? "กำลังโหลดหน่วยงาน..." : "ไม่พบข้อมูล"
                    }
                    options={units.map((u) => ({
                      value: u.id,
                      label: `${u.unit_name}${
                        u.division_name ? ` (${u.division_name})` : ""
                      }`,
                    }))}
                    className="w-full"
                    size="large"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Payroll Company
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <PayrollCompanySelect
                  value={form.payroll_company_id}
                  onChange={(payrollCompanyId, payrollCompany) => {
                    setForm((prev) => ({
                      ...prev,
                      payroll_company_id:
                        payrollCompanyId || "",
                      payroll_type_id:
                        payrollCompany?.payroll_type_id || "",
                      payment_day:
                        payrollCompany?.payment_day ?? null,
                    }));

                    setSelectedPayrollCompany(
                      payrollCompany || null
                    );
                  }}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Payroll Type
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <PayrollTypeSelect
                  value={form.payroll_type_id}
                  onChange={(payrollTypeId, payrollType) => {
                    setForm((prev) => ({
                      ...prev,
                      payroll_type_id:
                        payrollTypeId || "",
                      payment_day:
                        payrollType?.default_payment_day ??
                        null,
                    }));

                    setSelectedPayrollType(
                      payrollType || null
                    );
                  }}
                />
              </div>

              <div className="md:col-span-2 border-t border-slate-200 pt-5">
                <h3 className="mb-3 text-base font-bold text-slate-800">
                  ข้อมูลบัญชี / ต้นทุนเงินเดือน
                </h3>

                <p className="mb-4 text-xs text-slate-500">
                  ใช้กำหนดว่าพนักงานคนนี้กินเงินเดือน และค่าใช้จ่ายอยู่ใน Business Unit / Cost Center / Profit Center ใด
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Business Unit
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <Select
                  showSearch
                  allowClear
                  placeholder="เลือก Business Unit"
                  value={form.business_unit_id || undefined}
                  optionFilterProp="label"
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      business_unit_id: value ?? "",
                      cost_center_id: "",
                      profit_center_id: "",
                    }))
                  }
                  options={businessUnits
                    .filter((item) => item.status === "active")
                    .map((item) => ({
                      value: item.id,
                      label: `${item.business_unit_code} - ${item.business_unit_name}`,
                    }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Cost Center
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <Select
                  showSearch
                  allowClear
                  placeholder="เลือก Cost Center"
                  value={form.cost_center_id || undefined}
                  optionFilterProp="label"
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      cost_center_id: value ?? "",
                    }))
                  }
                  options={filteredCostCenters
                    .filter((item) => item.status === "active")
                    .map((item) => ({
                      value: item.id,
                      label: `${item.cost_center_code} - ${item.cost_center_name}`,
                    }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Profit Center
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <Select
                  showSearch
                  allowClear
                  placeholder="เลือก Profit Center"
                  value={form.profit_center_id || undefined}
                  optionFilterProp="label"
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      profit_center_id: value ?? "",
                    }))
                  }
                  options={filteredProfitCenters
                    .filter((item) => item.status === "active")
                    .map((item) => ({
                      value: item.id,
                      label: `${item.profit_center_code} - ${item.profit_center_name}`,
                    }))}
                  className="w-full"
                  size="large"
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  เงื่อนไขจาก Job
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span
                    className={`rounded-full px-3 py-1 ${
                      selectedJob?.business_unit_required
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    Business Unit {selectedJob?.business_unit_required ? "Required" : "Optional"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 ${
                      selectedJob?.cost_center_required
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    Cost Center {selectedJob?.cost_center_required ? "Required" : "Optional"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 ${
                      selectedJob?.profit_center_required
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    Profit Center {selectedJob?.profit_center_required ? "Required" : "Optional"}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2 border-t border-slate-200 pt-5">
                <h3 className="mb-3 text-base font-bold text-slate-800">
                  สถานะพนักงาน
                </h3>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  สถานะพนักงาน
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <select
                  value={form.employee_status_id}
                  onChange={(e) => {
                    const statusId = e.target.value;

                    const selectedStatus = employeeStatuses.find(
                      (item) => item.id === statusId
                    );

                    setForm((prev) => ({
                      ...prev,
                      employee_status_id: statusId,
                      resignation_date:
                        selectedStatus?.status_code === "RESIGNED"
                          ? prev.resignation_date
                          : "",
                    }));
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">เลือกสถานะพนักงาน</option>

                  {employeeStatuses
                    .filter((item) => item.status === "active")
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.status_name}
                      </option>
                    ))}
                </select>

                {employeeStatuses.find(
                  (item) =>
                    item.id === form.employee_status_id &&
                    item.status_code === "RESIGNED"
                ) && (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-red-600">
                      วันที่ลาออก <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="date"
                      value={form.resignation_date || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          resignation_date: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-red-300 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 z-10 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving || uploadingPhoto}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              {((editingEmployee && canEdit) || (!editingEmployee && canCreate)) && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || uploadingPhoto}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${
                    saving || uploadingPhoto
                      ? "cursor-not-allowed bg-slate-400"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {saving || uploadingPhoto
                    ? "Saving..."
                    : editingEmployee
                    ? "Update"
                    : "Save"}
                </button>
              )}
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
}



/*
 Job
├── สิทธิ์การบริหาร
├── สิทธิ์การแสดงผล
├── โครงสร้างองค์กร
├── โครงสร้างบัญชี
└── Workflow Template

Employee Scope Assignment
├── View Scope
├── Manage Scope
├── Approve Scope
├── Accounting Scope
└── Budget Scope


*/