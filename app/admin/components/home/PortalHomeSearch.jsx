"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  AutoComplete,
  Input,
} from "antd";

import {
  SearchOutlined,
} from "@ant-design/icons";

export default function PortalHomeSearch({
  menus = [],
  onNavigate,
}) {
  const [
    value,
    setValue,
  ] =
    useState("");

  const options =
    useMemo(
      () => {
        const keyword =
          value
            .trim()
            .toLowerCase();

        const source =
          keyword
            ? menus.filter(
                (item) =>
                  item.searchText
                    ?.includes(
                      keyword
                    )
              )
            : menus;

        return source
          .slice(0, 12)
          .map(
            (item) => ({
              value:
                item.href,

              label: (
                <div className="flex min-w-0 items-center justify-between gap-3 py-1">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-800">
                      {item.label}
                    </div>

                    <div className="truncate text-xs text-slate-400">
                      {item.trail.join(
                        " › "
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 text-xs text-blue-500">
                    ไปหน้า
                  </span>
                </div>
              ),
            })
          );
      },
      [
        menus,
        value,
      ]
    );

  return (
    <div className="-mt-5 px-4 sm:px-6">
      <div className="relative z-20 mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/60">
        <AutoComplete
          value={value}
          options={options}
          style={{
            width: "100%",
          }}
          onChange={
            setValue
          }
          onSelect={(
            href
          ) => {
            setValue("");
            onNavigate?.(
              href
            );
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
              if (
                options[0]
                  ?.value
              ) {
                onNavigate?.(
                  options[0]
                    .value
                );

                setValue("");
              }
            }}
          />
        </AutoComplete>
      </div>
    </div>
  );
}
