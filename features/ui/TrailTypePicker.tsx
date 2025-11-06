import React from 'react';

const ALL = [
  { key: 'dirt', label: 'Dirt' },
  { key: 'paved', label: 'Paved' },
  { key: 'road', label: 'Road' },
  { key: 'beach', label: 'Beach' },
  { key: 'rock', label: 'Rock' },
  { key: 'off_trail', label: 'Off trail' },
];

export default function TrailTypePicker({
  value, onChange
}: { value: string[]; onChange: (next: string[]) => void }) {
  function toggle(k: string) {
    const has = value.includes(k);
    onChange(has ? value.filter(x => x !== k) : [...value, k]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {ALL.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => toggle(t.key)}
          className={
            'rounded-full border px-3 py-1 text-sm ' +
            (value.includes(t.key) ? 'border-green-600 bg-green-50 text-green-800' : 'hover:bg-gray-50')
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
