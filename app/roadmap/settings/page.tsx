'use client';

import { useMemo, useState } from 'react';
import SettingsHeader from './components/SettingsHeader';
import SettingsTabs from './components/SettingsTabs';
import CategoryCard from './components/CategoryCard';
import AddCategoryModal from './components/AddCategoryModal';
import AccessPermissionsPanel from './components/AccessPermissionsPanel';

const initialCategories = [
  {
    id: 'company-common-ground',
    title: 'ทดสอบ',
    type: 'Company Common Ground',
    level: 'P4',
    items: [
      { id: 'item-1', topic: 'ตัวชี้วัด 1', weight: 25, saved: true },
      { id: 'item-new', topic: '', weight: 25, saved: false },
    ],
  },
];

const menuOptions = [
  'Dashboard',
  'Employee',
  'Evaluate',
  'Settings',
  'Reports',
  'Executive',
];

type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Staff' | 'ยังไม่กำหนด';
  menus: string[];
};

const initialUsers: User[] = [
  {
    id: 'user-1',
    name: 'ทดสอบ เว็บไซต์1',
    email: 'todsop@gmail.com',
    role: 'Manager',
    menus: ['Dashboard', 'Employee', 'Evaluate', 'Settings', 'Reports', 'Executive'],
  },
  {
    id: 'user-2',
    name: 'ทดสอบ เว็บไซต์2',
    email: 'todsop2@gmail.com',
    role: 'Staff',
    menus: ['Dashboard', 'Employee'],
  },
  {
    id: 'user-3',
    name: 'ทดสอบ เว็บไซต์3',
    email: 'todsop3@gmail.com',
    role: 'Admin',
    menus: menuOptions,
  },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('ทั้งหมด');
  const [categories, setCategories] = useState(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [users, setUsers] = useState(initialUsers);
  const [selectedUserId, setSelectedUserId] = useState(initialUsers[0].id);

  const visibleCategories = useMemo(
    () =>
      tab === 'ทั้งหมด'
        ? categories
        : categories.filter((cat) => cat.type === tab),
    [tab, categories]
  );

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];

  const handleUpdateUser = (updatedUser: typeof initialUsers[number]) => {
    setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
  };

  return (
    <div className="p-6 lg:p-10">
      <SettingsHeader
        description={
          tab === 'สิทธิ์การเข้าถึง'
            ? 'จัดการสิทธิ์การเข้าถึงของผู้ใช้ในระบบ'
            : 'จัดการหัวข้อและตัวชี้วัดการประเมิน'
        }
        onAdd={tab !== 'สิทธิ์การเข้าถึง' ? () => setModalOpen(true) : undefined}
      />

      <SettingsTabs activeTab={tab} onChange={setTab} />

      <div className="space-y-6 mt-6">
        {tab === 'สิทธิ์การเข้าถึง' ? (
          <AccessPermissionsPanel
            users={users}
            selectedUserId={selectedUserId}
            selectedUser={selectedUser}
            menuOptions={menuOptions}
            onSelectUser={setSelectedUserId}
            onUpdateUser={handleUpdateUser}
          />
        ) : (
          <>
            <div className="space-y-6">
              {visibleCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onUpdate={(updated) =>
                    setCategories((prev) =>
                      prev.map((item) => (item.id === updated.id ? updated : item))
                    )
                  }
                  onDelete={() =>
                    setCategories((prev) => prev.filter((item) => item.id !== category.id))
                  }
                />
              ))}
            </div>

            <AddCategoryModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              onCreate={(newCategory) => {
                setCategories((prev) => [...prev, newCategory]);
                setModalOpen(false);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}