'use client';

import { useMemo, useState } from 'react';
import SettingsHeader from './components/SettingsHeader';
import SettingsTabs from './components/SettingsTabs';
import CategoryCard from './components/CategoryCard';
import AddCategoryModal from './components/AddCategoryModal';

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

export default function SettingsPage() {
  const [tab, setTab] = useState('ทั้งหมด');
  const [categories, setCategories] = useState(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);

  const visibleCategories = useMemo(
    () =>
      tab === 'ทั้งหมด'
        ? categories
        : categories.filter((cat) => cat.type === tab),
    [tab, categories]
  );

  return (
    <div className="p-6 lg:p-10">
      <SettingsHeader onAdd={() => setModalOpen(true)} />
      <SettingsTabs activeTab={tab} onChange={setTab} />

      <div className="space-y-6 mt-6">
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
              setCategories((prev) =>
                prev.filter((item) => item.id !== category.id)
              )
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
    </div>
  );
}