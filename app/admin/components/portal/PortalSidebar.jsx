"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Button,
  Empty,
  Spin,
  Tooltip,
} from "antd";

import {
  LockOutlined,
  LogoutOutlined,
} from "@ant-design/icons";


import {
  getPortalIcon,
} from "../iconMap";

import {
  PORTAL_SIDEBAR,
} from "./portalLayoutConfig";
import Link from "next/link";


/*
จากเดิม
{renderIcon(
  menu.icon_code
)}
เปลี่ยน
{getPortalIcon(
  item.icon_code
)}
*/

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ApartmentOutlined,
  ApiOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DollarOutlined,
  DownOutlined,
  FileTextOutlined,
  GiftOutlined,
  IdcardOutlined,
  KeyOutlined,
  LoadingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NumberOutlined,
  PartitionOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  ToolOutlined,
  UserAddOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";

const PORTAL_MENU_API = "/api/admin/portal-menu";
const CHANGE_PASSWORD_PATH = "/admin/change-password";

const ICON_REGISTRY = {
  appstore:
    AppstoreOutlined,

  dashboard:
    DashboardOutlined,

  team:
    TeamOutlined,

  user:
    UserOutlined,

  user_add:
    UserAddOutlined,

  idcard:
    IdcardOutlined,

  setting:
    SettingOutlined,

  number:
    NumberOutlined,

  apartment:
    ApartmentOutlined,

  bank:
    BankOutlined,

  solution:
    SolutionOutlined,

  partition:
    PartitionOutlined,

  dollar:
    DollarOutlined,

  wallet:
    WalletOutlined,

  calendar:
    CalendarOutlined,

  gift:
    GiftOutlined,

  tool:
    ToolOutlined,

  file:
    FileTextOutlined,

  key:
    KeyOutlined,

  security:
    SafetyCertificateOutlined,

  api:
    ApiOutlined,

  audit:
    AuditOutlined,
};

function normalizeIconCode(
  value = ""
) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );
}

function getIconComponent(
  iconCode
) {
  const key =
    normalizeIconCode(
      iconCode
    );

  return (
    ICON_REGISTRY[key] ||
    AppstoreOutlined
  );
}

function renderIcon(
  iconCode
) {
  const IconComponent =
    getIconComponent(
      iconCode
    );

  return <IconComponent />;
}

function isExternalHref(
  href = ""
) {
  return /^https?:\/\//i.test(
    String(href)
  );
}

function normalizePathname(
  href = ""
) {
  if (
    !href ||
    isExternalHref(href)
  ) {
    return "";
  }

  return String(href)
    .split("?")[0]
    .trim();
}

function getHrefSearch(
  href = ""
) {
  if (
    !href ||
    isExternalHref(href) ||
    !href.includes("?")
  ) {
    return "";
  }

  return (
    href.split("?")[1] ||
    ""
  );
}

export default function PortalSidebar({
  user,

  collapsed = false,
  setCollapsed,

  mobileOpen = false,
  setMobileOpen,

  loggingOut,
  onLogout,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [portalMenus,setPortalMenus,] = useState([]);
  const [loadingMenus,setLoadingMenus,] = useState(true);
  const [menuError,setMenuError,] = useState("");
  const [openGroup,setOpenGroup,] = useState("");
  const [openNestedGroups,setOpenNestedGroups,] = useState(() => new Set());
  const [isScrolling,setIsScrolling,] = useState(false);
  const scrollTimeoutRef = useRef(null);

  const loadPortalMenus = useCallback(
      async () => {
        setLoadingMenus(true);

        setMenuError("");

        try {
          const response =
            await fetch(
              PORTAL_MENU_API,
              {
                method: "GET",

                cache:
                  "no-store",
              }
            );

          const payload =
            await response
              .json()
              .catch(
                () => null
              );

          if (!response.ok) {
            throw new Error(
              payload?.error ||
                "ไม่สามารถโหลด Portal Menu ได้"
            );
          }

          setPortalMenus(
            Array.isArray(
              payload?.data
            )
              ? payload.data
              : []
          );
        } catch (error) {
          console.error(
            "PORTAL_SIDEBAR_LOAD_ERROR:",
            error
          );

          setPortalMenus([]);

          setMenuError(
            error?.message ||
              "ไม่สามารถโหลดเมนูได้"
          );
        } finally {
          setLoadingMenus(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    loadPortalMenus();
  }, [
    loadPortalMenus,
  ]);

  const isActiveItem =
    useCallback(
      (item) => {
        if (
          !item?.href ||
          item.menu_type ===
            "group"
        ) {
          return false;
        }

        if (
          isExternalHref(
            item.href
          )
        ) {
          return false;
        }

        const targetPath =
          normalizePathname(
            item.href
          );

        if (!targetPath) {
          return false;
        }

        const pathMatch =
          pathname ===
            targetPath ||
          pathname.startsWith(
            `${targetPath}/`
          );

        if (!pathMatch) {
          return false;
        }

        /*
         * ถ้า href มี query
         * เช่น:
         * /admin/employees?mode=create
         *
         * ต้องตรวจ query ด้วย
         */
        const hrefSearch =
          getHrefSearch(
            item.href
          );

        if (!hrefSearch) {
          return true;
        }

        const targetParams =
          new URLSearchParams(
            hrefSearch
          );

        for (
          const [
            key,
            value,
          ] of targetParams.entries()
        ) {
          if (
            searchParams.get(
              key
            ) !== value
          ) {
            return false;
          }
        }

        return true;
      },
      [
        pathname,
        searchParams,
      ]
    );

  /* =======================================================
     Active Recursive
  ======================================================= */

  const hasActiveChild =
    useCallback(
      (item) => {
        if (
          isActiveItem(item)
        ) {
          return true;
        }

        if (
          !Array.isArray(
            item?.children
          )
        ) {
          return false;
        }

        return item.children.some(
          (child) =>
            hasActiveChild(
              child
            )
        );
      },
      [isActiveItem]
    );

  const isActiveGroup =
    useCallback(
      (group) => {
        if (
          !Array.isArray(
            group?.children
          )
        ) {
          return false;
        }

        return group.children.some(
          (item) =>
            hasActiveChild(
              item
            )
        );
      },
      [hasActiveChild]
    );

  /* =======================================================
     Active Top Group
  ======================================================= */

  const activeGroupKey =
    useMemo(() => {
      const activeGroup =
        portalMenus.find(
          (menu) =>
            Array.isArray(
              menu?.children
            ) &&
            isActiveGroup(
              menu
            )
        );

      return (
        activeGroup?.key ||
        ""
      );
    }, [
      isActiveGroup,
      portalMenus,
    ]);

  /* =======================================================
     Auto Open Active Nested Parents
  ======================================================= */

  const collectActiveParentKeys =
    useCallback(
      (
        items = [],
        result = new Set()
      ) => {
        for (
          const item of items
        ) {
          if (
            !Array.isArray(
              item?.children
            ) ||
            item.children.length ===
              0
          ) {
            continue;
          }

          const active =
            item.children.some(
              (child) =>
                hasActiveChild(
                  child
                )
            );

          if (active) {
            result.add(
              item.key
            );
          }

          collectActiveParentKeys(
            item.children,
            result
          );
        }

        return result;
      },
      [hasActiveChild]
    );

  useEffect(() => {
    if (
      loadingMenus ||
      portalMenus.length === 0
    ) {
      return;
    }

    /* =====================================================
      หน้า Portal หลัก
      /admin = ไม่เปิด Group ใดอัตโนมัติ
    ===================================================== */

    if (pathname === "/admin") {
      setOpenGroup("");

      setOpenNestedGroups(
        new Set()
      );

      return;
    }

    /* =====================================================
      หน้าอื่น
      เปิดเฉพาะ Group ที่มี Active Menu
    ===================================================== */

    if (activeGroupKey) {
      setOpenGroup(
        activeGroupKey
      );
    }

    /* =====================================================
      เปิด Nested Group ที่มี Active Menu อยู่ข้างใน
    ===================================================== */

    const activeParents =
      collectActiveParentKeys(
        portalMenus
      );

    setOpenNestedGroups(
      activeParents
    );
  }, [
    pathname,
    activeGroupKey,
    collectActiveParentKeys,
    loadingMenus,
    portalMenus,
  ]);

  const handleSidebarScroll =
    () => {
      setIsScrolling(true);

      if (
        scrollTimeoutRef.current
      ) {
        clearTimeout(
          scrollTimeoutRef.current
        );
      }

      scrollTimeoutRef.current =
        setTimeout(() => {
          setIsScrolling(
            false
          );
        }, 800);
    };

  useEffect(() => {
    return () => {
      if (
        scrollTimeoutRef.current
      ) {
        clearTimeout(
          scrollTimeoutRef.current
        );
      }
    };
  }, []);

  const navigateMenu =
    (item) => {
      if (!item) {
        return;
      }

      const hasChildren =
        Array.isArray(
          item.children
        ) &&
        item.children.length >
          0;

      if (
        item.menu_type ===
          "group" ||
        (
          hasChildren &&
          !item.href
        )
      ) {
        toggleNestedGroup(
          item.key
        );

        return;
      }

      if (!item.href) {
        return;
      }

      setMobileOpen?.(
        false
      );

      if (
        item.open_mode ===
          "external" ||
        isExternalHref(
          item.href
        )
      ) {
        window.open(
          item.href,
          "_blank",
          "noopener,noreferrer"
        );

        return;
      }

      if (
        item.open_mode ===
        "hard"
      ) {
        window.location.href =
          item.href;

        return;
      }

      router.push(
        item.href
      );
    };

  const toggleGroup =
    (group) => {
      if (!group?.key) {
        return;
      }

      setOpenGroup(
        (current) =>
          current ===
          group.key
            ? ""
            : group.key
      );
    };

  const toggleNestedGroup =
    (key) => {
      if (!key) {
        return;
      }

      setOpenNestedGroups(
        (current) => {
          const next =
            new Set(current);

          if (
            next.has(key)
          ) {
            next.delete(key);
          } else {
            next.add(key);
          }

          return next;
        }
      );
    };

  const handleCollapsedGroupClick =
    (group) => {
      setCollapsed?.(
        false
      );

      setOpenGroup(
        group.key
      );
    };

  const renderNestedItems =
    (
      items = [],
      depth = 0
    ) => {
      return items.map(
        (item) => {
          const hasChildren =
            Array.isArray(
              item?.children
            ) &&
            item.children.length >
              0;

          const isGroup =
            item.menu_type ===
              "group" ||
            hasChildren;

          const active =
            isActiveItem(
              item
            );

          const childActive =
            hasChildren &&
            item.children.some(
              (child) =>
                hasActiveChild(
                  child
                )
            );

          const nestedOpen =
            openNestedGroups.has(
              item.key
            );

          if (isGroup) {
            return (
              <div
                key={
                  item.key
                }
                className="space-y-1"
              >
                <button
                  type="button"
                  onClick={() =>
                    toggleNestedGroup(
                      item.key
                    )
                  }
                  className={`
                    group/item
                    relative
                    flex w-full
                    items-start gap-3
                    rounded-lg
                    px-3 py-2.5
                    text-left
                    transition-all
                    duration-200
                    ${
                      childActive ||
                      nestedOpen
                        ? "bg-white/5 text-white"
                        : "text-blue-100/65 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <span
                    className={`
                      mt-0.5
                      shrink-0
                      text-sm
                      ${
                        childActive
                          ? "text-blue-300"
                          : "text-blue-100/45"
                      }
                    `}
                  >
                    {renderIcon(
                      item.icon_code
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block whitespace-normal break-words text-sm font-semibold leading-5">
                      {item.label}
                    </span>

                    {item.subtitle && (
                      <span className="mt-1 block whitespace-normal break-words text-[11px] leading-4 text-blue-100/35">
                        {item.subtitle}
                      </span>
                    )}
                  </span>

                  <DownOutlined
                    className={`
                      mt-1
                      shrink-0
                      text-[9px]
                      text-blue-100/45
                      transition-transform
                      duration-300
                      ${
                        nestedOpen
                          ? "rotate-180"
                          : ""
                      }
                    `}
                  />
                </button>

                <AnimatePresence
                  initial={false}
                >
                  {nestedOpen && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                      }}
                      animate={{
                        opacity: 1,
                        height:
                          "auto",
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                      }}
                      transition={{
                        duration:
                          0.22,
                      }}
                      className="overflow-hidden"
                    >
                      <div
                        className="border-l border-blue-100/10 pl-3"
                        style={{
                          marginLeft:
                            depth === 0
                              ? 8
                              : 6,
                        }}
                      >
                        {renderNestedItems(
                          item.children,
                          depth + 1
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <button
              key={
                item.key
              }
              type="button"
              onClick={() =>
                navigateMenu(
                  item
                )
              }
              className={`
                group/item
                relative
                flex w-full
                items-start gap-3
                rounded-lg
                px-3 py-2.5
                text-left
                transition-all
                duration-200
                ${
                  active
                    ? "bg-blue-500/10 text-white"
                    : "text-blue-100/65 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <span
                className={`
                  mt-0.5
                  shrink-0
                  text-sm
                  transition-transform
                  group-hover/item:scale-110
                  ${
                    active
                      ? "text-blue-300"
                      : "text-blue-100/45"
                  }
                `}
              >
                {renderIcon(
                  item.icon_code
                )}
              </span>

              <span className="min-w-0 flex-1 overflow-hidden">
                <span className="block whitespace-normal break-words text-sm font-semibold leading-5">
                  {item.label}
                </span>

                {item.subtitle && (
                  <span className="mt-1 block whitespace-normal break-words text-[11px] leading-4 text-blue-100/35">
                    {item.subtitle}
                  </span>
                )}
              </span>

              {active && (
                <motion.span
                  layoutId="portal-active-dot"
                  className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-sky-300"
                />
              )}
            </button>
          );
        }
      );
    };

  /* =======================================================
     Mobile Account Actions
  ======================================================= */

  const handleMobileChangePassword = () => {
    setMobileOpen?.(false);
    router.push(CHANGE_PASSWORD_PATH);
  };

  const handleMobileLogout = async () => {
    if (loggingOut) {
      return;
    }

    setMobileOpen?.(false);
    await onLogout?.();
  };

  const renderSidebarContent = ({
    responsive = false,
  } = {}) => {

     const sidebarCollapsed = responsive
      ? false
      : collapsed;
    return (
      <div className="flex h-full flex-col bg-gradient-to-b from-[#224a70] via-[#173a5d] to-[#102f50] text-white shadow-xl">
        {/* =================================================
            Brand
        ================================================= */}

        <div className="flex h-[92px] items-center justify-between border-b border-white/10 px-5">
          {!sidebarCollapsed && (
            <motion.div
              initial={{
                opacity: 0,
                x: -10,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.25,
              }}
              className="flex min-w-0 items-center gap-3"
            >
              <Link
                href="/admin"
                onClick={() =>
                  setMobileOpen?.(false)
                }
                className="
                  flex
                  min-w-0
                  flex-1
                  items-center
                  gap-3
                  transition-opacity
                  duration-200
                  hover:opacity-80
                "
              >
                <div className="grid h-12 w-12 shrink-0 grid-cols-2 gap-1 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg shadow-blue-900/30">
                  <span className="rounded-sm bg-white" />
                  <span className="rounded-sm bg-white" />
                  <span className="rounded-sm bg-white" />
                  <span className="rounded-sm bg-white" />
                </div>

                <div
                  className="
                    flex
                    min-w-0
                    flex-1
                    flex-col
                    justify-center
                  "
                >
                  <div className="truncate text-lg font-bold leading-5 tracking-wide text-white">
                    HR System
                  </div>

                  <div className="mt-1 truncate text-[10px] font-semibold uppercase leading-4 tracking-[0.18em] text-blue-100/50">
                    People Management
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          <Button
            type="text"
            shape="circle"
            icon={
              responsive ? (
                <MenuFoldOutlined />
              ) : collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={() => {
              if (responsive) {
                setMobileOpen?.(
                  false
                );

                return;
              }

              setCollapsed?.(
                (current) =>
                  !current
              );
            }}
            className="!h-11 !w-11 !shrink-0 !bg-white/5 !text-white/70 hover:!bg-white/10 hover:!text-white"
          />
        </div>

        {/* =================================================
            Workspace
        ================================================= */}

        {!sidebarCollapsed && (
          <div className="px-5 pb-2 pt-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/45">
              Workspace
            </div>
          </div>
        )}

        {/* =================================================
            Loading
        ================================================= */}

        {loadingMenus && (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Spin
              indicator={
                <LoadingOutlined
                  spin
                  className="!text-white"
                />
              }
            />
          </div>
        )}

        {/* =================================================
            Error
        ================================================= */}

        {!loadingMenus &&
          menuError && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
              <div className="text-sm text-red-200">
                {menuError}
              </div>

              <Button
                size="small"
                onClick={
                  loadPortalMenus
                }
              >
                ลองใหม่
              </Button>
            </div>
          )}

        {/* =================================================
            Empty
        ================================================= */}

        {!loadingMenus &&
          !menuError &&
          portalMenus.length ===
            0 && (
            <div className="flex min-h-0 flex-1 items-center justify-center px-4">
              <Empty
                image={
                  Empty.PRESENTED_IMAGE_SIMPLE
                }
                description={
                  <span className="text-xs text-blue-100/50">
                    ยังไม่มีเมนู Portal
                  </span>
                }
              />
            </div>
          )}

        {/* =================================================
            Menu
        ================================================= */}

        {!loadingMenus &&
          !menuError &&
          portalMenus.length >
            0 && (
            <div
              onScroll={
                handleSidebarScroll
              }
              className={`sidebar-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-5 pt-2 ${
                isScrolling
                  ? "is-scrolling"
                  : ""
              }`}
            >
              {portalMenus.map(
                (menu) => {
                  const hasChildren =
                    Array.isArray(
                      menu?.children
                    ) &&
                    menu.children
                      .length >
                      0;

                  const parentActive =
                    hasChildren
                      ? isActiveGroup(
                          menu
                        )
                      : isActiveItem(
                          menu
                        );

                  const isOpen =
                    openGroup ===
                    menu.key;

                  /* =======================================
                     Link Menu
                  ======================================= */

                  if (!hasChildren) {
                    if (
                      sidebarCollapsed
                    ) {
                      return (
                        <Tooltip
                          key={
                            menu.key
                          }
                          title={
                            menu.label
                          }
                          placement="right"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              navigateMenu(
                                menu
                              )
                            }
                            className={`
                              relative
                              flex h-12 w-full
                              items-center justify-center
                              rounded-xl
                              transition-all
                              duration-300
                              ${
                                parentActive
                                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-950/30"
                                  : "text-white/70 hover:bg-white/10 hover:text-white"
                              }
                            `}
                          >
                            <span className="text-xl">
                              {renderIcon(
                                menu.icon_code
                              )}
                            </span>

                            {parentActive && (
                              <span className="absolute left-0 h-7 w-1 rounded-r-full bg-sky-400" />
                            )}
                          </button>
                        </Tooltip>
                      );
                    }

                    return (
                      <button
                        key={
                          menu.key
                        }
                        type="button"
                        onClick={() =>
                          navigateMenu(
                            menu
                          )
                        }
                        className={`
                          relative
                          flex w-full
                          items-center gap-3
                          rounded-xl
                          px-3 py-3
                          text-left
                          transition-all
                          duration-300
                          ${
                            parentActive
                              ? "bg-[#285783] text-white shadow-md"
                              : "text-white/80 hover:bg-white/5 hover:text-white"
                          }
                        `}
                      >
                        {parentActive && (
                          <span className="absolute left-0 h-8 w-1 rounded-r-full bg-sky-400" />
                        )}

                        <span
                          className={`
                            flex h-9 w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            ${
                              parentActive
                                ? "bg-blue-500/25 text-blue-100"
                                : "bg-white/5 text-blue-100/75"
                            }
                          `}
                        >
                          {renderIcon(
                            menu.icon_code
                          )}
                        </span>

                        <span className="min-w-0 flex-1 overflow-hidden">
                          <span className="block whitespace-normal break-words text-sm font-semibold leading-5">
                            {menu.label}
                          </span>

                          {menu.subtitle && (
                            <span className="mt-1 block whitespace-normal break-words text-[11px] leading-4 text-blue-100/45">
                              {menu.subtitle}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  }

                  /* =======================================
                     Collapsed Group
                  ======================================= */

                  if (
                    collapsed &&
                    !responsive
                  ) {
                    return (
                      <Tooltip
                        key={
                          menu.key
                        }
                        title={
                          menu.label
                        }
                        placement="right"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleCollapsedGroupClick(
                              menu
                            )
                          }
                          className={`
                            relative
                            flex h-12 w-full
                            items-center justify-center
                            rounded-xl
                            transition-all
                            duration-300
                            ${
                              parentActive
                                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-950/30"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }
                          `}
                        >
                          <span className="text-xl">
                            {renderIcon(
                              menu.icon_code
                            )}
                          </span>

                          {parentActive && (
                            <span className="absolute left-0 h-7 w-1 rounded-r-full bg-sky-400" />
                          )}
                        </button>
                      </Tooltip>
                    );
                  }

                  /* =======================================
                     Expanded Group
                  ======================================= */

                  return (
                    <div
                      key={
                        menu.key
                      }
                      className="space-y-1"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleGroup(
                            menu
                          )
                        }
                        className={`
                          relative
                          flex w-full
                          items-center gap-3
                          rounded-xl
                          border
                          px-3 py-3
                          text-left
                          transition-all
                          duration-300
                          ${
                            parentActive ||
                            isOpen
                              ? "border-blue-400/20 bg-[#285783] text-white shadow-md"
                              : "border-transparent text-white/80 hover:bg-white/5 hover:text-white"
                          }
                        `}
                      >
                        {(parentActive ||
                          isOpen) && (
                          <span className="absolute left-0 h-8 w-1 rounded-r-full bg-sky-400" />
                        )}

                        <span
                          className={`
                            flex h-9 w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            ${
                              parentActive ||
                              isOpen
                                ? "bg-blue-500/25 text-blue-100"
                                : "bg-white/5 text-blue-100/75"
                            }
                          `}
                        >
                          {renderIcon(
                            menu.icon_code
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block whitespace-normal break-words text-sm font-semibold leading-5">
                            {
                              menu.label
                            }
                          </span>

                          {menu.subtitle && (
                            <span className="mt-1 block whitespace-normal break-words text-[11px] leading-4 text-blue-100/45">
                              {
                                menu.subtitle
                              }
                            </span>
                          )}
                        </span>

                        <DownOutlined
                          className={`
                            shrink-0
                            text-[10px]
                            text-blue-100/55
                            transition-transform
                            duration-300
                            ${
                              isOpen
                                ? "rotate-180"
                                : ""
                            }
                          `}
                        />
                      </button>

                      <AnimatePresence
                        initial={false}
                      >
                        {isOpen && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              height: 0,
                            }}
                            animate={{
                              opacity: 1,
                              height:
                                "auto",
                            }}
                            exit={{
                              opacity: 0,
                              height: 0,
                            }}
                            transition={{
                              duration:
                                0.22,
                            }}
                            className="overflow-hidden"
                          >
                            <div className="ml-5 border-l border-blue-100/15 py-2 pl-3">
                              {renderNestedItems(
                                menu.children
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
              )}
            </div>
          )}

        {/* =================================================
            Mobile Account
        ================================================= */}

        {responsive && (
          <div className="shrink-0 border-t border-white/10 bg-[#102f50]/95 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            <div className="mb-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <div className="truncate text-sm font-semibold text-white">
                {user?.full_name ||
                  user?.username ||
                  "ผู้ใช้งาน"}
              </div>

              <div className="mt-1 truncate text-[11px] text-blue-100/50">
                {user?.role_name ||
                  user?.role ||
                  "User"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={
                  handleMobileChangePassword
                }
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LockOutlined />
                <span>เปลี่ยนรหัสผ่าน</span>
              </button>

              <button
                type="button"
                disabled={
                  loggingOut ||
                  !onLogout
                }
                onClick={
                  handleMobileLogout
                }
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-300/15 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogoutOutlined />
                <span>
                  {loggingOut
                    ? "กำลังออก..."
                    : "ออกจากระบบ"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* =======================================================
     Render
  ======================================================= */

  return (
    <>
      {/* ===================================================
          Desktop
      =================================================== */}

      <aside
        className={`
          fixed
          bottom-0
          left-0
          top-0
          z-40
          hidden
          h-screen

          transition-[width]
          duration-300
          ease-[cubic-bezier(0.22,1,0.36,1)]
          lg:block
          ${
            collapsed
              ? "w-[var(--portal-sidebar-collapsed)]"
              : `
                w-[var(--portal-sidebar-lg)]
                xl:w-[var(--portal-sidebar-xl)]
                2xl:w-[var(--portal-sidebar-xxl)]
              `
          }
        `}
        style={{
          "--portal-sidebar-collapsed":
            `${PORTAL_SIDEBAR.collapsed}px`,
          "--portal-sidebar-lg":
            `${PORTAL_SIDEBAR.lg}px`,
          "--portal-sidebar-xl":
            `${PORTAL_SIDEBAR.xl}px`,
          "--portal-sidebar-xxl":
            `${PORTAL_SIDEBAR.xxl}px`,
        }}
      >
        {renderSidebarContent()}
      </aside>

      {/* ===================================================
        Mobile
      =================================================== */}

      {/* <AnimatePresence> */}
        {mobileOpen && (
          <>
            {/* ===============================================
                Mobile Backdrop
            =============================================== */}

            <motion.button
              key="portal-mobile-backdrop"
              type="button"
              aria-label="ปิดเมนู"
              className="
                fixed
                inset-0
                z-[60]
                bg-slate-950/55
                

                lg:hidden
              "
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.28,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              onClick={() =>
                setMobileOpen?.(
                  false
                )
              }
            />

            {/* ===============================================
                Mobile Sidebar
            =============================================== */}

            <motion.aside
              key="portal-mobile-sidebar"
              className="
                fixed
                bottom-0
                left-0
                top-0
                z-[70]

                h-[100dvh]

                overflow-hidden

                shadow-2xl

                lg:hidden
              "
              style={{
                width: `min(${PORTAL_SIDEBAR.mobile}px, 92vw)`,
                maxWidth: "92vw",
              }}
              initial={{
                x: "-100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "-100%",
              }}
              transition={{
                duration: 0.38,
                ease: [
                  0.16,
                  1,
                  0.3,
                  1,
                ],
              }}
            >
              {renderSidebarContent({
                responsive: true,
              })}
            </motion.aside>
          </>
        )}
      {/* </AnimatePresence> */}
    </>
  );
}