"use client";

import {
  AppstoreOutlined,
  MenuOutlined,
  PartitionOutlined,
} from "@ant-design/icons";

import {
  Form,
  Tabs,
  Typography,
  message,
} from "antd";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

/* =========================================================
   SYSTEM
========================================================= */

import PortalSystemSearch from "./components/PortalSystemSearch";
import PortalSystemTable from "./components/PortalSystemTable";
import PortalSystemModal from "./components/PortalSystemModal";

import {
  getInitialPortalSystemValues,
} from "./components/PortalSystemForm";

/* =========================================================
   MENU GROUP
========================================================= */

import PortalMenuGroupSearch from "./components/PortalMenuGroupSearch";
import PortalMenuGroupTable from "./components/PortalMenuGroupTable";
import PortalMenuGroupModal from "./components/PortalMenuGroupModal";

import {
  getInitialPortalMenuGroupValues,
} from "./components/PortalMenuGroupForm";

/* =========================================================
   MENU ITEM
========================================================= */

import PortalMenuItemSearch from "./components/PortalMenuItemSearch";
import PortalMenuItemTable from "./components/PortalMenuItemTable";
import PortalMenuItemModal from "./components/PortalMenuItemModal";

import {
  getInitialPortalMenuItemValues,
} from "./components/PortalMenuItemForm";

const {
  Title,
  Text,
} = Typography;

/* =========================================================
   API
========================================================= */

const SYSTEM_API =
  "/api/admin/portal-systems";

const GROUP_API =
  "/api/admin/portal-menu-groups";

const ITEM_API =
  "/api/admin/portal-menu-items";

const DEFAULT_PAGE_SIZE =
  20;

/* =========================================================
   Helper
========================================================= */

async function fetchJson(
  url,
  options = {}
) {
  const response =
    await fetch(
      url,
      {
        cache: "no-store",
        ...options,
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
        `HTTP ${response.status}`
    );
  }

  return payload;
}

/* =========================================================
   Notify Portal Sidebar
========================================================= */

function notifyPortalMenuUpdated() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new Event(
      "portal-menu-updated"
    )
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function PortalSettingsPage() {
  /* =======================================================
     Forms
  ======================================================= */

  const [systemForm] =
    Form.useForm();

  const [groupForm] =
    Form.useForm();

  const [itemForm] =
    Form.useForm();

  /* =======================================================
     Tabs
  ======================================================= */

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "systems"
  );

  /* =======================================================
     Master Options
  ======================================================= */

  const [
    systemOptions,
    setSystemOptions,
  ] = useState([]);

  const [
    groupOptions,
    setGroupOptions,
  ] = useState([]);

  const [
    parentItemOptions,
    setParentItemOptions,
  ] = useState([]);

  /* =======================================================
     SYSTEM STATE
  ======================================================= */

  const [
    systems,
    setSystems,
  ] = useState([]);

  const [
    systemLoading,
    setSystemLoading,
  ] = useState(false);

  const [
    systemSaving,
    setSystemSaving,
  ] = useState(false);

  const [
    systemDeleting,
    setSystemDeleting,
  ] = useState(false);

  const [
    systemSearch,
    setSystemSearch,
  ] = useState("");

  const [
    systemStatus,
    setSystemStatus,
  ] = useState("");

  const [
    systemPage,
    setSystemPage,
  ] = useState(1);

  const [
    systemPageSize,
    setSystemPageSize,
  ] = useState(
    DEFAULT_PAGE_SIZE
  );

  const [
    systemTotal,
    setSystemTotal,
  ] = useState(0);

  const [
    systemModalOpen,
    setSystemModalOpen,
  ] = useState(false);

  const [
    systemModalMode,
    setSystemModalMode,
  ] = useState(
    "create"
  );

  const [
    selectedSystem,
    setSelectedSystem,
  ] = useState(null);

  /* =======================================================
     GROUP STATE
  ======================================================= */

  const [
    groups,
    setGroups,
  ] = useState([]);

  const [
    groupLoading,
    setGroupLoading,
  ] = useState(false);

  const [
    groupSaving,
    setGroupSaving,
  ] = useState(false);

  const [
    groupDeleting,
    setGroupDeleting,
  ] = useState(false);

  const [
    groupSystemId,
    setGroupSystemId,
  ] = useState("");

  const [
    groupStatus,
    setGroupStatus,
  ] = useState("");

  const [
    groupModalOpen,
    setGroupModalOpen,
  ] = useState(false);

  const [
    groupModalMode,
    setGroupModalMode,
  ] = useState(
    "create"
  );

  const [
    selectedGroup,
    setSelectedGroup,
  ] = useState(null);

  /* =======================================================
     ITEM STATE
  ======================================================= */

  const [
    items,
    setItems,
  ] = useState([]);

  const [
    itemLoading,
    setItemLoading,
  ] = useState(false);

  const [
    itemSaving,
    setItemSaving,
  ] = useState(false);

  const [
    itemDeleting,
    setItemDeleting,
  ] = useState(false);

  const [
    itemSearch,
    setItemSearch,
  ] = useState("");

  const [
    itemSystemId,
    setItemSystemId,
  ] = useState("");

  const [
    itemGroupId,
    setItemGroupId,
  ] = useState("");

  const [
    itemStatus,
    setItemStatus,
  ] = useState("");

  const [
    itemModalOpen,
    setItemModalOpen,
  ] = useState(false);

  const [
    itemModalMode,
    setItemModalMode,
  ] = useState(
    "create"
  );

  const [
    selectedItem,
    setSelectedItem,
  ] = useState(null);

  /* =======================================================
     LOAD SYSTEM OPTIONS
  ======================================================= */

  const loadSystemOptions =
    useCallback(
      async () => {
        try {
          const payload =
            await fetchJson(
              `${SYSTEM_API}?all=true`
            );

          const rows =
            Array.isArray(
              payload?.data
            )
              ? payload.data
              : [];

          setSystemOptions(
            rows.map(
              (item) => ({
                label:
                  `${item.system_code} - ${item.system_name}`,

                value:
                  item.id,

                data:
                  item,
              })
            )
          );
        } catch (error) {
          console.error(
            "LOAD_PORTAL_SYSTEM_OPTIONS_ERROR:",
            error
          );
        }
      },
      []
    );

  /* =======================================================
     LOAD GROUP OPTIONS
  ======================================================= */

  const loadGroupOptions =
    useCallback(
      async (
        systemId = ""
      ) => {
        try {
          const params =
            new URLSearchParams();

          params.set(
            "all",
            "true"
          );

          if (systemId) {
            params.set(
              "system_id",
              systemId
            );
          }

          const payload =
            await fetchJson(
              `${GROUP_API}?${params.toString()}`
            );

          const rows =
            Array.isArray(
              payload?.data
            )
              ? payload.data
              : [];

          setGroupOptions(
            rows.map(
              (item) => ({
                label:
                  item.group_name,

                value:
                  item.id,

                system_id:
                  item.system_id,

                data:
                  item,
              })
            )
          );
        } catch (error) {
          console.error(
            "LOAD_PORTAL_GROUP_OPTIONS_ERROR:",
            error
          );
        }
      },
      []
    );

  /* =======================================================
     LOAD PARENT ITEM OPTIONS
  ======================================================= */

  const loadParentItemOptions =
    useCallback(
      async ({
        systemId = "",
        groupId = "",
        excludeId = "",
      } = {}) => {
        try {
          if (!systemId) {
            setParentItemOptions(
              []
            );

            return;
          }

          const params =
            new URLSearchParams();

          params.set(
            "all",
            "true"
          );

          params.set(
            "system_id",
            systemId
          );

          if (groupId) {
            params.set(
              "group_id",
              groupId
            );
          }

          const payload =
            await fetchJson(
              `${ITEM_API}?${params.toString()}`
            );

          const rows =
            Array.isArray(
              payload?.data
            )
              ? payload.data
              : [];

          setParentItemOptions(
            rows
              .filter(
                (item) =>
                  item.id !==
                  excludeId
              )
              .map(
                (item) => ({
                  label:
                    `${item.menu_code} - ${item.menu_name}`,

                  value:
                    item.id,

                  system_id:
                    item.system_id,

                  group_id:
                    item.group_id,

                  menu_type:
                    item.menu_type,

                  data:
                    item,
                })
              )
          );
        } catch (error) {
          console.error(
            "LOAD_PARENT_MENU_OPTIONS_ERROR:",
            error
          );
        }
      },
      []
    );

  /* =======================================================
     SYSTEM LOAD
  ======================================================= */

  const loadSystems =
    useCallback(
      async () => {
        setSystemLoading(
          true
        );

        try {
          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(
              systemPage
            )
          );

          params.set(
            "pageSize",
            String(
              systemPageSize
            )
          );

          if (
            systemSearch.trim()
          ) {
            params.set(
              "search",
              systemSearch.trim()
            );
          }

          if (
            systemStatus
          ) {
            params.set(
              "status",
              systemStatus
            );
          }

          const payload =
            await fetchJson(
              `${SYSTEM_API}?${params.toString()}`
            );

          setSystems(
            Array.isArray(
              payload?.data
            )
              ? payload.data
              : []
          );

          setSystemTotal(
            Number(
              payload?.total ||
                0
            )
          );
        } catch (error) {
          console.error(
            "LOAD_PORTAL_SYSTEMS_ERROR:",
            error
          );

          message.error(
            error?.message ||
              "ไม่สามารถโหลดระบบ Portal ได้"
          );
        } finally {
          setSystemLoading(
            false
          );
        }
      },
      [
        systemPage,
        systemPageSize,
        systemSearch,
        systemStatus,
      ]
    );

  /* =======================================================
     GROUP LOAD
  ======================================================= */

  const loadGroups =
    useCallback(
      async () => {
        setGroupLoading(
          true
        );

        try {
          const params =
            new URLSearchParams();

          params.set(
            "all",
            "true"
          );

          if (
            groupSystemId
          ) {
            params.set(
              "system_id",
              groupSystemId
            );
          }

          if (
            groupStatus
          ) {
            params.set(
              "status",
              groupStatus
            );
          }

          const payload =
            await fetchJson(
              `${GROUP_API}?${params.toString()}`
            );

          setGroups(
            Array.isArray(
              payload?.data
            )
              ? payload.data
              : []
          );
        } catch (error) {
          console.error(
            "LOAD_PORTAL_GROUPS_ERROR:",
            error
          );

          message.error(
            error?.message ||
              "ไม่สามารถโหลด Menu Groups ได้"
          );
        } finally {
          setGroupLoading(
            false
          );
        }
      },
      [
        groupSystemId,
        groupStatus,
      ]
    );

  /* =======================================================
     ITEM LOAD
  ======================================================= */

  const loadItems =
    useCallback(
      async () => {
        setItemLoading(
          true
        );

        try {
          const params =
            new URLSearchParams();

          params.set(
            "all",
            "true"
          );

          if (
            itemSystemId
          ) {
            params.set(
              "system_id",
              itemSystemId
            );
          }

          if (
            itemGroupId
          ) {
            params.set(
              "group_id",
              itemGroupId
            );
          }

          if (
            itemStatus
          ) {
            params.set(
              "status",
              itemStatus
            );
          }

          if (
            itemSearch.trim()
          ) {
            params.set(
              "search",
              itemSearch.trim()
            );
          }

          const payload =
            await fetchJson(
              `${ITEM_API}?${params.toString()}`
            );

          setItems(
            Array.isArray(
              payload?.data
            )
              ? payload.data
              : []
          );
        } catch (error) {
          console.error(
            "LOAD_PORTAL_ITEMS_ERROR:",
            error
          );

          message.error(
            error?.message ||
              "ไม่สามารถโหลด Menu Items ได้"
          );
        } finally {
          setItemLoading(
            false
          );
        }
      },
      [
        itemGroupId,
        itemSearch,
        itemStatus,
        itemSystemId,
      ]
    );

  /* =======================================================
     INITIAL MASTER DATA
  ======================================================= */

  useEffect(() => {
    loadSystemOptions();
    loadGroupOptions();
  }, [
    loadGroupOptions,
    loadSystemOptions,
  ]);

  /* =======================================================
     TAB LOAD
  ======================================================= */

  useEffect(() => {
    if (
      activeTab ===
      "systems"
    ) {
      const timer =
        setTimeout(
          loadSystems,
          200
        );

      return () =>
        clearTimeout(
          timer
        );
    }

    if (
      activeTab ===
      "groups"
    ) {
      loadGroups();

      return;
    }

    if (
      activeTab ===
      "items"
    ) {
      const timer =
        setTimeout(
          loadItems,
          200
        );

      return () =>
        clearTimeout(
          timer
        );
    }
  }, [
    activeTab,
    loadGroups,
    loadItems,
    loadSystems,
  ]);

  /* =======================================================
     FILTERED GROUP OPTIONS FOR ITEM
  ======================================================= */

  const filteredItemGroupOptions =
    useMemo(() => {
      if (!itemSystemId) {
        return groupOptions;
      }

      return groupOptions.filter(
        (item) =>
          item.system_id ===
          itemSystemId
      );
    }, [
      groupOptions,
      itemSystemId,
    ]);

  /* =======================================================
     SYSTEM MODAL
  ======================================================= */

  const openCreateSystem =
    () => {
      setSelectedSystem(
        null
      );

      setSystemModalMode(
        "create"
      );

      systemForm.setFieldsValue(
        getInitialPortalSystemValues()
      );

      setSystemModalOpen(
        true
      );
    };

  const openViewSystem =
    (record) => {
      setSelectedSystem(
        record
      );

      setSystemModalMode(
        "view"
      );

      systemForm.setFieldsValue({
        ...getInitialPortalSystemValues(),
        ...record,
      });

      setSystemModalOpen(
        true
      );
    };

  const openEditSystem =
    (record) => {
      setSelectedSystem(
        record
      );

      setSystemModalMode(
        "edit"
      );

      systemForm.setFieldsValue({
        ...getInitialPortalSystemValues(),
        ...record,
      });

      setSystemModalOpen(
        true
      );
    };

  const closeSystemModal =
    () => {
      if (
        systemSaving
      ) {
        return;
      }

      setSystemModalOpen(
        false
      );

      setSelectedSystem(
        null
      );

      systemForm.resetFields();
    };

  /* =======================================================
     SYSTEM SAVE
  ======================================================= */

  const saveSystem =
    async (values) => {
      if (
        systemSaving
      ) {
        return;
      }

      setSystemSaving(
        true
      );

      try {
        const payload = {
          system_code:
            String(
              values.system_code ||
                ""
            )
              .trim()
              .toUpperCase(),

          system_name:
            String(
              values.system_name ||
                ""
            ).trim(),

          system_subtitle:
            String(
              values.system_subtitle ||
                ""
            ).trim() ||
            null,

          description:
            String(
              values.description ||
                ""
            ).trim() ||
            null,

          base_path:
            String(
              values.base_path ||
                ""
            ).trim() ||
            null,

          permission_code:
            String(
              values.permission_code ||
                ""
            ).trim() ||
            null,

          icon_code:
            String(
              values.icon_code ||
                ""
            )
              .trim()
              .toLowerCase() ||
            null,

          sort_order:
            Number(
              values.sort_order ||
                0
            ),

          status:
            values.status ||
            "active",
        };

        if (
          systemModalMode ===
          "create"
        ) {
          await fetchJson(
            SYSTEM_API,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

          message.success(
            "เพิ่มระบบเรียบร้อยแล้ว"
          );
        } else {
          await fetchJson(
            SYSTEM_API,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  id:
                    selectedSystem
                      ?.id,

                  ...payload,
                }),
            }
          );

          message.success(
            "แก้ไขระบบเรียบร้อยแล้ว"
          );
        }

        setSystemModalOpen(
          false
        );

        systemForm.resetFields();

        await Promise.all([
          loadSystems(),
          loadSystemOptions(),
        ]);

        notifyPortalMenuUpdated();
      } catch (error) {
        console.error(
          "SAVE_PORTAL_SYSTEM_ERROR:",
          error
        );

        message.error(
          error?.message ||
            "บันทึกระบบไม่สำเร็จ"
        );
      } finally {
        setSystemSaving(
          false
        );
      }
    };

  /* =======================================================
     SYSTEM DELETE
  ======================================================= */

  const deleteSystem =
    async (record) => {
      if (
        !record?.id ||
        systemDeleting
      ) {
        return;
      }

      setSystemDeleting(
        true
      );

      try {
        await fetchJson(
          SYSTEM_API,
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  record.id,
              }),
          }
        );

        message.success(
          "ลบระบบเรียบร้อยแล้ว"
        );

        await Promise.all([
          loadSystems(),
          loadSystemOptions(),
          loadGroupOptions(),
        ]);

        notifyPortalMenuUpdated();
      } catch (error) {
        message.error(
          error?.message ||
            "ลบระบบไม่สำเร็จ"
        );
      } finally {
        setSystemDeleting(
          false
        );
      }
    };

  /* =======================================================
     GROUP MODAL
  ======================================================= */

  const openCreateGroup =
    () => {
      setSelectedGroup(
        null
      );

      setGroupModalMode(
        "create"
      );

      groupForm.setFieldsValue({
        ...getInitialPortalMenuGroupValues(),

        system_id:
          groupSystemId ||
          undefined,
      });

      setGroupModalOpen(
        true
      );
    };

  const openViewGroup =
    (record) => {
      setSelectedGroup(
        record
      );

      setGroupModalMode(
        "view"
      );

      groupForm.setFieldsValue({
        ...getInitialPortalMenuGroupValues(),
        ...record,
      });

      setGroupModalOpen(
        true
      );
    };

  const openEditGroup =
    (record) => {
      setSelectedGroup(
        record
      );

      setGroupModalMode(
        "edit"
      );

      groupForm.setFieldsValue({
        ...getInitialPortalMenuGroupValues(),
        ...record,
      });

      setGroupModalOpen(
        true
      );
    };

  const closeGroupModal =
    () => {
      if (
        groupSaving
      ) {
        return;
      }

      setGroupModalOpen(
        false
      );

      setSelectedGroup(
        null
      );

      groupForm.resetFields();
    };

  /* =======================================================
     GROUP SAVE
  ======================================================= */

  const saveGroup =
    async (values) => {
      if (groupSaving) {
        return;
      }

      setGroupSaving(
        true
      );

      try {
        const payload = {
          system_id:
            values.system_id,

          group_code:
            String(
              values.group_code ||
                ""
            )
              .trim()
              .toUpperCase(),

          group_name:
            String(
              values.group_name ||
                ""
            ).trim(),

          group_subtitle:
            String(
              values.group_subtitle ||
                ""
            ).trim() ||
            null,

          icon_code:
            String(
              values.icon_code ||
                ""
            )
              .trim()
              .toLowerCase() ||
            null,

          sort_order:
            Number(
              values.sort_order ||
                0
            ),

          is_expanded_default:
            Boolean(
              values.is_expanded_default
            ),

          status:
            values.status ||
            "active",
        };

        if (
          groupModalMode ===
          "create"
        ) {
          await fetchJson(
            GROUP_API,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

          message.success(
            "เพิ่ม Menu Group เรียบร้อยแล้ว"
          );
        } else {
          await fetchJson(
            GROUP_API,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  id:
                    selectedGroup
                      ?.id,

                  ...payload,
                }),
            }
          );

          message.success(
            "แก้ไข Menu Group เรียบร้อยแล้ว"
          );
        }

        setGroupModalOpen(
          false
        );

        groupForm.resetFields();

        await Promise.all([
          loadGroups(),
          loadGroupOptions(),
        ]);

        notifyPortalMenuUpdated();
      } catch (error) {
        console.error(
          "SAVE_PORTAL_GROUP_ERROR:",
          error
        );

        message.error(
          error?.message ||
            "บันทึก Menu Group ไม่สำเร็จ"
        );
      } finally {
        setGroupSaving(
          false
        );
      }
    };

  /* =======================================================
     GROUP DELETE
  ======================================================= */

  const deleteGroup =
    async (record) => {
      if (
        !record?.id ||
        groupDeleting
      ) {
        return;
      }

      setGroupDeleting(
        true
      );

      try {
        await fetchJson(
          GROUP_API,
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  record.id,
              }),
          }
        );

        message.success(
          "ลบ Menu Group เรียบร้อยแล้ว"
        );

        await Promise.all([
          loadGroups(),
          loadGroupOptions(),
          loadItems(),
        ]);

        notifyPortalMenuUpdated();
      } catch (error) {
        message.error(
          error?.message ||
            "ลบ Menu Group ไม่สำเร็จ"
        );
      } finally {
        setGroupDeleting(
          false
        );
      }
    };

  /* =======================================================
     ITEM FORM SYSTEM CHANGE
  ======================================================= */

  const handleItemSystemChange =
    async (
      systemId
    ) => {
      itemForm.setFieldValue(
        "group_id",
        null
      );

      itemForm.setFieldValue(
        "parent_id",
        null
      );

      await loadGroupOptions(
        systemId
      );

      setParentItemOptions(
        []
      );
    };

  /* =======================================================
     ITEM FORM GROUP CHANGE
  ======================================================= */

  const handleItemGroupChange =
    async (
      groupId
    ) => {
      itemForm.setFieldValue(
        "parent_id",
        null
      );

      const systemId =
        itemForm.getFieldValue(
          "system_id"
        );

      await loadParentItemOptions({
        systemId,
        groupId,
        excludeId:
          selectedItem?.id ||
          "",
      });
    };

  /* =======================================================
     ITEM MODAL
  ======================================================= */

  const openCreateItem =
    async () => {
      setSelectedItem(
        null
      );

      setItemModalMode(
        "create"
      );

      itemForm.setFieldsValue({
        ...getInitialPortalMenuItemValues(),

        system_id:
          itemSystemId ||
          undefined,

        group_id:
          itemGroupId ||
          undefined,
      });

      if (
        itemSystemId
      ) {
        await loadGroupOptions(
          itemSystemId
        );
      }

      if (
        itemSystemId &&
        itemGroupId
      ) {
        await loadParentItemOptions({
          systemId:
            itemSystemId,

          groupId:
            itemGroupId,
        });
      }

      setItemModalOpen(
        true
      );
    };

  const openViewItem =
    async (record) => {
      setSelectedItem(
        record
      );

      setItemModalMode(
        "view"
      );

      await loadGroupOptions(
        record.system_id
      );

      await loadParentItemOptions({
        systemId:
          record.system_id,

        groupId:
          record.group_id,

        excludeId:
          record.id,
      });

      itemForm.setFieldsValue({
        ...getInitialPortalMenuItemValues(),
        ...record,
      });

      setItemModalOpen(
        true
      );
    };

  const openEditItem =
    async (record) => {
      setSelectedItem(
        record
      );

      setItemModalMode(
        "edit"
      );

      await loadGroupOptions(
        record.system_id
      );

      await loadParentItemOptions({
        systemId:
          record.system_id,

        groupId:
          record.group_id,

        excludeId:
          record.id,
      });

      itemForm.setFieldsValue({
        ...getInitialPortalMenuItemValues(),
        ...record,
      });

      setItemModalOpen(
        true
      );
    };

  const closeItemModal =
    () => {
      if (
        itemSaving
      ) {
        return;
      }

      setItemModalOpen(
        false
      );

      setSelectedItem(
        null
      );

      itemForm.resetFields();

      setParentItemOptions(
        []
      );
    };

  /* =======================================================
     ITEM SAVE
  ======================================================= */

  const saveItem =
    async (values) => {
      if (
        itemSaving
      ) {
        return;
      }

      setItemSaving(
        true
      );

      try {
        const menuType =
          values.menu_type ||
          "link";

        const payload = {
          system_id:
            values.system_id,

          group_id:
            values.group_id ||
            null,

          parent_id:
            values.parent_id ||
            null,

          menu_code:
            String(
              values.menu_code ||
                ""
            )
              .trim()
              .toUpperCase(),

          menu_name:
            String(
              values.menu_name ||
                ""
            ).trim(),

          menu_subtitle:
            String(
              values.menu_subtitle ||
                ""
            ).trim() ||
            null,

          menu_type:
            menuType,

          route_path:
            menuType ===
            "group"
              ? null
              : (
                  String(
                    values.route_path ||
                      ""
                  ).trim() ||
                  null
                ),

          module_code:
            String(
              values.module_code ||
                ""
            )
              .trim()
              .toLowerCase() ||
            null,

          page_code:
            String(
              values.page_code ||
                ""
            )
              .trim()
              .toLowerCase() ||
            null,

          permission_code:
            String(
              values.permission_code ||
                ""
            ).trim() ||
            null,

          icon_code:
            String(
              values.icon_code ||
                ""
            )
              .trim()
              .toLowerCase() ||
            null,

          open_mode:
            values.open_mode ||
            "router",

          sort_order:
            Number(
              values.sort_order ||
                0
            ),

          is_visible:
            values.is_visible !==
            false,

          status:
            values.status ||
            "active",
        };

        if (
          itemModalMode ===
          "create"
        ) {
          await fetchJson(
            ITEM_API,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

          message.success(
            "เพิ่ม Menu Item เรียบร้อยแล้ว"
          );
        } else {
          await fetchJson(
            ITEM_API,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  id:
                    selectedItem
                      ?.id,

                  ...payload,
                }),
            }
          );

          message.success(
            "แก้ไข Menu Item เรียบร้อยแล้ว"
          );
        }

        setItemModalOpen(
          false
        );

        itemForm.resetFields();

        setParentItemOptions(
          []
        );

        await loadItems();

        notifyPortalMenuUpdated();
      } catch (error) {
        console.error(
          "SAVE_PORTAL_ITEM_ERROR:",
          error
        );

        message.error(
          error?.message ||
            "บันทึก Menu Item ไม่สำเร็จ"
        );
      } finally {
        setItemSaving(
          false
        );
      }
    };

  /* =======================================================
     ITEM DELETE
  ======================================================= */

  const deleteItem =
    async (record) => {
      if (
        !record?.id ||
        itemDeleting
      ) {
        return;
      }

      setItemDeleting(
        true
      );

      try {
        await fetchJson(
          ITEM_API,
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  record.id,
              }),
          }
        );

        message.success(
          "ลบ Menu Item เรียบร้อยแล้ว"
        );

        await loadItems();

        notifyPortalMenuUpdated();
      } catch (error) {
        message.error(
          error?.message ||
            "ลบ Menu Item ไม่สำเร็จ"
        );
      } finally {
        setItemDeleting(
          false
        );
      }
    };

  /* =======================================================
     SYSTEM CONTENT
  ======================================================= */

  const systemsContent = (
    <div className="space-y-4">
      <PortalSystemSearch
        search={
          systemSearch
        }
        status={
          systemStatus
        }
        loading={
          systemLoading
        }
        onSearchChange={(
          value
        ) => {
          setSystemSearch(
            value
          );

          setSystemPage(1);
        }}
        onStatusChange={(
          value
        ) => {
          setSystemStatus(
            value
          );

          setSystemPage(1);
        }}
        onRefresh={
          loadSystems
        }
        onCreate={
          openCreateSystem
        }
      />

      <PortalSystemTable
        data={
          systems
        }
        loading={
          systemLoading ||
          systemDeleting
        }
        page={
          systemPage
        }
        pageSize={
          systemPageSize
        }
        total={
          systemTotal
        }
        onView={
          openViewSystem
        }
        onEdit={
          openEditSystem
        }
        onDelete={
          deleteSystem
        }
        onPageChange={(
          nextPage,
          nextPageSize
        ) => {
          if (
            nextPageSize !==
            systemPageSize
          ) {
            setSystemPageSize(
              nextPageSize
            );

            setSystemPage(1);

            return;
          }

          setSystemPage(
            nextPage
          );
        }}
      />
    </div>
  );

  /* =======================================================
     GROUP CONTENT
  ======================================================= */

  const groupsContent = (
    <div className="space-y-4">
      <PortalMenuGroupSearch
        systemId={
          groupSystemId
        }
        status={
          groupStatus
        }
        systems={
          systemOptions
        }
        loading={
          groupLoading
        }
        onSystemChange={
          setGroupSystemId
        }
        onStatusChange={
          setGroupStatus
        }
        onRefresh={
          loadGroups
        }
        onCreate={
          openCreateGroup
        }
      />

      <PortalMenuGroupTable
        data={
          groups
        }
        systems={
          systemOptions
        }
        loading={
          groupLoading ||
          groupDeleting
        }
        onView={
          openViewGroup
        }
        onEdit={
          openEditGroup
        }
        onDelete={
          deleteGroup
        }
      />
    </div>
  );

  /* =======================================================
     ITEM CONTENT
  ======================================================= */

  const itemsContent = (
    <div className="space-y-4">
      <PortalMenuItemSearch
        search={
          itemSearch
        }
        systemId={
          itemSystemId
        }
        groupId={
          itemGroupId
        }
        status={
          itemStatus
        }
        systems={
          systemOptions
        }
        groups={
          filteredItemGroupOptions
        }
        loading={
          itemLoading
        }
        onSearchChange={
          setItemSearch
        }
        onSystemChange={(
          value
        ) => {
          setItemSystemId(
            value || ""
          );

          setItemGroupId(
            ""
          );
        }}
        onGroupChange={(
          value
        ) =>
          setItemGroupId(
            value || ""
          )
        }
        onStatusChange={
          setItemStatus
        }
        onRefresh={
          loadItems
        }
        onCreate={
          openCreateItem
        }
      />

      <PortalMenuItemTable
        data={
          items
        }
        systems={
          systemOptions
        }
        groups={
          groupOptions
        }
        loading={
          itemLoading ||
          itemDeleting
        }
        onView={
          openViewItem
        }
        onEdit={
          openEditItem
        }
        onDelete={
          deleteItem
        }
      />
    </div>
  );

  /* =======================================================
     TABS
  ======================================================= */

  const tabItems = [
    {
      key:
        "systems",

      label: (
        <span>
          <AppstoreOutlined />
          {" "}
          ระบบ
        </span>
      ),

      children:
        systemsContent,
    },

    {
      key:
        "groups",

      label: (
        <span>
          <PartitionOutlined />
          {" "}
          Menu Groups
        </span>
      ),

      children:
        groupsContent,
    },

    {
      key:
        "items",

      label: (
        <span>
          <MenuOutlined />
          {" "}
          Menu Items
        </span>
      ),

      children:
        itemsContent,
    },
  ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-6">
        <Title
          level={2}
          className="!mb-1"
        >
          Portal Settings
        </Title>

        <Text type="secondary">
          กำหนดระบบ กลุ่มเมนู
          เมนูย่อย และเส้นทางที่จะแสดงใน HR Portal
        </Text>
      </div>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <Tabs
          activeKey={
            activeTab
          }
          onChange={
            setActiveTab
          }
          items={
            tabItems
          }
        />
      </div>

      {/* ===================================================
          SYSTEM MODAL
      =================================================== */}

      <PortalSystemModal
        open={
          systemModalOpen
        }
        mode={
          systemModalMode
        }
        form={
          systemForm
        }
        saving={
          systemSaving
        }
        onCancel={
          closeSystemModal
        }
        onSubmit={
          saveSystem
        }
      />

      {/* ===================================================
          GROUP MODAL
      =================================================== */}

      <PortalMenuGroupModal
        open={
          groupModalOpen
        }
        mode={
          groupModalMode
        }
        form={
          groupForm
        }
        saving={
          groupSaving
        }
        systems={
          systemOptions
        }
        onCancel={
          closeGroupModal
        }
        onSubmit={
          saveGroup
        }
      />

      {/* ===================================================
          ITEM MODAL
      =================================================== */}

      <PortalMenuItemModal
        open={
          itemModalOpen
        }
        mode={
          itemModalMode
        }
        form={
          itemForm
        }
        saving={
          itemSaving
        }
        systems={
          systemOptions
        }
        groups={
          groupOptions
        }
        parentItems={
          parentItemOptions
        }
        onSystemChange={
          handleItemSystemChange
        }
        onGroupChange={
          handleItemGroupChange
        }
        onCancel={
          closeItemModal
        }
        onSubmit={
          saveItem
        }
      />
    </div>
  );
}