

export default function EvaluationSummaryPanel() {
  return (
    <div className="space-y-6 font-sans">
      {/* ส่วนบน: สรุปคะแนน และ ความคาดหวัง แบ่งครึ่งเท่ากัน */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        
        {/* กล่องสรุปคะแนน */}
        <div className="overflow-hidden rounded-[16px] border border-blue-200 bg-white shadow-sm flex flex-col justify-between">
          <div className="bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white">
            สรุปคะแนน
          </div>
          <div className="divide-y divide-slate-100 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-[1fr_96px] gap-3 px-5 py-3 text-sm text-slate-600">
              <span>คะแนนประเมินผลงาน</span>
              <span className="text-right font-bold text-[#2b76f7]">100</span>
            </div>
            <div className="grid grid-cols-[1fr_96px] gap-3 px-5 py-3 text-sm text-slate-600">
              <span>คิดเป็นเปอร์เซ็นต์</span>
              <span className="text-right font-bold text-[#2b76f7]">81%</span>
            </div>
          </div>
          <div className="bg-blue-50 border-t border-blue-100 px-4 py-3 text-center text-[13px] font-semibold text-blue-600 leading-relaxed">
            เฉพาะพนักงานต่างชาติ<br />ให้ดำเนินการขอใบอนุญาตทำงาน
            </div>
            <div className="border-t border-blue-100 px-5 py-3.5 bg-blue-50">
            <div className="flex justify-center gap-8 text-sm text-slate-700">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                <span>อนุมัติ</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                <span>รอพิจารณาอีกครั้ง</span>
                </label>
            </div>
            </div>
        </div>

        {/* กล่องความคาดหวัง */}
        <div className="overflow-hidden rounded-[16px] border border-blue-200 bg-white shadow-sm flex flex-col">
            {/* หัวตารางสีน้ำเงิน */}
            <div className="grid grid-cols-2 bg-[#2b76f7] px-5 py-2.5 text-sm font-semibold text-white">
                <div className="text-left">ความคาดหวัง</div>
                <div className="text-right">เกรดหรือ ผลคะแนน</div>
            </div>
            
            {/* ส่วนเนื้อหาหลักเปลี่ยนพื้นหลังเป็น bg-white และใช้ class สลับสีเฉพาะแถวคี่ */}
            <div className="divide-y divide-blue-50 bg-white flex-1 flex flex-col [&>div:nth-child(even)]:bg-[#eef4ff]">
                {[
                ['Probation', 'B : 75 - 84 (ดี)', 'text-blue-600'],
                ['Performance', 'A : 85 - 100 (ดีมาก)', 'text-emerald-600'],
                ['Promotion', 'B : 75 - 84 (ดี)', 'text-blue-600'],
                ['Progression', 'B : 75 - 84 (ดี)', 'text-blue-600'],
                ].map(([label, value, textColor]) => (
                <div key={label} className="grid grid-cols-2 px-5 py-3 text-sm">
                    <div className="text-blue-700 font-medium">{label}</div>
                    <div className={`text-right font-semibold ${textColor}`}>{value}</div>
                </div>
                ))}
            </div>
        </div>
      </div>

      {/* ส่วนกลาง: ข้อคิดเห็นหรือข้อเสนอแนะเพิ่มเติมจากผู้ประเมิน (เต็มความกว้าง) */}
      <div className="rounded-[16px] border border-blue-200 bg-white p-5 shadow-sm text-sm mb-6">
        <div className="font-semibold text-blue-700 border-b border-blue-100 pb-2 mb-4">
            <u>ข้อคิดเห็นหรือข้อเสนอแนะเพิ่มเติมจากผู้ประเมิน</u>
        </div>
        
        {/* ปรับให้กรอกข้อมูลได้จริงด้วย Textarea มีเส้นประเป็นพื้นหลังซ้อนสไตล์ในรูปภาพ */}
        <div className="relative rounded-[12px] border border-slate-100 bg-[#f8f9fa] p-4">
            <textarea
            rows={4}
            placeholder="ข้อคิดเห็นเพิ่มเติม"
            className="w-full bg-transparent text-slate-700 placeholder-slate-400 font-light resize-none border-0 p-0 focus:outline-none focus:ring-0 text-sm leading-[32px]"
            style={{
                backgroundImage: 'linear-gradient(to bottom, transparent 31px, #cbd5e1 31px, #cbd5e1 32px, transparent 32px)',
                backgroundSize: '100% 32px',
                backgroundAttachment: 'local'
            }}
            />
        </div>
        </div>

      {/* ส่วนล่าง: เซ็นชื่อและวันที่ (พื้นหลังเทาอ่อนตามภาพ) */}
      <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm text-sm">
        <div className="grid gap-8 md:grid-cols-2">
            {/* ฝั่งผู้ประเมิน */}
            <div className="space-y-4">
            <div className="font-semibold text-slate-600">ลงชื่อผู้ประเมิน</div>
            {/* เปลี่ยนจาก div เส้นขีดธรรมดา เป็น Input ที่พิมพ์ได้และเหลือเส้นใต้ไว้เซ็นปากกา */}
            <input 
                type="text"
                placeholder="( พิมพ์ชื่อ-นามสกุล หรือเว้นว่างเพื่อเซ็น )"
                className="w-full max-w-[85%] bg-transparent border-b border-slate-300 pb-1 text-slate-700 placeholder-slate-400 font-light focus:outline-none focus:border-blue-500 text-sm"
            />
            <div className="space-y-1">
                <label className="block text-xs text-slate-500 font-medium">วันที่</label>
                <input 
                type="date" 
                className="w-full max-w-[85%] bg-transparent border-b border-slate-300 py-1 text-slate-700 focus:outline-none focus:border-blue-500 text-sm"
                />
            </div>
            </div>
            
            {/* ฝั่งพนักงานรับทราบ */}
            <div className="space-y-4">
            <div className="font-semibold text-slate-600">พนักงานรับทราบ</div>
            {/* เปลี่ยนจาก div เส้นขีดธรรมดา เป็น Input ที่พิมพ์ได้และเหลือเส้นใต้ไว้เซ็นปากกา */}
            <input 
                type="text"
                placeholder="( พิมพ์ชื่อ-นามสกุล หรือเว้นว่างเพื่อเซ็น )"
                className="w-full max-w-[85%] bg-transparent border-b border-slate-300 pb-1 text-slate-700 placeholder-slate-400 font-light focus:outline-none focus:border-blue-500 text-sm"
            />
            <div className="space-y-1">
                <label className="block text-xs text-slate-500 font-medium">วันที่</label>
                <input 
                type="date" 
                className="w-full max-w-[85%] bg-transparent border-b border-slate-300 py-1 text-slate-700 focus:outline-none focus:border-blue-500 text-sm"
                />
            </div>
            </div>
        </div>
        </div>

    </div>
  );
}
