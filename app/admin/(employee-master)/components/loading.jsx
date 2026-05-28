"use client";
import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const Loading = ({ tip = "กำลังโหลดข้อมูล..." }) => {
  // สร้าง icon custom จาก Ant Design Icons
  const antIcon = (
    <LoadingOutlined 
      className="text-blue-500" // ใช้ Tailwind กำหนดสี
      style={{ fontSize: 48 }} 
      spin 
    />
  );

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white shadow-xl border border-gray-100">
        <Spin indicator={antIcon} />
        {tip && (
          <span className="text-gray-600 font-medium animate-pulse">
            {tip}
          </span>
        )}
      </div>
    </div>
  );
};

export default Loading;
