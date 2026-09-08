"use client";

import { useEffect, useRef, useState } from "react";
import { uiText } from "@/app/jobs/components/translations";
import { getUIText } from "@/app/jobs/lib/ui";

/* ============================================================== */
/* Static maps & helpers                                          */
/* ============================================================== */

const STATUS_TEXT = {
  1: "รอพิจารณา",
  2: "HRD ส่งต่อ HRM",
  3: "ผ่านการคัดเลือกเข้าสัมภาษณ์",
  4: "นัดสัมภาษณ์",
  5: "ยืนยันการสัมภาษณ์",
  6: "เลื่อนการสัมภาษณ์",
  7: "ขาดการสัมภาษณ์",
  8: "ส่งต่อการสัมภาษณ์",
  9: "ต้นสังกัดปล่อยให้ใช้ข้อมูลร่วมกัน",
  10: "ผ่านการคัดเลือก",
  11: "ไม่ผ่านการคัดเลือก",
  12: "นัดวันเริ่มทำงาน",
  13: "เลื่อนวันเริ่มทำงาน",
  14: "ไม่มาทำงานตามนัด",
  15: "อัพเดตเข้าฐานข้อมูลกลาง",
  16: "ยื่น Resume",
  17: "รอเริ่มงาน",
  18: "รออัปเดตข้อมูล resume",
  19: "รอพิจารณาอีกครั้ง",
  99: "Backlist",
  0: "ยกเลิก",
};

// จัดกลุ่มสถานะเป็นโทนของตราปั๊ม: default / progress / approved / rejected
const STATUS_TONE = {
  1: "default", 16: "default",
  2: "progress", 4: "progress", 5: "progress", 6: "progress",
  8: "progress", 9: "progress", 13: "progress", 17: "progress",
  3: "approved", 10: "approved", 12: "approved", 15: "approved",
  7: "rejected", 11: "rejected", 14: "rejected", 99: "rejected", 0: "rejected",
};

const SECTIONS = [
  { id: "personal", num: "01", label: "ข้อมูลส่วนตัว" },
  { id: "work", num: "02", label: "ประวัติการทำงาน" },
  { id: "program-skills", num: "03", label: "ทักษะด้านโปรแกรม" },
  { id: "language-skills", num: "04", label: "ทักษะด้านภาษา" },
  { id: "education", num: "05", label: "ประวัติการศึกษา" },
  { id: "documents", num: "06", label: "เอกสารแนบ" },
];

const value = (v) => (v === null || v === undefined || v === "" ? "—" : v);

const yesNo = (v) => {
  if (v === true) return "ใช่";
  if (v === false) return "ไม่ใช่";
  return "—";
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatMoney = (n) => {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  return Number.isNaN(num) ? String(n) : num.toLocaleString("th-TH");
};

const renderDriverLicense = (driverLicense) => {
  if (!driverLicense) return "—";
  let data = driverLicense;
  if (typeof driverLicense === "string") {
    try {
      data = JSON.parse(driverLicense);
    } catch {
      return value(driverLicense);
    }
  }
  const items = [];
  if (data.car) items.push("รถยนต์");
  if (data.motorcycle) items.push("รถจักรยานยนต์");
  if (data.other) items.push(data.otherText ? `อื่น ๆ (${data.otherText})` : "อื่น ๆ");
  return items.length ? items.join(", ") : "—";
};

const getResidenceTypeText = (type) => {
  switch (type) {
    case "own_house": return getUIText(uiText.residenceOwnHouse, "TH");
    case "rented_house": return getUIText(uiText.residenceRentedHouse, "TH");
    case "condominium": return getUIText(uiText.residenceCondo, "TH");
    case "dormitory": return getUIText(uiText.residenceDormitory, "TH");
    case "relative_house": return getUIText(uiText.residenceRelative, "TH");
    case "other": return getUIText(uiText.residenceOther, "TH");
    default: return value(type);
  }
};

const getMilitaryStatusText = (type) => {
  switch (type) {
    case "not_served": return getUIText(uiText.militaryNotYet, "TH");
    case "completed": return getUIText(uiText.militaryDone, "TH");
    case "exempted": return getUIText(uiText.militaryExempt, "TH");
    default: return value(type);
  }
};

const initials = (first, last) => {
  const a = (first || "").trim().charAt(0);
  const b = (last || "").trim().charAt(0);
  return (a + b).toUpperCase() || "—";
};

/* ============================================================== */
/* Small building blocks                                          */
/* ============================================================== */

function Field({ label, children, wide }) {
  return (
    <div className={`field ${wide ? "field--wide" : ""}`}>
      <span className="field-label">{label}</span>
      <span className="field-value">{children}</span>
    </div>
  );
}

function FieldGrid({ children }) {
  return <div className="grid">{children}</div>;
}

function SubHeading({ children }) {
  return <div className="sub">{children}</div>;
}

function SectionCard({ id, num, title, children }) {
  return (
    <section id={id} className="section">
      <div className="section-head">
        <span className="section-num">{num}</span>
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}

function EmptyRow({ children = "ไม่มีข้อมูล" }) {
  return <div className="empty">{children}</div>;
}

function DataTable({ columns, rows, rowKey }) {
  if (!rows || rows.length === 0) return <EmptyRow />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align || "left" }}>
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row[rowKey] ?? i}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align || "left" }}>
                  {c.render ? c.render(row[c.dataIndex], row) : value(row[c.dataIndex])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================== */
/* Main component                                                  */
/* ============================================================== */

export default function CandidateProfile({
  application,
  education = [],
  workExperience = [],
  languageSkills = [],
  systemProgramSkills = [],
  documents = [],
  interviews = [],
}) {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const sectionRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const tone = STATUS_TONE[application.status] ?? "default";
  const statusLabel = STATUS_TEXT[application.status] ?? "—";

  const fullName = `${application.titles?.title_name_th ?? ""} ${value(application.first_name)} ${value(application.last_name)}`;
  const nickname = `${value(application.nickname_th)} / ${value(application.nickname_en)}`;

  return (
    <div className="dossier">
      {/* ============ Hero: identity card ============ */}
      <div className="hero">
        <div className="hero-photo">
          {application.profile_image_url ? (
            <img src={application.profile_image_url} alt={fullName} />
          ) : (
            <span>{initials(application.first_name, application.last_name)}</span>
          )}
        </div>

        <div className="hero-info">
          <div className="hero-eyebrow">แฟ้มประวัติผู้สมัครงาน</div>
          <h1 className="hero-name">{fullName}</h1>
          <div className="hero-nick">ชื่อเล่น {nickname}</div>

          <div className="hero-tags">
            <div className="hero-tag">
              <span className="tag-label">ตำแหน่งที่สมัคร</span>
              <span className="tag-value">{value(application.positions?.position_name)}</span>
            </div>
            <div className="hero-tag">
              <span className="tag-label">เงินเดือนที่คาดหวัง</span>
              <span className="tag-value">{formatMoney(application.expected_salary)} บาท</span>
            </div>
            {application.from_social_media && (
              <div className="hero-tag">
                <span className="tag-label">ทราบข่าวจาก</span>
                <span className="tag-value">{application.from_social_media}</span>
              </div>
            )}
          </div>
        </div>

        <div className={`stamp stamp--${tone}`}>
          <span className="stamp-text">{statusLabel}</span>
        </div>
      </div>

      <div className="layout">
        {/* ============ Sidebar nav ============ */}
        <nav className="nav">
          <div className="nav-inner">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`nav-item ${activeSection === s.id ? "is-active" : ""}`}
                onClick={() => scrollTo(s.id)}
              >
                <span className="nav-num">{s.num}</span>
                <span className="nav-label">{s.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* ============ Content ============ */}
        <main className="content">
          {/* 01 ข้อมูลส่วนตัว */}
          <SectionCard id="personal" num="01" title="ข้อมูลส่วนตัว">
            <div style={{ padding: "18px 20px 0px" }}>
              <SubHeading>ข้อมูลทั่วไป</SubHeading>
            </div>
            <FieldGrid>
              <Field label="ตำแหน่งอื่นที่สนใจ">{value(application.other_position)}</Field>
              <Field label="วันเกิด">{formatDate(application.date_of_birth)}</Field>
              <Field label="อายุ">{value(application.age)}</Field>
              <Field label="เพศ">{value(application.genders?.gender_name_th)}</Field>
              <Field label="ส่วนสูง (ซม.)">{value(application.height)}</Field>
              <Field label="น้ำหนัก (กก.)">{value(application.weight)}</Field>
              <Field label="สัญชาติ">{value(application.nationalities?.nationality_name_th)}</Field>
              <Field label="ศาสนา">{value(application.religions?.religion_name_th)}</Field>
              <Field label="เลขบัตรประชาชน">{value(application.identity_no)}</Field>
              <Field label="สถานภาพสมรส">{value(application.marital_statuses?.marital_status_name_th)}</Field>
              <Field label="จำนวนบุตร">{value(application.children)}</Field>
              <Field label="ใบขับขี่">{renderDriverLicense(application.driver_license)}</Field>
              {application.gender !== "female" && (
                <Field label="สถานะทางทหาร">{getMilitaryStatusText(application.military_status)}</Field>
              )}
              {application.gender !== "male" && (
                <Field label="อายุครรภ์">{value(application.pregnancy_age)}</Field>
              )}
            </FieldGrid>

            <div style={{ padding: "18px 20px 0px" }}>
              <SubHeading>ที่อยู่และการติดต่อ</SubHeading>
            </div>
            <FieldGrid>
              <Field label="บ้านเลขที่">{value(application.current_address_no)}</Field>
              <Field label="หมู่">{value(application.village_no)}</Field>
              <Field label="ถนน">{value(application.street)}</Field>
              <Field label="ตำบล">{value(application.subdistrict_name)}</Field>
              <Field label="อำเภอ">{value(application.district_name)}</Field>
              <Field label="จังหวัด">{value(application.province_name)}</Field>
              <Field label="รหัสไปรษณีย์">{value(application.postal_code)}</Field>
              {application.residence_type === "other" ? (
                <Field label="อื่น ๆ">{value(application.residence_other)}</Field>
              ) : (
                <Field label="ลักษณะที่อยู่อาศัย">{getResidenceTypeText(application.residence_type)}</Field>
              )}
              <Field label="เบอร์โทรศัพท์">{value(application.phone_number)}</Field>
              <Field label="LINE ID">{value(application.line_id)}</Field>
              <Field label="E-mail">{value(application.email)}</Field>
            </FieldGrid>

            <div style={{ padding: "18px 20px 0px" }}>
              <SubHeading>บุคคลที่ติดต่อกรณีฉุกเฉิน</SubHeading>
            </div>
            <FieldGrid>
              <Field label="ชื่อ">{value(application.emergency_name)}</Field>
              <Field label="เบอร์โทรศัพท์">{value(application.emergency_phone)}</Field>
              <Field label="ความสัมพันธ์">{value(application.emergency_relationship)}</Field>
            </FieldGrid>

            <div style={{ padding: "18px 20px 0px" }}>
              <SubHeading>ข้อมูลสุขภาพและประวัติ</SubHeading>
            </div>
            <FieldGrid>
              <Field label="โรคประจำตัว">{yesNo(application.underlying_disease)}</Field>
              <Field label="เคยต้องคดีอาญา">{yesNo(application.serious_crime)}</Field>
              <Field label="เคยทุจริต">{yesNo(application.dishonest)}</Field>
            </FieldGrid>
          </SectionCard>

          {/* 02 ประวัติการทำงาน */}
          <SectionCard id="work" num="02" title="ประวัติการทำงาน">
            <DataTable
              rowKey="id"
              rows={workExperience}
              columns={[
                { key: "period", title: "ระยะเวลา", dataIndex: "period", width: 160 },
                { key: "company_name", title: "บริษัท", dataIndex: "company_name" },
                { key: "position", title: "ตำแหน่ง", dataIndex: "position" },
                {
                  key: "latest_salary",
                  title: "เงินเดือนล่าสุด",
                  dataIndex: "latest_salary",
                  align: "right",
                  width: 150,
                  render: (v) => formatMoney(v),
                },
                { key: "reason_for_leaving", title: "เหตุผลที่ลาออก", dataIndex: "reason_for_leaving" },
              ]}
            />
          </SectionCard>

          {/* 03 ทักษะด้านโปรแกรม */}
          <SectionCard id="program-skills" num="03" title="ทักษะด้านโปรแกรม">
            <DataTable
              rowKey="id"
              rows={systemProgramSkills}
              columns={[
                { key: "system_program", title: "System / Program", dataIndex: "system_program" },
                {
                  key: "good",
                  title: "ดี",
                  dataIndex: "good",
                  align: "center",
                  width: 90,
                  render: (v) => (v == 1 ? "✓" : "—"),
                },
                {
                  key: "fair",
                  title: "พอใช้",
                  dataIndex: "fair",
                  align: "center",
                  width: 90,
                  render: (v) => (v == 1 ? "✓" : "—"),
                },
              ]}
            />
          </SectionCard>

          {/* 04 ทักษะด้านภาษา */}
          <SectionCard id="language-skills" num="04" title="ทักษะด้านภาษา">
            <DataTable
              rowKey="id"
              rows={languageSkills}
              columns={[
                { key: "language", title: "ภาษา", dataIndex: "language" },
                { key: "listening", title: "ฟัง", dataIndex: "listening", align: "center", width: 100 },
                { key: "speaking", title: "พูด", dataIndex: "speaking", align: "center", width: 100 },
                { key: "reading", title: "อ่าน", dataIndex: "reading", align: "center", width: 100 },
                { key: "writing", title: "เขียน", dataIndex: "writing", align: "center", width: 100 },
              ]}
            />
          </SectionCard>

          {/* 05 ประวัติการศึกษา */}
          <SectionCard id="education" num="05" title="ประวัติการศึกษา">
            <DataTable
              rowKey="id"
              rows={education}
              columns={[
                {
                  key: "degree_level",
                  title: "ระดับการศึกษา",
                  dataIndex: "degree_level",
                  width: 160,
                  render: (v) => {
                    switch (v) {
                      case "high_school": return "มัธยมศึกษา";
                      case "vocational": return "อาชีวศึกษา";
                      case "bachelor": return "ปริญญาตรี";
                      case "other": return "อื่นๆ";
                      default: return v || "—";
                    }
                  },
                },
                { key: "institution", title: "สถาบัน", dataIndex: "institution" },
                { key: "faculty", title: "คณะ", dataIndex: "faculty" },
                { key: "major", title: "สาขา", dataIndex: "major" },
                { key: "graduated_year", title: "ปีที่จบ", dataIndex: "graduated_year", align: "center", width: 100 },
                { key: "gpa", title: "GPA", dataIndex: "gpa", align: "center", width: 90 },
              ]}
            />
          </SectionCard>

          {/* 06 เอกสารแนบ + Presentation */}
          <SectionCard id="documents" num="06" title="เอกสารแนบ">
            <DataTable
              rowKey="id"
              rows={documents}
              columns={[
                { key: "document_type", title: "ประเภทเอกสาร", dataIndex: "document_type", width: 160 },
                { key: "title", title: "ชื่อเอกสาร", dataIndex: "title" },
                { key: "file_name", title: "ชื่อไฟล์", dataIndex: "file_name" },
                {
                  key: "download",
                  title: "ดาวน์โหลด",
                  dataIndex: "file_url",
                  align: "center",
                  width: 120,
                  render: (v) =>
                    v ? (
                      <a className="download-link" href={v} target="_blank" rel="noopener noreferrer">
                        ดาวน์โหลด
                      </a>
                    ) : (
                      "—"
                    ),
                },
              ]}
            />

            {application.self_presentation_url && (
              <div className="presentation">
                <span className="presentation-label">Presentation URL</span>
                <a
                  className="presentation-link"
                  href={application.self_presentation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  เปิด Presentation ↗
                </a>
              </div>
            )}
          </SectionCard>
        </main>
      </div>
    </div>
  );
}