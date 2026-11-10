"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightOutlined,
  CalendarOutlined,
  LockOutlined,
  SolutionOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import LoadingOrb from "@/app/components/LoadingOrb";

type MenuNode = {
  system_code?: string | null;
  module_code?: string | null;
  label?: string | null;
  href?: string | null;
  children?: MenuNode[] | null;
};

type SystemKey = "recruitment" | "roadmap" | "leave" | "employees";

const SYSTEMS: {
  key: SystemKey;
  title: string;
  subtitle: string;
  description: string;
  path: string;
  keywords: string[];
  icon: typeof TeamOutlined;
  colors: string;
  iconColors: string;
}[] = [
    {
    key: "employees",
    title: "Management Employees",
    subtitle: "จัดการพนักงาน",
    description: "ดูและจัดการข้อมูลพนักงานในองค์กร",
    path: "/admin/employees",
    keywords: ["employee management", "management employees", "จัดการพนักงาน"],
    icon: TeamOutlined,
    colors: "from-amber-50 to-white hover:border-amber-300",
    iconColors: "bg-amber-100 text-amber-700",
  },
  {
    key: "roadmap",
    title: "Roadmap",
    subtitle: "ระบบประเมินพนักงาน",
    description: "ติดตามและจัดการผลการประเมินพนักงาน",
    path: "/roadmap",
    keywords: ["roadmap", "ประเมิน"],
    icon: TrophyOutlined,
    colors: "from-blue-50 to-white hover:border-blue-300",
    iconColors: "bg-blue-100 text-blue-700",
  },
  {
    key: "leave",
    title: "Leaveday System",
    subtitle: "ระบบจัดการวันลา",
    description: "ดูใบลา ตารางงาน การเข้างาน และรายงาน",
    path: "/leave",
    keywords: ["leave", "leaveday", "ลางาน", "วันลา"],
    icon: CalendarOutlined,
    colors: "from-emerald-50 to-white hover:border-emerald-300",
    iconColors: "bg-emerald-100 text-emerald-700",
  },
  //   {
  //   key: "recruitment",
  //   title: "Recruitment",
  //   subtitle: "ระบบสรรหาพนักงาน",
  //   description: "จัดการตำแหน่งงาน ผู้สมัคร และกระบวนการคัดเลือก",
  //   path: "/recruitment",
  //   keywords: ["recruitment", "recruit", "สรรหา"],
  //   icon: SolutionOutlined,
  //   colors: "from-violet-50 to-white hover:border-violet-300",
  //   iconColors: "bg-violet-100 text-violet-700",
  // },
];

function nodeHasPath(node: MenuNode, path: string): boolean {
  return node.href === path || node.href?.startsWith(`${path}/`) === true ||
    (node.children?.some((child) => nodeHasPath(child, path)) ?? false);
}

function findSystem(menu: MenuNode[], key: SystemKey): MenuNode | undefined {
  const config = SYSTEMS.find((system) => system.key === key);
  if (!config) return undefined;

  return menu.find((node) => {
    const identity = [node.system_code, node.module_code, node.label]
      .filter(Boolean).join(" ").toLowerCase();
    return config.keywords.some((word) => identity.includes(word)) ||
      nodeHasPath(node, config.path);
  });
}

function firstHref(node: MenuNode): string | undefined {
  if (node.href) return node.href;
  for (const child of node.children ?? []) {
    const href = firstHref(child);
    if (href) return href;
  }
  return undefined;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();
  const [menu, setMenu] = useState<MenuNode[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!loadingUser && !user) router.replace("/login");
  }, [loadingUser, user, router]);

  useEffect(() => {
    if (loadingUser || !user) return;
    const controller = new AbortController();

    async function loadMenu() {
      try {
        const response = await fetch("/api/admin/portal-menu", {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || "โหลดข้อมูลสิทธิ์ไม่สำเร็จ");
        }
        const data = Array.isArray(json.data) ? json.data :
          Array.isArray(json.data?.systems) ? json.data.systems :
          Array.isArray(json.systems) ? json.systems : [];
        setMenu(data);
        setLoadError("");
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : "โหลดข้อมูลสิทธิ์ไม่สำเร็จ");
      } finally {
        if (!controller.signal.aborted) setLoadingMenu(false);
      }
    }

    void loadMenu();
    return () => controller.abort();
  }, [loadingUser, user]);

  const cards = useMemo(() => SYSTEMS.map((system) => {
    const available = findSystem(menu, system.key);
    // The API already filters the tree by the signed-in user's permissions.
    const href = available ? firstHref(available) : undefined;
    return { ...system, href };
  }), [menu]);

  if (loadingUser || !user) return loadingUser ? <LoadingOrb /> : null;

  const displayName = user?.full_name || user?.username || "ผู้ใช้งาน";

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f4f7fb] px-4 py-8 text-slate-900 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 rounded-[28px] bg-[#132d4f] px-6 py-8 text-white shadow-lg sm:px-9 sm:py-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-sky-300">HRMS Enterprise</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">สวัสดี {displayName}</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-slate-200">
            เลือกระบบที่ต้องการใช้งานจากด้านล่าง
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold">เลือกระบบ</h2>
            <p className="mt-1 text-sm text-slate-500">กดการ์ดเพื่อเข้าสู่ระบบที่คุณได้รับสิทธิ์</p>
          </div>
          {loadingMenu && <span className="text-sm text-slate-500">กำลังตรวจสอบสิทธิ์...</span>}
        </div>

        {loadError && (
          <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError} — กรุณารีเฟรชหน้าแล้วลองอีกครั้ง
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {cards.map((system) => {
            const Icon = system.icon;
            const enabled = !loadingMenu && Boolean(system.href);
            return (
              <button key={system.key} type="button" disabled={!enabled}
                onClick={() => system.href && router.push(system.href)}
                className={`group flex min-h-[230px] flex-col rounded-[24px] border border-slate-200 bg-gradient-to-br p-6 text-left shadow-sm transition duration-200 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:p-7 ${system.colors} ${enabled ? "cursor-pointer hover:-translate-y-1 hover:shadow-xl" : "cursor-not-allowed opacity-55"}`}>
                <div className="flex w-full items-start justify-between gap-4">
                  <span className={`flex h-16 w-16 items-center justify-center rounded-2xl text-[28px] ${system.iconColors}`}>
                    <Icon aria-hidden="true" />
                  </span>
                  {enabled ? <ArrowRightOutlined className="mt-3 text-lg text-slate-400 transition-transform group-hover:translate-x-1" /> :
                    <LockOutlined className="mt-3 text-lg text-slate-400" />}
                </div>
                <span className="mt-6 text-xl font-bold sm:text-2xl">{system.title}</span>
                <span className="mt-1 text-sm font-semibold text-slate-600">{system.subtitle}</span>
                <span className="mt-3 text-sm leading-6 text-slate-500">{system.description}</span>
                {!loadingMenu && !enabled && <span className="mt-3 text-xs font-medium text-slate-500">บัญชีนี้ยังไม่มีสิทธิ์เข้าใช้งาน</span>}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
