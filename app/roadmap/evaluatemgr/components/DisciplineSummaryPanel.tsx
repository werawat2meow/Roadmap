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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm text-slate-600 pl-4">
            <div>เดือนที่ 1: - ครั้ง รวม - นาที</div>
            <div>เดือนที่ 2: - ครั้ง รวม - นาที</div>
            <div>เดือนที่ 3: - ครั้ง รวม - นาที</div>
            <div>ช่วงต่อโปร เดือนที่ 1: - ครั้ง รวม - นาที</div>
            <div className="md:col-span-2">ช่วงต่อโปร เดือนที่ 2: - ครั้ง รวม - นาที</div>
          </div>
        </div>
      </div>

      {/* ส่วนที่ 2: การ์ดตารางการลงโทษ / Discipline */}
      <div className="overflow-hidden rounded-[16px] border border-blue-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr className="bg-blue-600 text-white font-medium">
              <th className="px-5 py-2.5 text-left w-[50%]">การลงโทษ / Discipline</th>
              <th className="px-5 py-2.5 w-[16%]">จำนวนครั้ง</th>
              <th className="px-5 py-2.5 w-[16%]">หักคะแนน</th>
              <th className="px-5 py-2.5 text-right w-[18%] pr-6">คะแนนที่หัก</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50 bg-white text-slate-700 [&>tr:nth-child(even)]:bg-[#eef4ff]">
            {[
              ['ว.91 : - ครั้ง หัวข้อ : -', '-', '-5'],
              ['ว.92 : - ครั้ง หัวข้อ : -', '-', '-10'],
              ['ว.93 : - ครั้ง หัวข้อ : -', '-', '-15'],
              ['ว.94 : - ครั้ง หัวข้อ : -', '-', '-100'],
              ['Warning 1 : 1 ฉบับ หัวข้อ : -', '-', '-25'],
              ['Warning 2 : - ฉบับ หัวข้อ : -', '-', '-50'],
              ['Last Warning : 1 ฉบับ หัวข้อ : -', '-', '-100'],
              ['ลาป่วย : -วัน / ลากิจ : - วัน', '-', '-1'],
            ].map(([title, count, score], index) => (
              <tr key={index}>
                <td className="px-5 py-2.5 text-left font-light text-slate-600">{title}</td>
                <td className="px-5 py-2.5">{count}</td>
                <td className="px-5 py-2.5 font-medium text-rose-500">{score}</td>
                <td className="px-5 py-2.5 text-right pr-6 font-semibold">0</td>
              </tr>
            ))}
            <tr className="bg-blue-50 font-semibold text-blue-900 border-t border-blue-200">
              <td colSpan={3} className="px-5 py-3 text-center">รวมคะแนนระเบียบวินัย</td>
              <td className="px-5 py-3 text-right pr-6 font-bold text-blue-700">0</td>
            </tr>
          </tbody>
        </table>
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
