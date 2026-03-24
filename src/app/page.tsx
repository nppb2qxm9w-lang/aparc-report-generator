"use client";

import { useState } from "react";

export default function Home() {
  const [items, setItems] = useState([
    {
      id: 1,
      location: "",
      description: "",
      notes: "",
    },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: items.length + 1,
        location: "",
        description: "",
        notes: "",
      },
    ]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[index][field] = value;
    setItems(newItems);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      {/* LETTERHEAD */}
      <div className="mb-6 rounded-xl bg-blue-900 p-4 text-white shadow">
        <h1 className="text-lg font-bold">
          Australian Plumbing & Roofing Consultants
        </h1>
        <p className="text-sm">
          Roofing & Plumbing Inspection Report System
        </p>
        <p className="text-sm">QBCC Licence 715699</p>
        <p className="text-sm">admin@auparc.com.au</p>
        <p className="text-sm">auparc.com.au</p>
      </div>

      {/* TITLE */}
      <div className="mb-6">
        <h2 className="text-xl font-bold">APaRC Report Generator</h2>
        <p className="text-sm text-gray-600">
          Complaint-based field inspection workflow with photos and export
          options
        </p>
      </div>

      {/* JOB DETAILS */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow">
        <h3 className="mb-3 font-bold">Job Details</h3>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            className="rounded border p-2"
            placeholder="Property address"
          />
          <input className="rounded border p-2" placeholder="Client name" />
          <input className="rounded border p-2" type="date" />
        </div>
      </div>

      {/* ITEMS */}
      {items.map((item, index) => (
        <div
          key={item.id}
          className="mb-6 rounded-xl bg-white p-4 shadow"
        >
          <h3 className="mb-3 font-bold">
            Complaint Item {index + 1}
          </h3>

          <input
            className="mb-2 w-full rounded border p-2"
            placeholder="Item location"
            value={item.location}
            onChange={(e) =>
              updateItem(index, "location", e.target.value)
            }
          />

          <textarea
            className="mb-2 w-full rounded border p-2"
            placeholder="Item description"
            value={item.description}
            onChange={(e) =>
              updateItem(index, "description", e.target.value)
            }
          />

          <textarea
            className="mb-2 w-full rounded border p-2"
            placeholder="Site notes"
            value={item.notes}
            onChange={(e) =>
              updateItem(index, "notes", e.target.value)
            }
          />

          {/* PHOTO BUTTON */}
          <input type="file" multiple className="mb-2" />

        </div>
      ))}

      {/* ADD ITEM BUTTON */}
      <button
        onClick={addItem}
        className="w-full rounded-xl bg-black p-3 text-white"
      >
        Add Complaint Item
      </button>
    </main>
  );
}