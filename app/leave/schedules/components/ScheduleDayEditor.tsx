"use client";

import { useEffect, useRef, useState } from "react";
import type { ScheduleEmployee, ScheduleItem } from "./ScheduleGrid";

type Props = {
  employee: ScheduleEmployee;
  date: string;
  item: ScheduleItem | null;
  defaultDayOff: boolean;
  onClose: () => void;
  onSaved: () => void;
};

function timeInBangkok(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function bangkokDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export default function ScheduleDayEditor({
  employee,
  date,
  item,
  defaultDayOff,
  onClose,
  onSaved,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [dayType, setDayType] = useState<"WORK" | "OFF">(
    item?.dayType || (defaultDayOff ? "OFF" : "WORK"),
  );

  const [intervals, setIntervals] = useState(() => {
    if (item?.intervals.length) {
      return item.intervals.map((interval) => ({
        startTime: timeInBangkok(interval.startsAt),
        endTime: timeInBangkok(interval.endsAt),
        nextDay: bangkokDate(interval.endsAt) > date,
      }));
    }

    const start = employee.defaults.startTime;
    const end = employee.defaults.endTime;

    return [
      {
        startTime: start || "",
        endTime: end || "",
        nextDay: Boolean(start && end && end < start),
      },
    ];
  });

  const [note, setNote] = useState(item?.note || "");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const savingRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  function updateInterval(
    index: number,
    patch: Partial<(typeof intervals)[number]>,
  ) {
    setIntervals((previous) =>
      previous.map((interval, currentIndex) =>
        currentIndex === index ? { ...interval, ...patch } : interval,
      ),
    );
  }

  async function saveDraft() {
    if (savingRef.current) return;

    savingRef.current = true;
    setSaving(true);
    setSaveError("");

    try {
      const response = await fetch("/leave/api/schedules/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employee.id,
          workDate: date,
          dayType,
          intervals: dayType === "WORK" ? intervals : [],
          note,
          expectedId: item?.id ?? null,
          expectedRevision: item?.revision ?? null,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "บันทึกตารางไม่สำเร็จ");
      }
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error ? error.message : "บันทึกตารางไม่สำเร็จ",
      );

      return;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }

    onSaved();
  }

  const dateLabel = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500";

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();

        if (!savingRef.current) {
          onClose();
        }
      }}
      onClose={() => {
        if (!savingRef.current) {
          onClose();
        }
      }}
      aria-labelledby="schedule-editor-title"
      className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="border-b border-slate-200 p-5">
        <h2 id="schedule-editor-title" className="text-lg font-bold">
          กำหนดตารางงาน
        </h2>

        <p className="mt-2 font-semibold">
          {employee.name || employee.employeeCode}
        </p>

        <p className="mt-1 text-sm text-slate-600">
          รหัส {employee.employeeCode}
        </p>

        <p className="mt-1 text-sm text-slate-600">{dateLabel}</p>
      </div>

      <fieldset
        disabled={saving}
        className="min-w-0 space-y-5 border-0 p-5 disabled:opacity-60"
      >
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["WORK", "วันทำงาน"],
              ["OFF", "หยุดประจำสัปดาห์"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={dayType === value}
              onClick={() => setDayType(value)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                dayType === value
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {dayType === "WORK" && (
          <div className="space-y-3">
            {intervals.map((interval, index) => (
              <div
                key={index}
                className="space-y-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    ช่วงงานที่ {index + 1}
                  </span>

                  {intervals.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setIntervals((previous) =>
                          previous.filter(
                            (_, currentIndex) => currentIndex !== index,
                          ),
                        )
                      }
                      className="text-xs text-rose-700"
                    >
                      ลบช่วงนี้
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-xs text-slate-700">
                    <span>เวลาเข้างาน</span>
                    <input
                      type="time"
                      step={60}
                      value={interval.startTime}
                      onChange={(event) =>
                        updateInterval(index, {
                          startTime: event.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </label>

                  <label className="space-y-1 text-xs text-slate-700">
                    <span>เวลาเลิกงาน</span>
                    <input
                      type="time"
                      step={60}
                      value={interval.endTime}
                      onChange={(event) =>
                        updateInterval(index, {
                          endTime: event.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={interval.nextDay}
                    onChange={(event) =>
                      updateInterval(index, {
                        nextDay: event.target.checked,
                      })
                    }
                    className="accent-emerald-600"
                  />
                  เลิกงานวันถัดไป
                </label>
              </div>
            ))}

            <button
              type="button"
              disabled={intervals.length >= 8}
              onClick={() =>
                setIntervals((previous) => [
                  ...previous,
                  {
                    startTime: "",
                    endTime: "",
                    nextDay: false,
                  },
                ])
              }
              className="text-sm font-semibold text-emerald-700 disabled:opacity-40"
            >
              + เพิ่มช่วงงาน
            </button>

            <p className="text-xs text-slate-500">
              เพิ่มช่วงงานเมื่อทำงานแยกช่วง ไม่จำเป็นต้องกำหนดช่วงพัก
            </p>
          </div>
        )}

        <label className="block space-y-2 text-sm text-slate-700">
          <span>หมายเหตุ</span>
          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="หมายเหตุของวันนี้"
            className={inputClass}
          />
        </label>

        {saveError && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            {saveError}
          </p>
        )}

        <p className="text-xs text-slate-500">
          บันทึกเป็นฉบับร่าง สามารถเปิดกลับมาแก้ไขได้ ยังไม่เผยแพร่ตาราง
        </p>
      </fieldset>

      <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
        <button
          type="button"
          disabled={saving}
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          ยกเลิก
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => void saveDraft()}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกฉบับร่าง"}
        </button>
      </div>
    </dialog>
  );
}
