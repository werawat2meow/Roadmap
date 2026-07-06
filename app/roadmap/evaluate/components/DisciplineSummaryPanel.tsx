import React from 'react';

export default function DisciplineSummaryPanel() {
  return (
    <div className="space-y-6 font-sans mt-5">
      
      {/* ส่วนที่ 1: การ์ดข้อมูลสาย / Late Data */}
      <div className="overflow-hidden rounded-[16px] border border-blue-200 bg-white shadow-sm">
        {/* หัวข้อหลักสีน้ำเงินเข้มย้ายมาอยู่บนกล่องนี้แทนตามดีไซน์ที่ชอบ */}
        <div className="bg-blue-600 px-5 py-3 text-sm font-semibold text-white">
          ข้อมูลระเบียบวินัยในการทำงาน
        </div>
        
        {/* เนื้อหาภายในข้อมูลสาย */}
        <div className="p-5 space-y-3">
          <div className="text-sm font-bold text-blue-700 border-b border-blue-50 pb-1.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            ข้อมูลสาย / Late Data
          </div>
          <div className="space-y-6 text-sm text-slate-600">
            {/* กลุ่มที่ 1: ช่วงโปรโมชันปกติ (3 เดือนแรก) */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((month) => (
                <div key={month} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-between gap-2">
                  <span className="font-medium text-slate-700">เดือนที่ {month}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <input type="number" placeholder="0" className="w-full rounded border border-slate-300 px-2 py-1.5 text-center text-sm focus:border-blue-500 focus:outline-none bg-white" />
                      <span className="text-xs text-slate-500 shrink-0">ครั้ง</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input type="number" placeholder="0" className="w-full rounded border border-slate-300 px-2 py-1.5 text-center text-sm focus:border-blue-500 focus:outline-none bg-white" />
                      <span className="text-xs text-slate-500 shrink-0">นาที</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* เส้นคั่นบางๆ แบ่งกลุ่ม */}
            <div className="border-t border-dashed border-slate-200" />

            {/* กลุ่มที่ 2: ช่วงต่อโปรโมชัน */}
            <div>
              <span className="inline-block mb-3 font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded text-xs border border-amber-200">
                กรณีขยายเวลาทดลองงาน (ต่อโปร)
              </span>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2].map((month) => (
                  <div key={month} className="bg-amber-50/30 p-3 rounded-lg border border-amber-100/70 flex flex-col justify-between gap-2">
                    <span className="font-medium text-slate-700">ช่วงต่อโปร เดือนที่ {month}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <input type="number" placeholder="0" className="w-full rounded border border-slate-300 px-2 py-1.5 text-center text-sm focus:border-amber-500 focus:outline-none bg-white" />
                        <span className="text-xs text-slate-500 shrink-0">ครั้ง</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input type="number" placeholder="0" className="w-full rounded border border-slate-300 px-2 py-1.5 text-center text-sm focus:border-amber-500 focus:outline-none bg-white" />
                        <span className="text-xs text-slate-500 shrink-0">นาที</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ส่วนที่ 2: การ์ดตารางการลงโทษ / Discipline */}
      <div>
  {/* 1. แสดงผลแบบ CARD LAYOUT (เฉพาะบนจอมือถือขนาดเล็ก sm:hidden) */}
  <div className="block sm:hidden space-y-3">
    {[
      { code: 'ว.91', score: '-5', unit: 'ครั้ง' },
      { code: 'ว.92', score: '-10', unit: 'ครั้ง' },
      { code: 'ว.93', score: '-15', unit: 'ครั้ง' },
      { code: 'ว.94', score: '-100', unit: 'ครั้ง' },
      { code: 'Warning 1', score: '-25', unit: 'ฉบับ' },
      { code: 'Warning 2', score: '-50', unit: 'ฉบับ' },
      { code: 'Last Warning', score: '-100', unit: 'ฉบับ' },
      { code: 'ลาป่วย / ลากิจ', score: '-1', unit: 'วัน' },
    ].map((item, index) => (
      <div key={index} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm space-y-3">
        {/* หัวข้อและการหักคะแนน */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="font-semibold text-slate-800">{item.code}</span>
          <span className="text-xs font-medium text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
            หัก {item.score} คะแนน
          </span>
        </div>
        
        {/* ช่องกรอกข้อมูล */}
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 shrink-0 w-16">จำนวน:</span>
            <input 
              type="number" 
              placeholder="0" 
              min="0"
              className="w-20 rounded border border-slate-300 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none"
            />
            <span className="text-slate-500 text-xs">{item.unit}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 shrink-0 w-16">หัวข้อ:</span>
            <input 
              type="text" 
              placeholder="ระบุรายละเอียด..." 
              className="w-full rounded border border-slate-300 px-2 py-1 text-left text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    ))}
    
    {/* สรุปคะแนนท้ายการ์ดบนมือถือ */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex justify-between items-center font-semibold text-blue-900">
        <span>รวมคะแนนระเบียบวินัย</span>
        <span className="text-lg font-bold text-blue-700">0</span>
      </div>
    </div>

  {/* 2. แสดงผลแบบ TABLE LAYOUT เดิม (จะแสดงเมื่อจอใหญ่ขึ้น sm:block) */}
      <div className="hidden sm:block overflow-hidden rounded-[16px] border border-blue-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr className="bg-blue-600 text-white font-medium">
              <th className="px-5 py-3 text-left w-[60%]">การลงโทษ / Discipline</th>
              <th className="px-5 py-3 w-[15%]">จำนวนครั้ง</th>
              <th className="px-5 py-3 w-[10%]">หักคะแนน</th>
              <th className="px-5 py-3 text-right w-[15%] pr-6">คะแนนที่หัก</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50 bg-white text-slate-700 [&>tr:nth-child(even)]:bg-[#eef4ff]">
            {[
              { code: 'ว.91', score: '-5', unit: 'ครั้ง' },
              { code: 'ว.92', score: '-10', unit: 'ครั้ง' },
              { code: 'ว.93', score: '-15', unit: 'ครั้ง' },
              { code: 'ว.94', score: '-100', unit: 'ครั้ง' },
              { code: 'Warning 1', score: '-25', unit: 'ฉบับ' },
              { code: 'Warning 2', score: '-50', unit: 'ฉบับ' },
              { code: 'Last Warning', score: '-100', unit: 'ฉบับ' },
              { code: 'ลาป่วย / ลากิจ', score: '-1', unit: 'วัน' },
            ].map((item, index) => (
              <tr key={index} className="transition-colors hover:bg-blue-50/50">
                <td className="px-5 py-3 text-left font-light text-slate-600">
                  <div className="grid grid-cols-[110px_85px_25px_1fr] items-center gap-x-2 text-sm w-full">
                    {/* ส่วนที่ 1: ชื่อรหัส */}
                    <span className="font-medium text-slate-700 truncate">{item.code} :</span>
                    
                    {/* ส่วนที่ 2: ช่องกรอกจำนวน */}
                    <div className="flex items-center gap-1 shrink-0">
                      <input type="number" placeholder="0" min="0" className="w-12 rounded border border-slate-300 px-1 py-0.5 text-center text-sm focus:border-blue-500 focus:outline-none bg-white shadow-inner" />
                      <span className="text-slate-500 text-xs">{item.unit}</span>
                    </div>

                    {/* ส่วนที่ 3: เส้นกั้นกลาง */}
                    <span className="text-slate-300 text-center">|</span>

                    {/* ส่วนที่ 4: ช่องกรอกหัวข้อขนาดยาว (เพิ่ม w-full คลุมช่อง input ให้ยืดสุดตัว) */}
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="text-slate-500 shrink-0">หัวข้อ :</span>
                      <input 
                        type="text" 
                        placeholder="ระบุรายละเอียดการลงโทษ..." 
                        className="w-full flex-1 rounded border border-slate-300 px-2 py-0.5 text-left text-sm focus:border-blue-500 focus:outline-none bg-white shadow-inner font-light" 
                      />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center pl-7">
                    <div className="flex items-center gap-1.5 w-[100px]">
                      <input type="number" placeholder="0" min="0" className="w-full rounded border border-slate-300 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none bg-white font-medium transition-all shadow-inner" />
                      <span className="text-xs text-slate-400 shrink-0 w-[30px] text-left">{item.unit}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center gap-1 mx-auto max-w-[85px]">
                    <input 
                      type="number" 
                      defaultValue={item.score} // นำค่าคะแนนติดลบเดิมจาก Array มาตั้งเป็นค่าเริ่มต้น
                      placeholder="0"
                      className="w-full rounded border border-rose-200 px-1.5 py-0.5 text-center text-sm font-medium text-rose-600 focus:border-rose-500 focus:outline-none bg-rose-50/20 shadow-inner transition-all"
                    />
                  </div>
                </td>
                <td className="px-5 py-3 text-right pr-6 font-semibold text-rose-500">0</td>
              </tr>
            ))}
            <tr className="bg-blue-50/80 font-semibold text-blue-900 border-t border-blue-200">
              <td colSpan={3} className="px-5 py-3.5 text-center font-medium tracking-wide">รวมคะแนนระเบียบวินัย</td>
              <td className="px-5 py-3.5 text-right pr-6 font-bold text-rose-500 text-base">0</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

      {/* ส่วนที่ 3: สรุปคะแนน และ ความคาดหวังวินัย */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-[16px] border border-blue-200 bg-white shadow-sm flex flex-col">
          <div className="bg-blue-600 px-5 py-2.5 text-center text-sm font-semibold text-white">
            สรุปคะแนน
          </div>
          <div className="divide-y divide-blue-50 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-2 px-5 py-3 text-sm text-slate-600">
              <div>คะแนนเต็ม</div>
              <div className="text-right font-bold text-slate-800">100</div>
            </div>
            <div className="grid grid-cols-2 px-5 py-3 text-sm text-slate-600">
              <div>คะแนนคงเหลือ</div>
              <div className="text-right font-bold text-blue-600">100</div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[16px] border border-blue-200 bg-white shadow-sm flex flex-col">
          <div className="grid grid-cols-2 bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
            <div className="text-left">ความคาดหวัง</div>
            <div className="text-right">เกรดหรือ ผลคะแนน</div>
          </div>
          <div className="divide-y divide-blue-50 bg-white flex-1 flex flex-col [&>div:nth-child(even)]:bg-blue-50">
            {[
              ['Performance', 'A : 51 - 100 (ดีมาก)', 'text-emerald-600'],
              ['Promotion | Procession', 'B : 21 - 50 (ดี)', 'text-blue-600'],
              ['Probation', 'C : 1 - 20 (พอใช้)', 'text-amber-600'],
              ['ไม่ผ่าน', 'D : 0 (ต่ำกว่ามาตรฐาน)', 'text-rose-600'],
            ].map(([label, value, textColor], index) => (
              <div key={index} className="grid grid-cols-2 px-5 py-2.5 text-sm">
                <div className="text-blue-700 font-medium">{label}</div>
                <div className={`text-right font-semibold ${textColor}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ส่วนที่ 4: การ์ดข้อคิดเห็นเพิ่มเติมจากผู้ประเมิน */}
      <div className="rounded-[16px] border border-blue-200 bg-white p-5 shadow-sm text-sm">
        <div className="font-semibold text-blue-700 border-b border-blue-100 pb-2 mb-4">
          <u>ข้อคิดเห็นหรือข้อเสนอแนะเพิ่มเติมจากผู้ประเมิน</u>
        </div>
        <div className="relative rounded-[12px] border border-slate-100 bg-[#f8f9fa] p-4">
          <textarea
            rows={3}
            placeholder="กรอกข้อคิดเห็นหรือข้อเสนอแนะเกี่ยวกับระเบียบวินัยตรงนี้..."
            className="w-full bg-transparent text-slate-700 placeholder-slate-400 font-light resize-none border-0 p-0 focus:outline-none focus:ring-0 text-sm leading-[32px]"
            style={{
              backgroundImage: 'linear-gradient(to bottom, transparent 31px, #cbd5e1 31px, #cbd5e1 32px, transparent 32px)',
              backgroundSize: '100% 32px',
              backgroundAttachment: 'local'
            }}
          />
        </div>
      </div>

      {/* ส่วนที่ 5: การ์ดโซนลงชื่อและวันที่ */}
      <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm text-sm">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <div className="font-semibold text-slate-600">ลงชื่อผู้ประเมิน</div>
            <input type="text" placeholder="( พิมพ์ชื่อ-นามสกุล หรือเว้นว่างเพื่อเซ็น )" className="w-full max-w-[85%] bg-transparent border-b border-slate-300 pb-1 text-slate-700 placeholder-slate-400 font-light focus:outline-none focus:border-blue-500 text-sm" />
            <div className="space-y-1">
              <label className="block text-xs text-slate-500 font-medium">วันที่</label>
              <input type="date" className="w-full max-w-[85%] bg-transparent border-b border-slate-300 py-1 text-slate-700 focus:outline-none focus:border-blue-500 text-sm" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="font-semibold text-slate-600">พนักงานรับทราบ</div>
            <input type="text" placeholder="( พิมพ์ชื่อ-นามสกุล หรือเว้นว่างเพื่อเซ็น )" className="w-full max-w-[85%] bg-transparent border-b border-slate-300 pb-1 text-slate-700 placeholder-slate-400 font-light focus:outline-none focus:border-blue-500 text-sm" />
            <div className="space-y-1">
              <label className="block text-xs text-slate-500 font-medium">วันที่</label>
              <input type="date" className="w-full max-w-[85%] bg-transparent border-b border-slate-300 py-1 text-slate-700 focus:outline-none focus:border-blue-500 text-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] border border-blue-100 overflow-hidden text-xs shadow-sm">
        <div className="bg-blue-600 text-white font-semibold px-5 py-2.5">
          หลักเกณฑ์ในการคิดคะแนนสำหรับข้อมูลระเบียบวินัย
        </div>
        <div className="bg-blue-50 p-5 text-slate-700 space-y-3 leading-relaxed">
          <p className="font-semibold text-blue-900 text-[13px]">
            คะแนนเต็มในการทำงานมี 100 คะแนน พนักงานจะถูกหักคะแนนตามบทลงโทษที่ได้รับตามรายละเอียด ดังนี้
          </p>
          
          <div className="grid gap-4 md:grid-cols-2 border-t border-blue-200/60 pt-3">
            {/* ฝั่งเกณฑ์เรื่องสาย */}
            <div className="space-y-1 bg-white/60 p-3 rounded-[8px] border border-blue-100">
              <span className="font-bold text-blue-800 block mb-1">1. การประเมินข้อมูลสาย ดังนี้</span>
              <div>• สาย 31 - 60 นาที ได้รับบทลงโทษ ว.91</div>
              <div>• สาย 61 - 90 นาที ได้รับบทลงโทษ ว.92</div>
              <div>• สาย 91 - 100 นาที ได้รับบทลงโทษ ว.93</div>
              <div>• สาย 101 นาทีขึ้นไป ได้รับบทลงโทษ Warning 1</div>
            </div>

            {/* ฝั่งเกณฑ์คะแนนที่หัก */}
            <div className="space-y-1 bg-white/60 p-3 rounded-[8px] border border-blue-100">
              <span className="font-bold text-blue-800 block mb-1">การลงโทษ / Discipline มีเงื่อนไขในการหักคะแนนดังนี้</span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div>• ว.91 : หัก ครั้งละ 5 คะแนน</div>
                <div>• Warning 1 : หัก ฉบับละ 25 คะแนน</div>
                <div>• ว.92 : หัก ครั้งละ 10 คะแนน</div>
                <div>• Warning 2 : หัก ฉบับละ 50 คะแนน</div>
                <div>• ว.93 : หัก ครั้งละ 15 คะแนน</div>
                <div>• Last Warning : หัก ฉบับละ 100 คะแนน</div>
                <div>• ว.94 : หัก ครั้งละ 100 คะแนน</div>
                <div>• ลาป่วย / ลากิจ : หัก วันละ 1 คะแนน</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
