export function getPermissionSet(
  user
) {
  return new Set(
    Array.isArray(
      user?.permissions
    )
      ? user.permissions
      : []
  );
}

export function isSuperAdmin(
  user
) {
  const roles = [
    user?.role,
    user?.role_code,
    ...(Array.isArray(
      user?.roles
    )
      ? user.roles
      : []),
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

export function hasPermission(
  user,
  permission
) {
  if (!permission) {
    return true;
  }

  if (isSuperAdmin(user)) {
    return true;
  }

  return getPermissionSet(
    user
  ).has(permission);
}

function getNodeLabel(
  node
) {
  return (
    node?.label ||
    node?.title ||
    node?.name ||
    node?.key ||
    "ระบบ"
  );
}

function getChildren(
  node
) {
  const result = [];

  [
    "items",
    "children",
    "menus",
    "sections",
  ].forEach(
    (key) => {
      if (
        Array.isArray(
          node?.[key]
        )
      ) {
        result.push(
          ...node[key]
        );
      }
    }
  );

  return result;
}

export function flattenPortalMenus(
  nodes,
  user,
  trail = []
) {
  if (!Array.isArray(nodes)) {
    return [];
  }

  const result = [];

  nodes.forEach(
    (node) => {
      const label =
        getNodeLabel(
          node
        );

      const nextTrail = [
        ...trail,
        label,
      ];

      if (
        node?.href &&
        hasPermission(
          user,
          node.permission
        )
      ) {
        result.push({
          key:
            `${node.href}-${nextTrail.join("/")}`,

          label,

          href:
            node.href,

          permission:
            node.permission ||
            null,

          trail:
            nextTrail,

          searchText:
            nextTrail
              .join(" ")
              .toLowerCase(),
        });
      }

      result.push(
        ...flattenPortalMenus(
          getChildren(node),
          user,
          nextTrail
        )
      );
    }
  );

  return result;
}

export function buildAccessibleSystems(
  nodes,
  user
) {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes
    .map(
      (group) => {
        const menus =
          flattenPortalMenus(
            [group],
            user
          );

        if (
          menus.length ===
          0
        ) {
          return null;
        }

        return {
          key:
            group?.key ||
            group?.id ||
            getNodeLabel(
              group
            ),

          title:
            getNodeLabel(
              group
            ),

          description:
            group?.description ||
            group?.subtitle ||
            `มี ${menus.length} เมนูที่คุณสามารถใช้งานได้`,

          href:
            menus[0].href,

          menuCount:
            menus.length,
        };
      }
    )
    .filter(Boolean);
}
