export function compareNode(
  a,
  b
) {
  const sortA =
    Number(
      a?.sort_order || 0
    );

  const sortB =
    Number(
      b?.sort_order || 0
    );

  if (sortA !== sortB) {
    return sortA - sortB;
  }

  return String(
    a?.slot_code || ""
  ).localeCompare(
    String(
      b?.slot_code || ""
    ),
    "th"
  );
}

export function buildOrgChartTree(
  rows = []
) {
  const map =
    new Map();

  for (
    const row of
      rows
  ) {
    map.set(
      String(row.id),
      {
        ...row,
        children: [],
      }
    );
  }

  const roots = [];

  for (
    const node of
      map.values()
  ) {
    const parentId =
      node.parent_id
        ? String(
            node.parent_id
          )
        : "";

    if (
      parentId &&
      parentId !==
        String(node.id) &&
      map.has(parentId)
    ) {
      map
        .get(parentId)
        .children
        .push(node);
    } else {
      roots.push(node);
    }
  }

  function sortChildren(
    nodes,
    ancestry = new Set()
  ) {
    nodes.sort(
      compareNode
    );

    for (
      const node of
        nodes
    ) {
      const id =
        String(node.id);

      if (
        ancestry.has(id)
      ) {
        node.children = [];
        continue;
      }

      const next =
        new Set(
          ancestry
        );

      next.add(id);

      sortChildren(
        node.children,
        next
      );
    }
  }

  sortChildren(roots);

  return roots;
}

export function flattenTree(
  roots = []
) {
  const result = [];

  function walk(
    nodes,
    depth = 0,
    ancestry = new Set()
  ) {
    for (
      const node of
        nodes
    ) {
      const id =
        String(node.id);

      if (
        ancestry.has(id)
      ) {
        continue;
      }

      result.push({
        ...node,
        depth,
      });

      const next =
        new Set(
          ancestry
        );

      next.add(id);

      walk(
        node.children || [],
        depth + 1,
        next
      );
    }
  }

  walk(roots);

  return result;
}

export function getOrganizationPath(
  node
) {
  return [
    node.company_name,
    node.branch_group_name,
    node.branch_name,
    node.department_name,
    node.division_name,
    node.unit_name,
  ]
    .filter(Boolean)
    .join(" / ");
}

export function getPrimaryOccupant(
  node
) {
  return (
    node?.occupants?.[0] ||
    null
  );
}
