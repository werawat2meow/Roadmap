'use client';

import * as Icons from '@ant-design/icons';

export default function AntIcon({
  name,
  ...props
}) {
  const IconComponent = Icons[name];

  if (!IconComponent) {
    console.warn(`AntIcon: Icon "${name}" not found.`);
    return null;
  }

  return <IconComponent {...props} />;
}