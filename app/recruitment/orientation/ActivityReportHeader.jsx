import { thaiDate } from "../lib/orientation/domain.mjs";

const reportDate = (value) => value ? new Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Bangkok",
}).format(new Date(`${value}T00:00:00+07:00`)).toUpperCase() : "-";
const cellStyle = { border: "1px solid #555", padding: "5px 4px", verticalAlign: "top", overflowWrap: "anywhere" };
const headings = ["ลำดับ", "ชื่อ-สกุล", "ชื่อเล่น", "แผนก", "ตำแหน่ง", "ระดับ", "สังกัด", "ส่งต่อหัวหน้าแผนก", "ชื่อเล่น", "ตำแหน่ง"];
const widths = [4, 14, 5, 14, 13, 4, 5, 15, 6, 20];

export default function ActivityReportHeader({ page }) {
  return <div style={{ background: "linear-gradient(100deg, #55dce0, #0750b1)", padding: 10, marginBottom: 12 }}>
    <div style={{ background: "#fff", padding: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 990px", alignItems: "center", gap: 20, marginBottom: 8 }}>
        <div style={{ fontSize: 22, lineHeight: 1.4, overflowWrap: "anywhere" }}>
          {page.sessions.map((session, index) => <div key={session.session_id || index} style={{ marginTop: index ? 14 : 0 }}>
            <div>Date : {reportDate(session.orientation_date)}</div>
            <div>{session.facilitators?.length ? session.facilitators.map((person) => <div key={person.id}>วิทยากร : {person.full_name || "-"}{person.nickname ? ` (${person.nickname})` : ""}<div>ตำแหน่ง : {person.position_name || "-"}</div><div>Group : {person.group_name || "-"}</div></div>) : "วิทยากร : -"}</div>
            {!session.facilitators?.length && <><div>ตำแหน่ง : -</div><div>Group : -</div></>}
            <div>สถานที่ : {session.location_name || "-"}</div>
          </div>)}
        </div>
        <h1 style={{ fontSize: 64, lineHeight: 1.15, fontWeight: 500, margin: 0, textAlign: "center" }}>New Employee Orientation</h1>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 17 }}>
        <colgroup>{widths.map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
        <thead><tr>{headings.map((heading, index) => <th key={index} style={{ ...cellStyle, verticalAlign: "middle", padding: "12px 4px", background: "#15558f", color: "#fff", textAlign: "center" }}>{heading}</th>)}</tr></thead>
        <tbody>{page.rows.map((row, index) => <tr key={row.application_id}>
          {[index + 1, row.full_name, row.nickname, row.department_name, row.position_name, row.level_code, row.branch_code].map((value, column) => <td key={column} style={{ ...cellStyle, textAlign: [0, 2, 5, 6].includes(column) ? "center" : "left" }}>{value || "-"}</td>)}
          <td style={cellStyle}>{row.handovers?.length ? row.handovers.map((handover) => <div key={handover.id}>{handover.receiver_full_name || "-"}</div>) : "ยังไม่มีการส่งมอบ"}</td>
          <td style={cellStyle}>{row.handovers?.length ? row.handovers.map((handover) => <div key={handover.id}>{handover.receiver_nickname || "-"}</div>) : "-"}</td>
          <td style={cellStyle}>{row.handovers?.length ? row.handovers.map((handover) => <div key={handover.id}>{handover.receiver_position_name || "-"}</div>) : "-"}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
