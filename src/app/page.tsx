"use client";

import { useMemo, useRef, useState } from "react";

type PhotoItem = {
  id: string;
  name: string;
  dataUrl: string;
};

type Item = {
  title: string;
  concernArea: string;
  notes: string;
  areaAbove: string;
  likelyCause: string;
  testingMethod: string;
  testingResult: string;
  conclusionNotes: string;
  photos: PhotoItem[];
};

type JobData = {
  propertyAddress: string;
  clientName: string;
  inspectionDate: string;
  items: Item[];
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function cleanSentence(text: string) {
  return text.replace(/\s+/g, " ").replace(/\.\s*\./g, ".").trim();
}

function ensureFullStop(text: string) {
  const t = cleanSentence(text);
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

function splitNotes(raw: string) {
  return raw
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildObservation(notes: string) {
  const parts = splitNotes(notes);

  if (parts.length === 0) {
    return "I observed no site notes had been entered at the time of drafting.";
  }

  if (parts.length === 1) {
    return `I observed ${ensureFullStop(parts[0]).replace(/^[A-Z]/, (m) => m.toLowerCase())}`;
  }

  const joined = parts
    .map((p, i) => {
      const sentence = ensureFullStop(p);
      if (i === 0) return sentence.charAt(0).toLowerCase() + sentence.slice(1);
      return sentence;
    })
    .join(" ");

  return `I observed ${joined}`;
}

function buildAlignment(areaAbove: string, notes: string) {
  const area = cleanSentence(areaAbove);
  const parts = splitNotes(notes);

  if (area) {
    return `A visual inspection of the area above noted that the reported issue aligned with ${ensureFullStop(area).replace(/\.$/, "")}.`;
  }

  if (parts.length > 0) {
    return "A visual inspection of the area above noted that this aligned with the reported issue.";
  }

  return "A visual inspection of the area above was carried out as far as accessible at the time of inspection.";
}

function buildMechanism(likelyCause: string) {
  const cause = cleanSentence(likelyCause);

  if (!cause) {
    return "It would appear that moisture entry is occurring due to the site conditions observed at the time of inspection.";
  }

  return `It would appear that ${ensureFullStop(cause).replace(/^[A-Z]/, (m) => m.toLowerCase())}`;
}

function buildTesting(testingMethod: string, testingResult: string) {
  const method = cleanSentence(testingMethod);
  const result = cleanSentence(testingResult);

  const testingSentence = method
    ? `Water testing was carried out ${ensureFullStop(method).replace(/^[A-Z]/, (m) => m.toLowerCase())}`
    : "Water testing was carried out in a controlled manner simulating wind driven rain.";

  const resultSentence = result
    ? `Water ingress was noted ${ensureFullStop(result).replace(/^[A-Z]/, (m) => m.toLowerCase())}`
    : "Water ingress was noted during testing.";

  return { testingSentence, resultSentence };
}

function buildConclusion(conclusionNotes: string) {
  const conc = cleanSentence(conclusionNotes);

  if (!conc) {
    return "Based on the above, the observed conditions are consistent with the reported issue and further consideration should be given to the relevant construction details and site conditions.";
  }

  return `Based on the above, ${ensureFullStop(conc).replace(/^[A-Z]/, (m) => m.toLowerCase())}`;
}

function blankItem(): Item {
  return {
    title: "",
    concernArea: "",
    notes: "",
    areaAbove: "",
    likelyCause: "",
    testingMethod: "",
    testingResult: "",
    conclusionNotes: "",
    photos: [],
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export default function Home() {
  const [propertyAddress, setPropertyAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [items, setItems] = useState<Item[]>([blankItem()]);
  const [showPreview, setShowPreview] = useState(false);
  const importRef = useRef<HTMLInputElement | null>(null);

  const addItem = () => {
    setItems((prev) => [...prev, blankItem()]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const updateItem = (index: number, field: keyof Item, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addPhotos = async (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPhotos: PhotoItem[] = [];
    for (const file of Array.from(files)) {
      const dataUrl = await fileToDataUrl(file);
      newPhotos.push({
        id: uid(),
        name: file.name,
        dataUrl,
      });
    }

    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        photos: [...next[index].photos, ...newPhotos],
      };
      return next;
    });
  };

  const removePhoto = (itemIndex: number, photoId: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[itemIndex] = {
        ...next[itemIndex],
        photos: next[itemIndex].photos.filter((p) => p.id !== photoId),
      };
      return next;
    });
  };

  const builtItems = useMemo(() => {
    return items.map((item, index) => {
      const concern = cleanSentence(item.concernArea);
      const concernSentence = concern
        ? `The owner directed us to the area of concern at ${ensureFullStop(concern).replace(/^[A-Z]/, (m) => m.toLowerCase())}`
        : "The owner directed us to the area of concern.";

      const observation = buildObservation(item.notes);
      const alignment = buildAlignment(item.areaAbove, item.notes);
      const mechanism = buildMechanism(item.likelyCause);
      const { testingSentence, resultSentence } = buildTesting(
        item.testingMethod,
        item.testingResult
      );
      const conclusion = buildConclusion(item.conclusionNotes);

      return {
        index,
        title: item.title,
        concernSentence,
        observation,
        alignment,
        mechanism,
        testingSentence,
        resultSentence,
        conclusion,
        photos: item.photos,
      };
    });
  }, [items]);

  const generatedReport = useMemo(() => {
    const header = [
      propertyAddress ? `PROPERTY: ${propertyAddress}` : "PROPERTY:",
      clientName ? `CLIENT: ${clientName}` : "CLIENT:",
      inspectionDate ? `DATE: ${inspectionDate}` : "DATE:",
      "",
      "---",
      "",
    ].join("\n");

    const body = builtItems
      .map((item) => {
        return [
          `COMPLAINT ITEM ${item.index + 1}${item.title ? ` – ${item.title}` : ""}`,
          "",
          item.concernSentence,
          "",
          item.observation,
          "",
          item.alignment,
          "",
          item.mechanism,
          "",
          item.testingSentence,
          "",
          item.resultSentence,
          "",
          item.conclusion,
          "",
          item.photos.length
            ? `Photos attached: ${item.photos.map((_, i) => `Photo ${i + 1}`).join(", ")}`
            : "",
          item.photos.length ? "" : "",
          "---",
          "",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n");

    return header + body;
  }, [propertyAddress, clientName, inspectionDate, builtItems]);

  const currentJobData = useMemo<JobData>(
    () => ({
      propertyAddress,
      clientName,
      inspectionDate,
      items,
    }),
    [propertyAddress, clientName, inspectionDate, items]
  );

  const saveJobJson = () => {
    const blob = new Blob([JSON.stringify(currentJobData, null, 2)], {
      type: "application/json",
    });
    const fileName = `APaRC-Job-${propertyAddress || "Untitled"}.json`;
    downloadBlob(blob, fileName);
  };

  const importJobJson = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text) as JobData;

    setPropertyAddress(data.propertyAddress || "");
    setClientName(data.clientName || "");
    setInspectionDate(data.inspectionDate || "");
    setItems(
      Array.isArray(data.items) && data.items.length
        ? data.items.map((item) => ({
            ...blankItem(),
            ...item,
            photos: Array.isArray(item.photos) ? item.photos : [],
          }))
        : [blankItem()]
    );
  };

  const exportTxt = () => {
    const blob = new Blob([generatedReport], { type: "text/plain;charset=utf-8" });
    const fileName = `APaRC-Report-${propertyAddress || "Untitled"}.txt`;
    downloadBlob(blob, fileName);
  };

  const buildWordHtml = () => {
    const htmlItems = builtItems
      .map((item) => {
        const photosHtml = item.photos.length
          ? `
            <h3>Photos</h3>
            ${item.photos
              .map(
                (p, i) => `
              <div style="margin-bottom:16px;">
                <div style="font-weight:bold; margin-bottom:6px;">Photo ${i + 1}</div>
                <img src="${p.dataUrl}" style="max-width:100%; height:auto; border:1px solid #ccc;" />
              </div>
            `
              )
              .join("")}
          `
          : "";

        return `
          <h2>COMPLAINT ITEM ${item.index + 1}${item.title ? ` – ${escapeHtml(item.title)}` : ""}</h2>
          <p>${escapeHtml(item.concernSentence)}</p>
          <p>${escapeHtml(item.observation)}</p>
          <p>${escapeHtml(item.alignment)}</p>
          <p>${escapeHtml(item.mechanism)}</p>
          <p>${escapeHtml(item.testingSentence)}</p>
          <p>${escapeHtml(item.resultSentence)}</p>
          <p>${escapeHtml(item.conclusion)}</p>
          ${photosHtml}
          <hr />
        `;
      })
      .join("");

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>APaRC Report</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 24px; line-height: 1.45;">
          <h1>APaRC Report</h1>
          <p><strong>PROPERTY:</strong> ${escapeHtml(propertyAddress)}</p>
          <p><strong>CLIENT:</strong> ${escapeHtml(clientName)}</p>
          <p><strong>DATE:</strong> ${escapeHtml(inspectionDate)}</p>
          <hr />
          ${htmlItems}
        </body>
      </html>
    `;
  };

  const exportWord = () => {
    const html = buildWordHtml();
    const blob = new Blob([html], { type: "application/msword" });
    const fileName = `APaRC-Report-${propertyAddress || "Untitled"}.doc`;
    downloadBlob(blob, fileName);
  };

  const exportPdf = () => {
    const html = buildWordHtml();
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Popup blocked. Please allow popups for this site.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>APaRC Report PDF</title>
        </head>
        <body>
          ${html}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            APaRC Report Generator
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Save jobs to Files/iCloud, export to PDF or Word, and attach multiple photos to each complaint item.
          </p>
        </div>

        <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold">Job Details</h2>
          <div className="grid gap-3">
            <input
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder="Property address"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
            />
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client name"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
            />
            <input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
            />
          </div>
        </section>

        <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold">Save / Load / Export</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={saveJobJson}
              className="rounded-xl bg-zinc-900 px-4 py-3 text-base font-semibold text-white"
            >
              Save Job File
            </button>

            <button
              onClick={() => importRef.current?.click()}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-zinc-900"
            >
              Load Job File
            </button>

            <button
              onClick={exportPdf}
              className="rounded-xl bg-zinc-900 px-4 py-3 text-base font-semibold text-white"
            >
              Export PDF
            </button>

            <button
              onClick={exportWord}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-zinc-900"
            >
              Export Word
            </button>

            <button
              onClick={exportTxt}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-zinc-900 sm:col-span-2"
            >
              Export Text
            </button>
          </div>

          <input
            ref={importRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => importJobJson(e.target.files?.[0] || null)}
          />

          <p className="mt-3 text-sm text-zinc-600">
            On iPhone, use the share/download prompt and choose <strong>Save to Files</strong>, then pick
            <strong> iCloud Drive</strong> or <strong>On My iPhone</strong>.
          </p>
        </section>

        <div className="space-y-4">
          {items.map((item, index) => (
            <section
              key={index}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Complaint Item {index + 1}</h2>
                <button
                  onClick={() => removeItem(index)}
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-3">
                <input
                  value={item.title}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  placeholder="Item title"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <input
                  value={item.concernArea}
                  onChange={(e) => updateItem(index, "concernArea", e.target.value)}
                  placeholder="Area of concern"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <textarea
                  value={item.notes}
                  onChange={(e) => updateItem(index, "notes", e.target.value)}
                  placeholder="Rough site notes. One point per line works best."
                  rows={6}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <input
                  value={item.areaAbove}
                  onChange={(e) => updateItem(index, "areaAbove", e.target.value)}
                  placeholder="Area above / corresponding external area"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <input
                  value={item.likelyCause}
                  onChange={(e) => updateItem(index, "likelyCause", e.target.value)}
                  placeholder="Likely mechanism or cause"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <input
                  value={item.testingMethod}
                  onChange={(e) => updateItem(index, "testingMethod", e.target.value)}
                  placeholder="Testing method"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <input
                  value={item.testingResult}
                  onChange={(e) => updateItem(index, "testingResult", e.target.value)}
                  placeholder="Testing result"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <textarea
                  value={item.conclusionNotes}
                  onChange={(e) => updateItem(index, "conclusionNotes", e.target.value)}
                  placeholder="Conclusion wording to reflect"
                  rows={4}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="mb-2 text-sm font-semibold">Photos for this item</div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => addPhotos(index, e.target.files)}
                    className="block w-full text-sm"
                  />

                  {item.photos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {item.photos.map((photo) => (
                        <div key={photo.id} className="rounded-xl border border-zinc-200 bg-white p-2">
                          <img
                            src={photo.dataUrl}
                            alt={photo.name}
                            className="h-28 w-full rounded-lg object-cover"
                          />
                          <div className="mt-2 truncate text-xs text-zinc-600">{photo.name}</div>
                          <button
                            onClick={() => removePhoto(index, photo.id)}
                            className="mt-2 w-full rounded-lg border border-zinc-300 px-2 py-2 text-xs font-semibold"
                          >
                            Remove Photo
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={addItem}
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-base font-semibold text-white sm:w-auto"
          >
            Add Complaint Item
          </button>

          <button
            onClick={() => setShowPreview((v) => !v)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-zinc-900 sm:w-auto"
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
        </div>

        {showPreview && (
          <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold">Generated Report</h2>
            <pre className="whitespace-pre-wrap break-words rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-800">
              {generatedReport}
            </pre>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl gap-3">
          <button
            onClick={() => setShowPreview(false)}
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-zinc-900"
          >
            Edit
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-base font-semibold text-white"
          >
            Preview
          </button>
        </div>
      </div>
    </main>
  );
}
