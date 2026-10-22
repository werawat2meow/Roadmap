"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ScheduleGrid, {
  type ScheduleEmployee,
  type ScheduleItem,
} from "./ScheduleGrid";

import {
  absoluteIntervals,
  cellKey,
  copyDate,
  copyScheduleToEmployees,
  currentDays,
  savedValue,
  settingsDay,
  validateDay,
  version,
  type Change,
  type DayValue,
  type SavedDay,
} from "@/lib/leave-schedule-model";

type Props = {
  year: number;
  month: number;
  dates: string[];
  employees: ScheduleEmployee[];
  schedules: ScheduleItem[];
  filters: Record<string, string>;
  onReload: () => void;
  onPendingChange: (pending: boolean) => void;
  onBusyChange: (busy: boolean) => void;
};

const inputClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900";

const buttonClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40";

const blankDay = (): DayValue => ({
  dayType: "WORK",
  intervals: [
    {
      startTime: "",
      endTime: "",
      startDayOffset: 0,
      endDayOffset: 0,
    },
  ],
  note: "",
  source: "MANUAL",
});

function DayEditor({
  title,
  initial,
  onClose,
  onApply,
}: {
  title: string;
  initial: DayValue;
  onClose: () => void;
  onApply: (day: DayValue, applyWholePeriod: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [day, setDay] = useState<DayValue>(() => structuredClone(initial));
  const [error, setError] = useState("");
  const [applyWholePeriod, setApplyWholePeriod] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function apply() {
    const value: DayValue = {
      ...day,
      source: "MANUAL",
      intervals: day.dayType === "OFF" ? [] : day.intervals,
    };

    try {
      validateDay(value);
      onApply(value, value.dayType === "WORK" && applyWholePeriod);
    } catch (error) {
      setError(error instanceof Error ? error.message : "ข้อมูลไม่ถูกต้อง");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="batch-day-title"
      className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-2xl bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
    >
      <h2 id="batch-day-title" className="font-bold">
        {title}
      </h2>

      <div className="mt-4 space-y-4">
        <select
          value={day.dayType}
          onChange={(event) =>
            setDay((previous) => ({
              ...previous,
              dayType: event.target.value as "WORK" | "OFF",
              intervals: previous.intervals.length
                ? previous.intervals
                : blankDay().intervals,
            }))
          }
          className={`${inputClass} w-full`}
          aria-label="ประเภทวัน"
        >
          <option value="WORK">วันทำงาน</option>
          <option value="OFF">หยุดประจำสัปดาห์</option>
        </select>

        {day.dayType === "WORK" && (
          <>
            {day.intervals.map((span, index) => (
              <div key={index} className="space-y-2 rounded-xl border p-3">
                <div className="flex justify-between">
                  <strong className="text-sm">ช่วงงานที่ {index + 1}</strong>

                  {day.intervals.length > 1 && (
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-red-500/10 transition-all hover:from-rose-600 hover:to-red-700 hover:shadow-md active:scale-95 cursor-pointer"
                      onClick={() =>
                        setDay((previous) => ({
                          ...previous,
                          intervals: previous.intervals.filter(
                            (_, current) => current !== index,
                          ),
                        }))
                      }
                    >
                      ลบ
                    </button>
                  )}
                </div>

                {(["startTime", "endTime"] as const).map((field) => {
                  const offsetField =
                    field === "startTime" ? "startDayOffset" : "endDayOffset";

                  return (
                    <div key={field} className="flex items-center gap-2">
                      <span className="w-10 text-xs">
                        {field === "startTime" ? "เข้า" : "ออก"}
                      </span>

                      <input
                        type="time"
                        step={60}
                        value={span[field]}
                        aria-label={`${field} ช่วงที่ ${index + 1}`}
                        className={inputClass}
                        onChange={(event) =>
                          setDay((previous) => ({
                            ...previous,
                            intervals: previous.intervals.map(
                              (item, current) =>
                                current === index
                                  ? {
                                      ...item,
                                      [field]: event.target.value,
                                    }
                                  : item,
                            ),
                          }))
                        }
                      />

                      {(field === "endTime" || index > 0) && (
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={span[offsetField] === 1}
                            onChange={(event) =>
                              setDay((previous) => ({
                                ...previous,
                                intervals: previous.intervals.map(
                                  (item, current) =>
                                    current === index
                                      ? {
                                          ...item,
                                          [offsetField]: event.target.checked
                                            ? 1
                                            : 0,
                                        }
                                      : item,
                                ),
                              }))
                            }
                            className="h-4 w-4 accent-emerald-600 cursor-pointer"
                          />

                          {field === "endTime"
                            ? "เลิกงานวันถัดไป"
                            : "ช่วงนี้เริ่มวันถัดไป"}
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            <button
              type="button"
              disabled={day.intervals.length >= 8}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:from-amber-600 hover:to-orange-700 hover:shadow-lg active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:from-slate-300 disabled:to-slate-400 disabled:text-slate-500 disabled:shadow-none disabled:hover:scale-100"
              onClick={() =>
                setDay((previous) => ({
                  ...previous,
                  intervals: [...previous.intervals, ...blankDay().intervals],
                }))
              }
            >
              + เพิ่มช่วงงาน
            </button>
          </>
        )}

        {day.dayType === "WORK" && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-slate-900">
            <input
              type="checkbox"
              checked={applyWholePeriod}
              onChange={(event) => setApplyWholePeriod(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-600 cursor-pointer"
            />
            <span>
              <span className="block font-semibold">
                ใช้เวลาเดียวกันทุกวันในรอบเดือนของคนนี้
              </span>
              <span className="mt-1 block text-xs text-slate-600">
                แทนที่ตารางทุกวันในรอบ รวมวันที่เคยตั้งเป็นวันหยุด
                แล้วค่อยเลือกวันหยุดเป็นรายวันภายหลัง
              </span>
            </span>
          </label>
        )}

        <textarea
          value={day.note}
          maxLength={2000}
          rows={3}
          placeholder="หมายเหตุ"
          className={`${inputClass} w-full`}
          onChange={(event) =>
            setDay((previous) => ({
              ...previous,
              note: event.target.value,
            }))
          }
        />

        {error && (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        )}

        <p className="text-xs text-slate-600">
          กดนำไปใส่ตาราง แล้วกดบันทึกตารางด้านบนอีกครั้ง
          ไม่มีการหักเวลาพักอัตโนมัติ
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-500/20 transition-all hover:from-rose-600 hover:to-red-700 hover:shadow-lg active:scale-95 cursor-pointer"
            onClick={onClose}
          >
            ยกเลิก
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-green-500/20 transition-all hover:from-emerald-600 hover:to-green-700 hover:shadow-lg active:scale-95 cursor-pointer"
            onClick={apply}
          >
            นำไปใส่ตาราง
          </button>
        </div>
      </div>
    </dialog>
  );
}

function SourcePicker({
  candidates,
  onClose,
  onSelect,
}: {
  candidates: ScheduleEmployee[];
  onClose: () => void;
  onSelect: (employeeId: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [selectedId, setSelectedId] = useState(candidates[0]?.id || "");

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="source-picker-title"
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
    >
      <h2 id="source-picker-title" className="font-bold">
        เลือกคนต้นทาง
      </h2>

      <p className="mt-2 text-sm text-slate-600">
        พบหลายคนที่มีข้อมูลจาก Settings เลือกว่าจะใช้ตารางของใครกับทุกคน
      </p>

      <select
        value={selectedId}
        onChange={(event) => setSelectedId(event.target.value)}
        aria-label="คนต้นทางสำหรับคัดลอกตาราง"
        className={`${inputClass} mt-4 w-full`}
      >
        {candidates.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.employeeCode} — {employee.name}
          </option>
        ))}
      </select>

      <p className="mt-3 text-xs text-slate-600">
        คัดลอกเวลาและวันหยุดตามวันที่ที่ต้นทางมีในตาราง
        รวมค่าที่แก้ไขไว้แต่ยังไม่บันทึก
      </p>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={buttonClass} onClick={onClose}>
          ยกเลิก
        </button>

        <button
          type="button"
          disabled={!selectedId}
          onClick={() => onSelect(selectedId)}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          ใช้คนนี้เป็นต้นทาง
        </button>
      </div>
    </dialog>
  );
}

export default function ScheduleWorkspace({
  year,
  month,
  dates,
  employees,
  schedules,
  filters,
  onReload,
  onPendingChange,
  onBusyChange,
}: Props) {
  const [sourceEmployeeId, setSourceEmployeeId] = useState("");
  const [sourceCandidates, setSourceCandidates] = useState<ScheduleEmployee[]>(
    [],
  );
  const [choosingSource, setChoosingSource] = useState(false);
  const [pending, setPending] = useState<Record<string, Change>>({});
  const [snapshot, setSnapshot] = useState<SavedDay[]>([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{
    employee: ScheduleEmployee;
    date: string;
    initial: DayValue;
  } | null>(null);

  const base = useMemo(
    () => currentDays([...schedules, ...snapshot]),
    [schedules, snapshot],
  );
  const pendingCount = Object.keys(pending).length;
  const hasPending = pendingCount > 0;
  const sourceEmployee =
    sourceCandidates.find((item) => item.id === sourceEmployeeId) ||
    employees.find((item) => item.id === sourceEmployeeId);

  useEffect(() => {
    onPendingChange(hasPending);
  }, [hasPending, onPendingChange]);

  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);

  useEffect(() => {
    if (!hasPending && !busy) return;
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    function beforeLink(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (!anchor) return;
      if (
        busy ||
        !window.confirm("มีตารางที่ยังไม่บันทึก ต้องการออกจากหน้านี้หรือไม่?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", beforeLink, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", beforeLink, true);
    };
  }, [hasPending, busy]);

  function visibleValue(
    employeeId: string,
    date: string,
    saved = base,
  ): DayValue | null {
    const key = cellKey(employeeId, date);
    if (pending[key]) return pending[key];
    const row = saved.get(key);
    return row ? savedValue(row) : null;
  }

  function stage(
    proposals: { employeeId: string; workDate: string; value: DayValue }[],
    saved = base,
  ) {
    const additions: Record<string, Change> = {};
    for (const proposal of proposals) {
      validateDay(proposal.value);
      const key = cellKey(proposal.employeeId, proposal.workDate);
      additions[key] = {
        ...structuredClone(proposal.value),
        employeeId: proposal.employeeId,
        workDate: proposal.workDate,
        expected: pending[key]
          ? pending[key].expected
          : version(saved.get(key)),
      };
    }
    const count = new Set([...Object.keys(pending), ...Object.keys(additions)])
      .size;
    if (count > 20000) {
      throw new Error("จัดตารางได้ไม่เกิน 20,000 ช่องต่อการบันทึก");
    }
    setPending((previous) => ({ ...previous, ...additions }));
    setError("");
    setMessage(
      "นำลงตาราง " +
        Object.keys(additions).length +
        " ช่องแล้ว กรุณากดบันทึกตาราง",
    );
  }

  function beginWork() {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setError("");
    return true;
  }

  function endWork() {
    busyRef.current = false;
    setBusy(false);
  }

  async function loadCurrentScope() {
    const allEmployees: ScheduleEmployee[] = [];
    const allSchedules: SavedDay[] = [];
    let total = -1;

    for (let page = 1; ; page++) {
      const params = new URLSearchParams({
        ...filters,
        year: String(year),
        month: String(month),
        page: String(page),
        pageSize: "100",
      });
      const response = await fetch("/leave/api/schedules?" + params, {
        cache: "no-store",
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "อ่านรายชื่อพนักงานไม่สำเร็จ");
      }
      if (total < 0) total = json.pagination.total;
      if (total > 500) {
        throw new Error(
          "กรุณากรองสังกัดหรือแผนกให้เหลือไม่เกิน 500 คนต่อครั้ง",
        );
      }
      if (json.pagination.total !== total) {
        throw new Error("รายชื่อพนักงานเปลี่ยนระหว่างอ่านข้อมูล กรุณาลองใหม่");
      }
      allEmployees.push(...json.employees);
      allSchedules.push(...json.schedules);
      if (page >= json.pagination.totalPages) break;
    }

    if (new Set(allEmployees.map((employee) => employee.id)).size !== total) {
      throw new Error("รายชื่อพนักงานเปลี่ยนระหว่างอ่านข้อมูล กรุณาโหลดใหม่");
    }
    return { employees: allEmployees, schedules: allSchedules };
  }

  async function applyToEveryone(selectedSourceId = sourceEmployeeId) {
    const sourceEmployee =
      sourceCandidates.find((item) => item.id === selectedSourceId) ||
      employees.find((item) => item.id === selectedSourceId);

    if (!sourceEmployee) {
      setError("คลิกช่องตารางของคนต้นทางก่อน แล้วจึงกดใช้เวลาเดียวกันทุกคน");
      return;
    }
    if (!beginWork()) return;
    try {
      const loaded = await loadCurrentScope();
      const saved = currentDays(loaded.schedules);
      const sourceDays = dates.flatMap((workDate) => {
        const value = visibleValue(sourceEmployee.id, workDate, saved);
        return value ? [{ workDate, value }] : [];
      });
      if (!sourceDays.length) {
        throw new Error(
          "คนต้นทางยังไม่มีตาราง กรุณาตั้งเวลาอย่างน้อยหนึ่งวันก่อน",
        );
      }
      const proposals = copyScheduleToEmployees(
        sourceEmployee.id,
        loaded.employees.map((employee) => employee.id),
        sourceDays,
      );
      const count = loaded.employees.filter(
        (employee) => employee.id !== sourceEmployee.id,
      ).length;
      if (!count) throw new Error("ไม่มีพนักงานคนอื่นในตัวกรองนี้");
      if (
        !window.confirm(
          "ใช้ตารางของ " +
            (sourceEmployee.name || sourceEmployee.employeeCode) +
            " จำนวน " +
            sourceDays.length +
            " วัน กับพนักงานอีก " +
            count +
            " คนที่ตรงตัวกรองทุกหน้า โดยแทนที่วันเดียวกันรวมวันหยุดหรือไม่?",
        )
      )
        return;

      stage(proposals, saved);
      setSnapshot(loaded.schedules);
      setMessage(
        "คัดลอกตารางให้ " +
          count +
          " คน รวมทุกหน้าตามตัวกรองแล้ว กรุณากดบันทึกตาราง",
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "คัดลอกไม่สำเร็จ");
    } finally {
      endWork();
    }
  }

  async function importSettings() {
    if (!beginWork()) return;
    try {
      const loaded = await loadCurrentScope();
      if (!loaded.employees.length) throw new Error("ไม่พบพนักงานตามตัวกรอง");
      const saved = currentDays(loaded.schedules);
      const proposals: {
        employeeId: string;
        workDate: string;
        value: DayValue;
      }[] = [];
      let existing = 0;
      let missing = 0;

      for (const employee of loaded.employees) {
        for (const workDate of dates) {
          const key = cellKey(employee.id, workDate);
          if (pending[key] || saved.has(key)) {
            existing++;
            continue;
          }
          const value = settingsDay(employee.defaults, workDate);
          if (!value) {
            missing++;
            continue;
          }
          proposals.push({ employeeId: employee.id, workDate, value });
        }
      }

      stage(proposals, saved);
      setSnapshot(loaded.schedules);
      const proposedKeys = new Set(
        proposals.map((proposal) =>
          cellKey(proposal.employeeId, proposal.workDate),
        ),
      );

      const candidates = loaded.employees.filter((employee) =>
        dates.some((workDate) => {
          const key = cellKey(employee.id, workDate);

          // ต้องมี Settings ที่ใช้ได้ และมีข้อมูลในตารางหลังดึง
          return (
            settingsDay(employee.defaults, workDate) !== null &&
            Boolean(proposedKeys.has(key) || pending[key] || saved.has(key))
          );
        }),
      );

      setSourceCandidates(candidates);
      setChoosingSource(false);

      if (candidates.length === 1) {
        setSourceEmployeeId(candidates[0].id);
      } else {
        // มีหลายคน ให้เลือกตอนกดปุ่ม ไม่สุ่มเลือกต้นทางให้
        setSourceEmployeeId("");
      }
      setMessage(
        "ดึงเวลาและวันหยุดจาก Settings " +
          proposals.length +
          " ช่อง · ข้ามช่องที่จัดไว้แล้ว " +
          existing +
          " ช่อง · ไม่มี Settings ครบ " +
          missing +
          " ช่อง" +
          (proposals.length ? " · กรุณาตรวจและกดบันทึกตาราง" : ""),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ดึง Settings ไม่สำเร็จ",
      );
    } finally {
      endWork();
    }
  }

  async function copyPrevious() {
    if (!beginWork()) return;
    try {
      const loaded = await loadCurrentScope();
      if (!loaded.employees.length) throw new Error("ไม่พบพนักงานตามตัวกรอง");
      const sourceYear = month === 1 ? year - 1 : year;
      const sourceMonth = month === 1 ? 12 : month - 1;
      const sourceRows: SavedDay[] = [];
      let sourceDates: string[] = [];
      const ids = loaded.employees.map((employee) => employee.id);

      for (let offset = 0; offset < ids.length; offset += 100) {
        const params = new URLSearchParams({
          year: String(sourceYear),
          month: String(sourceMonth),
          pageSize: "100",
          employeeIds: ids.slice(offset, offset + 100).join(","),
        });
        const response = await fetch("/leave/api/schedules?" + params, {
          cache: "no-store",
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || "อ่านรอบก่อนไม่สำเร็จ");
        }
        sourceDates = json.period.dates;
        sourceRows.push(...json.schedules);
      }

      const sourceMap = currentDays(sourceRows);
      const proposals: {
        employeeId: string;
        workDate: string;
        value: DayValue;
      }[] = [];
      let missing = 0;
      for (const employee of loaded.employees) {
        for (const workDate of dates) {
          const sourceDate = copyDate(sourceDates, dates, workDate, "weekday");
          const row = sourceMap.get(cellKey(employee.id, sourceDate || ""));
          if (!row) {
            missing++;
            continue;
          }
          proposals.push({
            employeeId: employee.id,
            workDate,
            value: { ...savedValue(row), source: "COPY" },
          });
        }
      }
      if (!proposals.length)
        throw new Error("ไม่พบตารางที่บันทึกไว้ในเดือนก่อน");
      if (
        !window.confirm(
          "คัดลอกตารางรอบก่อนตามวันในสัปดาห์ให้พนักงาน " +
            loaded.employees.length +
            " คน รวมทุกหน้าตามตัวกรอง โดยแทนที่ช่องที่มีต้นทางหรือไม่? " +
            "ช่องที่ต้นทางไม่มีข้อมูล " +
            missing +
            " ช่องจะไม่เปลี่ยน",
        )
      )
        return;

      stage(proposals, currentDays(loaded.schedules));
      setSnapshot(loaded.schedules);
      setMessage(
        "คัดลอกรอบก่อน " +
          proposals.length +
          " ช่องแล้ว · ต้นทางไม่มีข้อมูล " +
          missing +
          " ช่อง · กรุณากดบันทึกตาราง",
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "คัดลอกไม่สำเร็จ");
    } finally {
      endWork();
    }
  }

  async function save() {
    if (!hasPending || !beginWork()) return;
    try {
      const response = await fetch("/leave/api/schedules/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveAndPublish",
          year,
          month,
          entries: Object.values(pending),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "บันทึกตารางไม่สำเร็จ");
      }
      setPending({});
      onPendingChange(false);
      onReload();
    } catch (error) {
      setError(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      endWork();
    }
  }

  const displayedSchedules = useMemo(() => {
    const visibleIds = new Set(employees.map((employee) => employee.id));
    const local: ScheduleItem[] = Object.values(pending)
      .filter((change) => visibleIds.has(change.employeeId))
      .map((change) => ({
        id: "local:" + cellKey(change.employeeId, change.workDate),
        employeeId: change.employeeId,
        workDate: change.workDate,
        dayType: change.dayType,
        state: "DRAFT",
        revision: change.expected?.revision || 0,
        shiftName: null,
        source: change.source,
        note: change.note,
        intervals: absoluteIntervals(change.workDate, change).map(
          (span, index) => ({
            id: "local:" + index,
            sequence: index + 1,
            startsAt: span.starts_at.toISOString(),
            endsAt: span.ends_at.toISOString(),
          }),
        ),
      }));
    const saved: ScheduleItem[] = Array.from(base.values())
      .filter(
        (item) =>
          visibleIds.has(item.employeeId) &&
          !pending[cellKey(item.employeeId, item.workDate)],
      )
      .map((item) => ({
        ...item,
        shiftName:
          "shiftName" in item && typeof item.shiftName === "string"
            ? item.shiftName
            : null,
        source:
          "source" in item && typeof item.source === "string"
            ? item.source
            : "MANUAL",
      }));
    return [...saved, ...local];
  }, [pending, base, employees]);

  return (
    <div>
      <fieldset
        disabled={busy}
        className="min-w-0 space-y-3 border-0 p-4 text-slate-900 disabled:opacity-60"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              คลิกช่องวันที่เพื่อตั้งเวลาทำงานหรือวันหยุด
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {sourceEmployee
                ? "คนต้นทาง: " +
                  (sourceEmployee.name || sourceEmployee.employeeCode)
                : sourceCandidates.length > 1
                  ? "ดึง Settings แล้ว กดใช้เวลาเดียวกันทุกคนเพื่อเลือกคนต้นทาง"
                  : "ดึงจาก Settings หรือตั้งตารางของคนต้นทางก่อน"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-orange-700">
              ยังไม่บันทึก {pendingCount} ช่อง
            </span>
            <button
              type="button"
              disabled={!hasPending}
              onClick={() => void save()}
              className="rounded-xl cursor-pointer bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              {busy ? "กำลังดำเนินการ..." : "บันทึกตาราง"}
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-sky-500 hover:to-blue-600 hover:shadow-lg active:scale-95 cursor-pointer"
              onClick={() => void importSettings()}
            >
              ดึงจาก Settings
            </button>

            {/* 2. ปุ่มคัดลอกจากเดือนก่อน -> ใช้สีส้ม/แอมเบอร์ (สื่อถึงประวัติ, วันเวลา, สิ่งที่ทำซ้ำ) */}
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:from-amber-500 hover:to-orange-600 hover:shadow-lg active:scale-95 cursor-pointer"
              onClick={() => void copyPrevious()}
            >
              คัดลอกจากเดือนก่อน
            </button>

            {/* 3. ปุ่มใช้เวลาเดียวกันทุกคน -> ใช้สีเขียว (สื่อถึงความสำเร็จ, การ Apply ใช้กับทุกคน) */}
            <button
              type="button"
              disabled={!sourceEmployee && sourceCandidates.length === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-green-500/20 transition-all hover:from-emerald-500 hover:to-green-600 hover:shadow-lg active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:from-slate-300 disabled:to-slate-400 disabled:text-slate-500 disabled:shadow-none disabled:hover:scale-100"
              onClick={() => {
                if (sourceEmployee) {
                  void applyToEveryone();
                } else {
                  setChoosingSource(true);
                }
              }}
            >
              ใช้เวลาเดียวกันทุกคน
            </button>
          </div>
        </div>
        {hasPending && (
          <button
            type="button"
            className="text-xs text-red-600 underline cursor-pointer"
            onClick={() => {
              if (
                window.confirm("ยกเลิกการแก้ไขที่ยังไม่บันทึกทั้งหมดหรือไม่?")
              ) {
                setPending({});
                setMessage("");
                setError("");
                setSourceCandidates([]);
                setSourceEmployeeId("");
                setChoosingSource(false);
              }
            }}
          >
            ยกเลิกการแก้ไขที่ยังไม่บันทึก
          </button>
        )}
        {message && (
          <p role="status" className="text-sm text-emerald-800">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        )}
      </fieldset>

      <fieldset disabled={busy} className="min-w-0 border-0 p-0">
        <ScheduleGrid
          dates={dates}
          employees={employees}
          schedules={displayedSchedules}
          leaves={[]}
          pendingKeys={Object.keys(pending)}
          onSelectCell={({ employee, date }) => {
            if (busyRef.current) return;
            setSourceEmployeeId(employee.id);
            setEditing({
              employee,
              date,
              initial: visibleValue(employee.id, date) || blankDay(),
            });
          }}
        />
      </fieldset>

      {choosingSource && sourceCandidates.length > 0 && (
        <SourcePicker
          candidates={sourceCandidates}
          onClose={() => setChoosingSource(false)}
          onSelect={(employeeId) => {
            setSourceEmployeeId(employeeId);
            setChoosingSource(false);

            // ส่งรหัสเข้าไปโดยตรง ไม่ต้องรอ state อัปเดต
            void applyToEveryone(employeeId);
          }}
        />
      )}

      {editing && (
        <DayEditor
          key={cellKey(editing.employee.id, editing.date)}
          title={
            (editing.employee.name || editing.employee.employeeCode) +
            " · " +
            editing.date
          }
          initial={editing.initial}
          onClose={() => setEditing(null)}
          onApply={(value, applyWholePeriod) => {
            if (
              applyWholePeriod &&
              !window.confirm(
                "ใช้เวลานี้ทุกวันในรอบของ " +
                  (editing.employee.name || editing.employee.employeeCode) +
                  " และแทนที่ตารางเดิมหรือไม่?",
              )
            )
              return;
            const targetDates = applyWholePeriod ? dates : [editing.date];
            stage(
              targetDates.map((workDate) => ({
                employeeId: editing.employee.id,
                workDate,
                value,
              })),
            );
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
