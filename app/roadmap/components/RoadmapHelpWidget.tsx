'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, X, User, Send } from 'lucide-react';

type HelpItem = {
  title: string;
  answer: string;
  keywords: string[];
};

type Message = {
  role: 'user' | 'assistant';
  text: string;
};

const helpItems: HelpItem[] = [
  {
    title: 'จะดูรายงานการประเมินได้ยังไง?',
    answer:
      'ไปที่ Roadmap > Reports แล้วเลือกประเภทรายงานที่ต้องการ เช่น Evaluation Report หรือ KPI Report',
    keywords: ['รายงาน', 'report', 'evaluation', 'kpi', 'ดูรายงาน'],
  },
  {
    title: 'จะดูข้อมูลพนักงานทั้งหมดได้ยังไง?',
    answer:
      'ไปที่ Roadmap > Employee หรือ Executive แล้วเลือกดูข้อมูลพนักงานตามแผนกหรือสถานะ',
    keywords: ['พนักงาน', 'employee', 'ดูพนักงาน', 'executive'],
  },
  {
    title: 'จะตั้งค่าผู้ใช้งานอย่างไร?',
    answer:
      'ไปที่ Roadmap > Settings เพื่อปรับการเข้าถึงและแก้ไขข้อมูลพื้นฐานของระบบ',
    keywords: ['ตั้งค่า', 'settings', 'สิทธิ์', 'permission'],
  },
  {
    title: 'สามารถถามได้ไหม',
    answer:
      'คุณสามารถถามข้อมูลที่เกี่ยวกับระบบ Roadmap ได้เลย',
    keywords: ['ถาม', 'ได้ไหม', 'สามารถ', 'อยากถาม'],
  },
  {
    title: 'Send Account',
    answer:
      'เมนู Send Account จะต้องมีการกรอกรหัสยืนยันให้ถูกต้องก่อน จึงจะเข้าใช้งานเมนูนี้ และสามารถเห็นข้อมูลภายในเมนูนี้ได้',
    keywords: ['เมนู Send Account', 'บัญชี', 'ส่งบัญชียังไง', 'เมนูบัญชี'],
  },
];

function findAnswer(question: string) {
  const normalized = question.trim().toLowerCase();
  if (!normalized) return null;

  const directMatch = helpItems.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword))
  );

  return directMatch
    ? directMatch.answer
    : 'ยังไม่เจอคำตอบในขณะนี้ ลองพิมพ์คำถามอื่นหรือเลือกหัวข้อด้านล่าง';
}

export default function RoadmapHelpWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'สวัสดีครับ! ถามคำถามเกี่ยวกับการใช้งาน Roadmap ได้เลย',
    },
  ]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const recentTopics = useMemo(() => helpItems.slice(0, 3), []);

  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = query.trim();
    if (!text) return;

    const userMessage: Message = { role: 'user', text };
    setMessages((current) => [...current, userMessage]);
    setQuery('');
    setIsTyping(true);

    setTimeout(() => {
        const assistantMessage: Message = {
        role: 'assistant',
        text: findAnswer(text),
      };
      setMessages((current) => [...current, assistantMessage]);
      setIsTyping(false);
    }, 2200);
  };

  const handleTopicClick = (item: HelpItem) => {
    const userMessage: Message = { role: 'user', text: item.title };
    setMessages((current) => [...current, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        role: 'assistant',
        text: item.answer,
      };
      setMessages((current) => [...current, assistantMessage]);
      setIsTyping(false);
    }, 2200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-[360px] rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-900">ช่วยเหลือ Roadmap</p>
              <p className="text-xs text-slate-500">ถามคำถามเกี่ยวกับการใช้งานได้เลย</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3 p-4">
            <div
              ref={containerRef}
              className="space-y-3 overflow-y-auto rounded-3xl bg-slate-50 p-3 text-sm text-slate-800 shadow-inner"
              style={{ maxHeight: '320px' }}
            >
              {messages.map((message, index) => (
                <div
                    key={index}
                    className={`flex items-end gap-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                    {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                        <MessageSquare className="h-4 w-4" />
                    </div>
                    )}

                    <div
                    className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm ${
                        message.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-900 border border-slate-200'
                    }`}
                    >
                    {message.text}
                    </div>

                    {message.role === 'user' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <User className="h-4 w-4" />
                    </div>
                    )}
                </div>
                ))}

                {isTyping && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                      <MessageSquare className="h-4 w-4"/>
                    </div>
                    <div className="rounded-3xl bg-white px-4 py-3 text-sm text-slate-900 border border-slate-200">
                      <div className="flex items-center gap-1">
                        <span className="typing-dot h-2.5 w-2.5 rounded-full bg-slate-500" />
                        <span className="typing-dot h-2.5 w-2.5 rounded-full bg-slate-500" />
                        <span className="typing-dot h-2.5 w-2.5 rounded-full bg-slate-500" />
                      </div>
                    </div>
                  </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-xs font-medium text-slate-700">พิมพ์คำถามของคุณ</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="เช่น ดูรายงานยังไง"
                className="text-black w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                <div className="flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" />
                    ส่งคำถาม
                </div>
             </button>
            </form>

            <div className="rounded-3xl bg-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                หัวข้อแนะนำ
              </p>
              <div className="mt-3 space-y-2">
                {recentTopics.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => handleTopicClick(item)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
            onClick={() => setOpen(true)}
            className="cursor-pointer flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl hover:bg-emerald-700"
            >
            <MessageSquare className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}