'use client';

import { useMemo, useState, useEffect } from 'react';
import SettingsHeader from './components/SettingsHeader';
import SettingsTabs from './components/SettingsTabs';
import CategoryCard from './components/CategoryCard';
import AddCategoryModal from './components/AddCategoryModal';
import AccessPermissionsPanel from './components/AccessPermissionsPanel';
import { swalConfirm, swalError, swalSuccess } from '../../components/Swal';

type Item = {
  id: string;
  topic: string;
  weight: number;
  saved?: boolean;
};

type Category = {
  id: string;
  title: string;
  type: string;
  level: string;
  items: Item[];
  department_id?: string;
  division_id?: string;
  unit_id?: string;
};

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

const tabTypeMap: Record<string, string> = {
  Company: 'Company Common Ground',
  Department: 'Department Common Ground',
  Expectations: 'Expectations',
};

type User = {
  id: string;
  accessId?: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Executive' | 'ยังไม่กำหนด';
  menus: string[];
};

export default function SettingsPage() {
  const [tab, setTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'ทั้งหมด';
    return localStorage.getItem('roadmapSettingsTab') || 'ทั้งหมด';
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);


  const visibleCategories = useMemo(() => {
    if (tab === 'ทั้งหมด') return categories;
    const expectedType = tabTypeMap[tab] ?? tab;
    return categories.filter((cat) => cat.type === expectedType);
  }, [tab, categories]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/roadmap/api/settings');
        const json = await res.json();
        if (res.ok && json.success) {
          setCategories(json.data);
        } else {
          console.error('Load categories failed', json.error);
        }
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('roadmapSettingsTab', tab);
    }
  }, [tab]);

  const handleCreateCategory = async (newCategory: {
      title: string;
      type: string;
      level: string;
      department_id?: string;
      division_id?: string;
      unit_id?: string;
    }) => {
      try {
        const res = await fetch('/roadmap/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCategory),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          setCategories((prev) => [...prev, { ...json.data, items: json.data.items ?? [] }]);
          setModalOpen(false);
        } else {
          console.error('Create category failed', json.error);
        }
      } catch (error) {
        console.error('Failed to create category', error);
      }
    };

    const handleDeleteCategory = async (categoryId: string) => {
      const category = categories.find((item) => item.id === categoryId);

      if (!category) {
        swalError('ไม่พบหัวข้อที่จะลบ');
        return;
      }

      if (category.items?.length > 0) {
        swalError(
          'ไม่สามารถลบได้',
          'หัวข้อนี้มีข้อมูลตัวชี้วัดอยู่ ต้องลบรายละเอียดภายในก่อน'
        );
        return;
      }

      const confirmed = await swalConfirm(
        'ยืนยันการลบ',
        'คุณแน่ใจว่าจะลบหัวข้อนี้? การลบจะไม่สามารถกู้คืนได้'
      );

      if (!confirmed.isConfirmed) {
        return;
      }

      try {
        const res = await fetch(`/roadmap/api/settings/${categoryId}`, {
          method: 'DELETE',
        });

        const json = await res.json().catch(() => null);

        if (res.ok && json?.success) {
          setCategories((prev) => prev.filter((item) => item.id !== categoryId));
          swalSuccess('ลบสำเร็จ');
        } else {
          swalError(
            'ลบไม่สำเร็จ',
            json?.error || `เกิดข้อผิดพลาด (${res.status})`
          );
        }
      } catch (error) {
        swalError('ลบไม่สำเร็จ', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        console.error('Failed to delete category', error);
      }
    };

  const handleAddItem = async (categoryId: string) => {
    try {
      const res = await fetch('/roadmap/api/settings/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCategories((prev) =>
          prev.map((category) =>
            category.id === categoryId
              ? { ...category, items: [...category.items, { ...json.data, saved: true }] }
              : category
          )
        );
      } else {
        console.error('Create item failed', json.error);
      }
    } catch (error) {
      console.error('Failed to add item', error);
    }
  };

  const handleChangeItem = async (
    categoryId: string,
    itemId: string,
    field: 'topic' | 'weight',
    value: string | number
  ) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.map((item) =>
                item.id === itemId ? { ...item, [field]: value, saved: false } : item
              ),
            }
          : category
      )
    );

    try {
      const payload: Record<string, string | number> = { id: itemId };
      if (field === 'topic') {
        payload.topic = String(value);
      }
      if (field === 'weight') {
        payload.weight = Number(value);
      }

      await fetch('/roadmap/api/settings/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to update item', error);
    }
  };

  const handleRemoveItem = async (categoryId: string, itemId: string) => {
    try {
      const res = await fetch(`/roadmap/api/settings/items?id=${itemId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCategories((prev) =>
          prev.map((category) =>
            category.id === categoryId
              ? { ...category, items: category.items.filter((item) => item.id !== itemId) }
              : category
          )
        );
      } else {
        console.error('Delete item failed', json.error);
      }
    } catch (error) {
      console.error('Failed to remove item', error);
    }
  };

  const handleUpdateCategory = async (
    categoryId: string,
    title: string,
    level: string,
    department_id?: string,
    division_id?: string,
    unit_id?: string
  ) => {
  try {
    const payload: Record<string, string | undefined> = {
      title,
      level,
    };

    if (department_id) payload.department_id = department_id;
    if (division_id) payload.division_id = division_id;
    if (unit_id) payload.unit_id = unit_id;

    const res = await fetch(`/roadmap/api/settings/${categoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      setCategories((prev) =>
        prev.map((category) =>
          category.id === categoryId ? { ...category, title, level, department_id, division_id, unit_id } : category
        )
      );
    } else {
      console.error('Update category failed', json.error);
    }
  } catch (error) {
    console.error('Failed to update category', error);
  }
};

const selectedUser = useMemo(() => {
  return users.find((user) => user.id === selectedUserId) ?? users[0] ?? null;
}, [users, selectedUserId]);

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
        return updatedUser;
      }

      const nextUser: User = {
        ...updatedUser,
        accessId: json.data?.id ?? updatedUser.accessId,
      };

      setUsers((prev) =>
        prev.map((user) => (user.id === nextUser.id ? nextUser : user))
      );

      setSelectedUserId(nextUser.id); // <--- เพิ่ม

      return nextUser;
    } catch (error) {
      console.error('Failed to save user access', error);
      return updatedUser;
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
              .filter((user: User) => user.menus.length > 0) // แสดงเฉพาะพนักงานที่มี access เมนู
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
            selectedUser={
              selectedUser ?? {
                id: '',
                name: '',
                email: '',
                role: 'ยังไม่กำหนด',
                menus: [],
              }
            }
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
                  onUpdate={handleUpdateCategory}
                  onDelete={() => handleDeleteCategory(category.id)}
                  onAddItem={handleAddItem}
                  onChangeItem={handleChangeItem}
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </div>

            <AddCategoryModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              onCreate={handleCreateCategory}
            />
          </>
        )}
      </div>
    </div>
  );
}