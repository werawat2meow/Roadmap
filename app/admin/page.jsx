"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AutoComplete,
  Empty,
  Input,
  Skeleton,
  Typography,
} from "antd";

import {
  ApartmentOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  BankOutlined,
  GiftOutlined,
  ReadOutlined,
  SearchOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/contexts/AuthContext";

import LoadingOrb from "@/app/components/LoadingOrb";

import PortalShell from "./components/portal/PortalShell";

const {
  Title,
  Text,
} = Typography;

/* =========================================================
   API
========================================================= */

const PORTAL_MENU_API =
  "/api/admin/portal-menu";

/* =========================================================
   Helpers
========================================================= */

async function readJsonResponse(
  response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    return {};
  }
}

function cleanText(
  value
) {
  return String(
    value || ""
  ).trim();
}

function normalizePermission(
  value
) {
  return cleanText(
    value
  );
}

/* =========================================================
   Permission
========================================================= */

function isSuperAdmin(
  user
) {
  const roles = [
    user?.role,
    user?.role_code,
  ]
    .filter(Boolean)
    .map(
      (value) =>
        String(value)
          .trim()
          .toUpperCase()
    );

  return roles.includes(
    "SUPER_ADMIN"
  );
}

function hasPermission(
  user,
  permission
) {
  if (!permission) {
    return true;
  }

  if (
    isSuperAdmin(
      user
    )
  ) {
    return true;
  }

  const permissions =
    Array.isArray(
      user?.permissions
    )
      ? user.permissions
      : [];

  return permissions.includes(
    permission
  );
}

/* =========================================================
   Portal Menu Normalize
========================================================= */

function getLabel(
  item
) {
  return (
    item?.label ||
    item?.menu_name ||
    item?.group_name ||
    item?.system_name ||
    item?.title ||
    item?.name ||
    ""
  );
}

function getDescription(
  item
) {
  return (
    item?.description ||
    item?.subtitle ||
    item?.system_description ||
    item?.group_description ||
    ""
  );
}

function getHref(
  item
) {
  return (
    item?.href ||
    item?.menu_url ||
    item?.url ||
    item?.path ||
    ""
  );
}

function getPermission(
  item
) {
  return normalizePermission(
    item?.permission ||
      item?.permission_code ||
      item?.required_permission
  );
}

function getChildren(
  item
) {
  const children = [];

  [
    "items",
    "children",
    "menus",
    "groups",
    "sections",
  ].forEach(
    (key) => {
      if (
        Array.isArray(
          item?.[key]
        )
      ) {
        children.push(
          ...item[key]
        );
      }
    }
  );

  return children;
}

/* =========================================================
   Search Menu
========================================================= */

function flattenMenus(
  nodes,
  user,
  parentLabels = []
) {
  if (
    !Array.isArray(
      nodes
    )
  ) {
    return [];
  }

  const result = [];

  nodes.forEach(
    (item) => {
      const label =
        getLabel(
          item
        );

      const href =
        getHref(
          item
        );

      const permission =
        getPermission(
          item
        );

      const trail = [
        ...parentLabels,
        label,
      ].filter(Boolean);

      if (
        href &&
        hasPermission(
          user,
          permission
        )
      ) {
        result.push({
          key:
            `${href}-${trail.join("-")}`,

          label:
            label ||
            href,

          href,

          trail,

          searchText:
            [
              ...trail,
              getDescription(item),
              item?.menu_name,
              item?.subtitle,
              item?.menu_description,
              item?.search_keywords,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase(),
        });
      }

      const children =
        getChildren(
          item
        );

      if (
        children.length >
        0
      ) {
        result.push(
          ...flattenMenus(
            children,
            user,
            trail
          )
        );
      }
    }
  );

  return result;
}

/* =========================================================
   System Card
========================================================= */

function findFirstAccessibleMenu(
  item,
  user
) {
  const ownHref =
    getHref(
      item
    );

  const permission =
    getPermission(
      item
    );

  if (
    ownHref &&
    hasPermission(
      user,
      permission
    )
  ) {
    return ownHref;
  }

  const children =
    getChildren(
      item
    );

  for (
    const child of children
  ) {
    const href =
      findFirstAccessibleMenu(
        child,
        user
      );

    if (href) {
      return href;
    }
  }

  return null;
}

function countAccessibleMenus(
  item,
  user
) {
  let count = 0;

  const href =
    getHref(
      item
    );

  const permission =
    getPermission(
      item
    );

  if (
    href &&
    hasPermission(
      user,
      permission
    )
  ) {
    count += 1;
  }

  const children =
    getChildren(
      item
    );

  children.forEach(
    (child) => {
      count +=
        countAccessibleMenus(
          child,
          user
        );
    }
  );

  return count;
}

function getSystemIcon(
  title
) {
  const value =
    String(
      title || ""
    ).toLowerCase();

  if (
    value.includes(
      "employee"
    ) ||
    value.includes(
      "พนักงาน"
    )
  ) {
    return (
      <TeamOutlined />
    );
  }

  if (
    value.includes(
      "payroll"
    ) ||
    value.includes(
      "เงินเดือน"
    )
  ) {
    return (
      <WalletOutlined />
    );
  }

  if (
    value.includes(
      "talent"
    ) ||
    value.includes(
      "skill"
    )
  ) {
    return (
      <ReadOutlined />
    );
  }

  if (
    value.includes(
      "recruit"
    )
  ) {
    return (
      <SolutionOutlined />
    );
  }

  if (
    value.includes(
      "สวัสดิการ"
    ) ||
    value.includes(
      "benefit"
    )
  ) {
    return (
      <GiftOutlined />
    );
  }

  if (
    value.includes(
      "setting"
    ) ||
    value.includes(
      "ตั้งค่า"
    )
  ) {
    return (
      <SettingOutlined />
    );
  }

  if (
    value.includes(
      "organization"
    ) ||
    value.includes(
      "structure"
    )
  ) {
    return (
      <ApartmentOutlined />
    );
  }

  if (
    value.includes(
      "finance"
    )
  ) {
    return (
      <BankOutlined />
    );
  }

  return (
    <AppstoreOutlined />
  );
}

function getFriendlyDescription(
  title,
  fallback
) {
  if (fallback) {
    return fallback;
  }

  const value =
    String(
      title || ""
    ).toLowerCase();

  if (
    value.includes(
      "employee"
    )
  ) {
    return "จัดการข้อมูลพนักงานและโครงสร้างองค์กร";
  }

  if (
    value.includes(
      "payroll"
    )
  ) {
    return "เงินเดือน ภาษี และข้อมูลทางการเงิน";
  }

  if (
    value.includes(
      "talent"
    ) ||
    value.includes(
      "skill"
    )
  ) {
    return "จัดการทักษะ ความสามารถ และการพัฒนาพนักงาน";
  }

  if (
    value.includes(
      "recruit"
    )
  ) {
    return "จัดการกระบวนการสรรหาและรับสมัครพนักงาน";
  }

  if (
    value.includes(
      "สวัสดิการ"
    ) ||
    value.includes(
      "benefit"
    )
  ) {
    return "จัดการข้อมูลและสิทธิประโยชน์ของพนักงาน";
  }

  if (
    value.includes(
      "setting"
    ) ||
    value.includes(
      "ตั้งค่า"
    )
  ) {
    return "ตั้งค่าพื้นฐานและการทำงานของระบบ";
  }

  return "เข้าสู่ระบบและเมนูที่คุณมีสิทธิ์ใช้งาน";
}

/* =========================================================
   Component
========================================================= */

export default function AdminPage() {
  const router = useRouter();
  const { user, loadingUser} = useAuth();
  const [portalMenu,setPortalMenu] = useState([]);
  const [loadingMenu,setLoadingMenu,] = useState(false);
  const [search,setSearch,] = useState("");

  /* =======================================================
     Load Portal Menu
  ======================================================= */

  const loadPortalMenu =
    useCallback(
      async () => {
        try {
          setLoadingMenu(
            true
          );

          const response =
            await fetch(
              PORTAL_MENU_API,
              {
                cache:
                  "no-store",
              }
            );

          const json =
            await readJsonResponse(
              response
            );

          if (
            !response.ok
          ) {
            throw new Error(
              json?.error ||
                json?.message ||
                "ไม่สามารถโหลดเมนูได้"
            );
          }

          const data =
            Array.isArray(
              json?.data
            )
              ? json.data
              : Array.isArray(
                    json
                      ?.data
                      ?.systems
                  )
                ? json.data
                    .systems
                : Array.isArray(
                      json
                        ?.systems
                    )
                  ? json.systems
                  : [];

          setPortalMenu(
            data
          );
        } catch (error) {
          console.error(
            "LOAD_PORTAL_HOME_MENU_ERROR:",
            error
          );

          setPortalMenu(
            []
          );
        } finally {
          setLoadingMenu(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     Auth
  ======================================================= */

  useEffect(() => {
    if (
      loadingUser
    ) {
      return;
    }

    if (!user) {
      router.replace(
        "/login"
      );
    }
  }, [
    loadingUser,
    user,
    router,
  ]);

  useEffect(() => {
    if (
      loadingUser ||
      !user
    ) {
      return;
    }

    loadPortalMenu();
  }, [
    loadingUser,
    user,
    loadPortalMenu,
  ]);

  useEffect(() => {
    const style = document.createElement("style");

    style.setAttribute(
      "data-admin-home-scrollbar",
      "true"
    );

    style.textContent = `
      html,
      body {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }

      html::-webkit-scrollbar,
      body::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
    `;

    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  /* =======================================================
     Searchable Menu
  ======================================================= */

  const searchableMenus =
    useMemo(
      () =>
        flattenMenus(
          portalMenu,
          user
        ),
      [
        portalMenu,
        user,
      ]
    );

  const matchingMenus = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return [];
    // Each item was recursively collected from the authorized portal menu.
    return searchableMenus.filter((item) => item.searchText.includes(keyword));
  }, [searchableMenus, search]);

  const searchOptions = useMemo(
    () => (search.trim() ? matchingMenus : searchableMenus)
      .slice(0, 12)
      .map((item) => ({
        value: item.href,
        label: (
          <div className="flex min-w-0 items-center justify-between gap-3 py-1">
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-800">{item.label}</div>
              <div className="truncate text-xs text-slate-400">
                {item.trail.join(" › ")}
              </div>
            </div>
            <ArrowRightOutlined className="shrink-0 text-blue-500" />
          </div>
        ),
      })),
    [matchingMenus, searchableMenus, search]
  );

  /* =======================================================
     Accessible Systems
  ======================================================= */

  const systems =
    useMemo(
      () =>
        portalMenu
          .map(
            (
              item,
              index
            ) => {
              const href =
                findFirstAccessibleMenu(
                  item,
                  user
                );

              if (!href) {
                return null;
              }

              const menuCount =
                countAccessibleMenus(
                  item,
                  user
                );

              if (
                menuCount <=
                0
              ) {
                return null;
              }

              const title =
                getLabel(
                  item
                ) ||
                `ระบบ ${
                  index + 1
                }`;

              return {
                key:
                  item?.id ||
                  item?.key ||
                  `${title}-${index}`,

                title,

                description:
                  getFriendlyDescription(
                    title,
                    getDescription(
                      item
                    )
                  ),

                href,

                menuCount,

                icon:
                  getSystemIcon(
                    title
                  ),
              };
            }
          )
          .filter(Boolean),
      [
        portalMenu,
        user,
      ]
    );



  const filteredSystems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return systems;

    return systems.filter((system) => {
      const systemText = [system.title, system.description]
        .filter(Boolean).join(" ").toLowerCase();
      // A child menu match also keeps the containing system visible.
      return systemText.includes(keyword) || matchingMenus.some((menu) =>
        menu.trail[0] === system.title
      );
    });
  }, [systems, search, matchingMenus]);

  /* =======================================================
     Render
  ======================================================= */

  if (
    loadingUser
  ) {
    return (
      <LoadingOrb />
    );
  }

  if (!user) {
    return null;
  }

  const displayName =
    user?.full_name ||
    user?.username ||
    "ผู้ใช้งาน";

  return (
    <PortalShell>
      <div
        className="
          min-h-[calc(100vh-76px)]
          bg-slate-50/60
          p-4
          sm:p-6
          lg:p-8
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1380px]
          "
        >
          {/* =================================================
              Welcome
          ================================================= */}

          <section
            className="
              rounded-3xl
              border
              border-slate-200
              bg-white
              px-5
              py-6
              shadow-sm
              sm:px-7
              lg:px-8
            "
          >
            <div
              className="
                flex
                flex-col
                gap-5
                lg:flex-row
                lg:items-center
                lg:justify-between
              "
            >
              <div>
                <Text
                  className="
                    !text-sm
                    !font-medium
                    !text-blue-600
                  "
                >
                  HR Central Platform
                </Text>

                <Title
                  level={2}
                  className="
                    !mb-1
                    !mt-2
                    !text-slate-900
                  "
                >
                  สวัสดี{" "}
                  {displayName}
                </Title>

                <Text
                  className="
                    !text-slate-500
                  "
                >
                  เลือกระบบที่ต้องการใช้งาน
                  หรือค้นหาเมนูได้จากช่องด้านล่าง
                </Text>
              </div>

              <div
                className="
                  rounded-2xl
                  bg-slate-50
                  px-4
                  py-3
                  lg:min-w-[200px]
                "
              >
                <div
                  className="
                    text-xs
                    font-medium
                    text-slate-400
                  "
                >
                  บทบาทผู้ใช้งาน
                </div>

                <div
                  className="
                    mt-1
                    font-semibold
                    text-slate-700
                  "
                >
                  {user?.role_name ||
                    user?.role ||
                    "-"}
                </div>
              </div>
            </div>

            {/* ===============================================
                Search
            =============================================== */}

            <div
              className="
                mt-6
                max-w-3xl
              "
            >
              <AutoComplete
                value={search}
                options={searchOptions}
                filterOption={false}
                style={{
                  width: "100%",
                }}
                onChange={setSearch}
                onSelect={(href) => {
                  setSearch("");
                  router.push(href);
                }}
              >
                <Input
                  size="large"
                  allowClear
                  prefix={
                    <SearchOutlined className="text-slate-400" />
                  }
                  placeholder="ค้นหาเมนู เช่น พนักงาน, เงินเดือน, ภาษี, ประกันสังคม..."
                  onPressEnter={() => {
                    const href = searchOptions[0]?.value;

                    if (href) {
                      setSearch("");
                      router.push(href);
                    }
                  }}
                />
              </AutoComplete>
            </div>
            {search.trim() && (
              <div className="mt-4 max-w-3xl rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  ผลการค้นหาเมนู ({matchingMenus.length})
                </div>
                {matchingMenus.length ? (
                  <div className="max-h-80 space-y-1 overflow-y-auto">
                    {matchingMenus.slice(0, 30).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => { setSearch(""); router.push(item.href); }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium text-slate-800">{item.label}</span>
                          <span className="block truncate text-xs text-slate-500">{item.trail.join(" › ")}</span>
                        </span>
                        <ArrowRightOutlined className="ml-3 shrink-0 text-blue-500" />
                      </button>
                    ))}
                    {matchingMenus.length > 30 && (
                      <div className="px-3 py-2 text-xs text-slate-500">แสดง 30 รายการแรก กรุณาระบุคำค้นให้เฉพาะเจาะจงขึ้น</div>
                    )}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-sm text-slate-500">ไม่พบเมนูที่ตรงกับคำค้น หรือบัญชีนี้ไม่มีสิทธิ์เข้าถึงเมนูนั้น</div>
                )}
              </div>
            )}
          </section>

          {/* =================================================
              Systems
          ================================================= */}

          <section
            className="
              mt-8
            "
          >
            <div
              className="
                mb-4
              "
            >
              <Title
                level={4}
                className="
                  !mb-1
                "
              >
                ระบบที่คุณใช้งานได้
              </Title>

              <Text
                className="
                  !text-slate-500
                "
              >
                เลือกระบบที่ต้องการเริ่มใช้งาน
              </Text>
            </div>

            {loadingMenu ? (
              <div
                className="
                  grid
                  grid-cols-1
                  gap-4
                  md:grid-cols-2
                  xl:grid-cols-3
                "
              >
                {Array.from({
                  length: 6,
                }).map(
                  (
                    _,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-5
                      "
                    >
                      <Skeleton
                        active
                        paragraph={{
                          rows: 2,
                        }}
                      />
                    </div>
                  )
                )}
              </div>
            ) : filteredSystems.length >
              0 ? (
              <div
                className="
                  grid
                  grid-cols-1
                  gap-4
                  md:grid-cols-2
                  xl:grid-cols-3
                "
              >
                {filteredSystems.map(
                  (
                    system
                  ) => (
                    <button
                      key={
                        system.key
                      }
                      type="button"
                      onClick={() =>
                        router.push(
                          system.href
                        )
                      }
                      className="
                        group
                        flex
                        min-h-[165px]
                        flex-col
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-5
                        text-left
                        shadow-sm
                        transition-all
                        duration-200

                        hover:-translate-y-0.5
                        hover:border-blue-200
                        hover:shadow-md
                      "
                    >
                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-4
                        "
                      >
                        <div
                          className="
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-xl
                            bg-blue-50
                            text-lg
                            text-blue-600
                          "
                        >
                          {
                            system.icon
                          }
                        </div>

                        <ArrowRightOutlined
                          className="
                            mt-2
                            text-slate-300
                            transition

                            group-hover:translate-x-1
                            group-hover:text-blue-500
                          "
                        />
                      </div>

                      <div
                        className="
                          mt-4
                          text-base
                          font-bold
                          text-slate-800
                        "
                      >
                        {
                          system.title
                        }
                      </div>

                      <div
                        className="
                          mt-1
                          flex-1
                          text-sm
                          leading-relaxed
                          text-slate-500
                        "
                      >
                        {
                          system.description
                        }
                      </div>

                      <div
                        className="
                          mt-4
                          text-xs
                          font-medium
                          text-slate-400
                        "
                      >
                        {
                          system.menuCount
                        }{" "}
                        เมนูที่คุณเข้าถึงได้
                      </div>
                    </button>
                  )
                )}
              </div>
            ) : (
              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-8
                "
              >
                <Empty
                  image={
                    Empty.PRESENTED_IMAGE_SIMPLE
                  }
                  description="ยังไม่มีระบบที่คุณสามารถเข้าใช้งานได้"
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </PortalShell>
  );
}