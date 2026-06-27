'use client';

import { useMemo, useState, useEffect } from 'react';
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
  'Evaluate HR',
  'Evaluate MGR',
  'Reports',
  'Executive',
  'Send Account',
  'Settings',
];

type User = {
  id: string;
  accessId?: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Executive' | 'ยังไม่กำหนด';
  menus: string[];
};

export default function SettingsPage() {
  const [tab, setTab] = useState('ทั้งหมด');
  const [categories, setCategories] = useState(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const visibleCategories = useMemo(
    () =>
      tab === 'ทั้งหมด'
        ? categories
        : categories.filter((cat) => cat.type === tab),
    [tab, categories]
  );

  const selectedUser =
    users.find((user) => user.id === selectedUserId) ??
    users[0] ??
    { id: '', name: '', email: '', role: 'ยังไม่กำหนด', menus: [] };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const hasValidAccessId =
      typeof updatedUser.accessId === 'string' &&
      updatedUser.accessId.length > 0 &&
      updatedUser.accessId !== 'undefined';

    const url = hasValidAccessId
      ? `/roadmap/api/user-access/${updatedUser.accessId}`
      : '/roadmap/api/user-access';
    const method = hasValidAccessId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: updatedUser.id,
          role: updatedUser.role,
          menus: updatedUser.menus,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        console.error('Save failed', json.error || `Status ${res.status}`);
        return;
      }

      const nextUser: User = {
        ...updatedUser,
        accessId: json.data?.id ?? updatedUser.accessId,
      };

      setUsers((prev) =>
        prev.map((user) => (user.id === nextUser.id ? nextUser : user))
      );
    } catch (error) {
      console.error('Failed to save user access', error);
    }
  };

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);

      try {
        const [employeesRes, accessRes] = await Promise.all([
          fetch('/roadmap/api/employees'),
          fetch('/roadmap/api/user-access'),
        ]);

        const employeesJson = await employeesRes.json();
        const accessJson = await accessRes.json();

        const accessMap = new Map<string, any>();

        if (accessJson.success && Array.isArray(accessJson.data)) {
          for (const item of accessJson.data) {
            if (item.employee_id) {
              accessMap.set(item.employee_id, item);
            }
          }
        }

        const mappedUsers =
          employeesJson.success && Array.isArray(employeesJson.data)
            ? employeesJson.data.map((item: any) => {
                const access = accessMap.get(item.id);

                return {
                  id: item.id,
                  accessId: access?.id,
                  name: item.name,
                  email: item.email ?? '',
                  role: access?.role ?? 'ยังไม่กำหนด',
                  menus: access?.menus ?? [],
                } as User;
              })
            : [];

        setUsers(mappedUsers);
        if (mappedUsers.length > 0) {
          setSelectedUserId(mappedUsers[0].id);
        }
      } catch (error) {
        console.error('Failed to load users', error);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

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