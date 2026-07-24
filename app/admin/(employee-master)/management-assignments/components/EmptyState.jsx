"use client";

import {
  InboxOutlined,
} from "@ant-design/icons";

export default function EmptyState({

  icon,

  title = "ไม่พบข้อมูล",

  description = "ยังไม่มีข้อมูล",

  action = null,

}) {

  const DisplayIcon =
    icon || (
      <InboxOutlined />
    );

  return (

    <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white px-8 py-16">

      <div className="mx-auto flex max-w-md flex-col items-center text-center">

        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl text-slate-400">

          {DisplayIcon}

        </div>

        <h3 className="mt-6 text-xl font-black text-slate-700">

          {title}

        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-500">

          {description}

        </p>

        {action && (

          <div className="mt-8">

            {action}

          </div>

        )}

      </div>

    </div>

  );

}