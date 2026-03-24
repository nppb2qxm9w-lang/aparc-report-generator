"use client";

import { useMemo, useRef, useState } from "react";

type PhotoItem = {
  id: string;
  name: string;
  dataUrl: string;
  notes: string;
};

type ComplaintItem = {
  itemNumber: string;
  dateNoticed: string;
  location: string;
  description: string;
  complaintSnapshot: PhotoItem | null;
  notes: string;
  areaAbove: string;
  likelyCause: string;
  testingMethod: string;
  testingResult: string;
  conclusionNotes: string;
  inspectionPhotos: PhotoItem[];
};

type JobData = {
  propertyAddress: string;
  clientName: string;
  inspectionDate: string;
  complaintItems: ComplaintItem[];
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

function blankComplaintItem(): ComplaintItem {
  return {
    itemNumber: "",
    dateNoticed: "",
    location: "",
    description: "",
    complaintSnapshot: null,
    notes: "",
    areaAbove: "",
    likelyCause: "",
    testingMethod: "",
    testingResult: "",
    conclusionNotes: "",
    inspectionPhotos: [],
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

function photoNotesHtml(text: string) {
  return `
    <div style="
      border: 1px solid #999;
      min-height: 54px;
      padding: 8px;
      margin-top: 6px;
      font-size: 12px;
      line-height: 1.4;
      background: #fff;
      white-space: pre-wrap;
    ">
      ${escapeHtml(text || "Photo notation:")}
    </div>
  `;
}

export default function Home() {
  const [propertyAddress, setPropertyAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [complaintItems, setComplaintItems] = useState<ComplaintItem[]>([blankComplaintItem()]);
  const [showPreview, setShowPreview] = useState(false);
  const importRef = useRef<HTMLInputElement | null>(null);

  const addComplaintItem = () => {
    setComplaintItems((prev) => [...prev, blankComplaintItem()]);
  };

  const removeComplaintItem = (index: number) => {
    setComplaintItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const updateComplaintItem = (
    index: number,
    field: keyof ComplaintItem,
    value: string | PhotoItem | null | PhotoItem[]
  ) => {
    setComplaintItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value } as ComplaintItem;
      return next;
    });
  };

  const addComplaintSnapshot = async (index: number, file: File | null) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);

    updateComplaintItem(index, "complaintSnapshot", {
      id: uid(),
      name: file.name,
      dataUrl,
      notes: "",
    });
  };

  const updateComplaintSnapshotNotes = (index: number, value: string) => {
    setComplaintItems((prev) => {
      const next = [...prev];
      if (!next[index].complaintSnapshot) return prev;

      next[index] = {
        ...next[index],
        complaintSnapshot: {
          ...next[index].complaintSnapshot!,
          notes: value,
        },
      };
      return next;
    });
  };

  const addInspectionPhotos = async (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPhotos: PhotoItem[] = [];
    for (const file of Array.from(files)) {
      const dataUrl = await fileToDataUrl(file);
      newPhotos.push({
        id: uid(),
        name: file.name,
        dataUrl,
        notes: "",
      });
    }

    setComplaintItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        inspectionPhotos: [...next[index].inspectionPhotos, ...newPhotos],
      };
      return next;
    });
  };

  const updateInspectionPhotoNotes = (
    itemIndex: number,
    photoId: string,
    value: string
  ) => {
    setComplaintItems((prev) => {
      const next = [...prev];
      next[itemIndex] = {
        ...next[itemIndex],
        inspectionPhotos: next[itemIndex].inspectionPhotos.map((photo) =>
          photo.id === photoId ? { ...photo, notes: value } : photo
        ),
      };
      return next;
    });
  };

  const removeInspectionPhoto = (itemIndex: number, photoId: string) => {
    setComplaintItems((prev) => {
      const next = [...prev];
      next[itemIndex] = {
        ...next[itemIndex],
        inspectionPhotos: next[itemIndex].inspectionPhotos.filter((p) => p.id !== photoId),
      };
      return next;
    });
  };

  const builtItems = useMemo(() => {
    return complaintItems.map((item, index) => {
      const itemLabel = item.itemNumber ? item.itemNumber : `${index + 1}`;
      const location = cleanSentence(item.location);
      const description = cleanSentence(item.description);

      const concernSentence =
        location || description
          ? `The owner directed us to the area of concern at ${location || "the reported location"}${description ? ` where ${ensureFullStop(description).replace(/^[A-Z]/, (m) => m.toLowerCase())}` : "."}`
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
        itemLabel,
        dateNoticed: item.dateNoticed,
        location: item.location,
        description: item.description,
        complaintSnapshot: item.complaintSnapshot,
        concernSentence,
        observation,
        alignment,
        mechanism,
        testingSentence,
        resultSentence,
        conclusion,
        inspectionPhotos: item.inspectionPhotos,
      };
    });
  }, [complaintItems]);

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
      .map((item) =>
        [
          `COMPLAINT ITEM ${item.itemLabel}`,
          item.dateNoticed ? `Date noticed: ${item.dateNoticed}` : "",
          item.location ? `Location: ${item.location}` : "",
          item.description ? `Complaint description: ${item.description}` : "",
          "",
          item.complaintSnapshot ? "[Complaint snapshot inserted below this item heading]" : "",
          item.complaintSnapshot ? "" : "",
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
          item.inspectionPhotos.length ? "Photos below show the area of concern." : "",
          item.inspectionPhotos.length
            ? item.inspectionPhotos.map((_, i) => `Inspection Photo ${i + 1}`).join(", ")
            : "",
          "",
          "---",
          "",
        ]
          .filter(Boolean)
          .join("\n")
      )
      .join("\n");

    return header + body;
  }, [propertyAddress, clientName, inspectionDate, builtItems]);

  const currentJobData = useMemo<JobData>(
    () => ({
      propertyAddress,
      clientName,
      inspectionDate,
      complaintItems,
    }),
    [propertyAddress, clientName, inspectionDate, complaintItems]
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
    setComplaintItems(
      Array.isArray(data.complaintItems) && data.complaintItems.length
        ? data.complaintItems.map((item) => ({
            ...blankComplaintItem(),
            ...item,
            complaintSnapshot: item.complaintSnapshot || null,
            inspectionPhotos: Array.isArray(item.inspectionPhotos) ? item.inspectionPhotos : [],
          }))
        : [blankComplaintItem()]
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
        const snapshotHtml = item.complaintSnapshot
          ? `
            <div style="margin:12px 0 18px 0;">
              <div style="font-weight:bold; margin-bottom:6px;">Complaint Snapshot</div>
              <img
                src="${item.complaintSnapshot.dataUrl}"
                style="
                  display:block;
                  width:100%;
                  max-width:100%;
                  height:auto;
                  max-height:260px;
                  object-fit:contain;
                  border:1px solid #ccc;
                "
              />
              ${photoNotesHtml(item.complaintSnapshot.notes)}
            </div>
          `
          : "";

        const photosHtml = item.inspectionPhotos.length
          ? `
            <p><strong>Photos below show the area of concern.</strong></p>
            <div style="
              display:grid;
              grid-template-columns: 1fr 1fr;
              gap:16px;
              align-items:start;
              margin-top:10px;
            ">
              ${item.inspectionPhotos
                .map(
                  (p, i) => `
                    <div style="break-inside:avoid;">
                      <div style="font-weight:bold; margin-bottom:6px;">Inspection Photo ${i + 1}</div>
                      <img
                        src="${p.dataUrl}"
                        style="
                          display:block;
                          width:100%;
                          height:180px;
                          object-fit:cover;
                          border:1px solid #ccc;
                        "
                      />
                      ${photoNotesHtml(p.notes)}
                    </div>
                  `
                )
                .join("")}
            </div>
          `
          : "";

        return `
          <div style="margin-bottom:24px;">
            <h2>COMPLAINT ITEM ${escapeHtml(item.itemLabel)}</h2>
            ${item.dateNoticed ? `<p><strong>Date noticed:</strong> ${escapeHtml(item.dateNoticed)}</p>` : ""}
            ${item.location ? `<p><strong>Location:</strong> ${escapeHtml(item.location)}</p>` : ""}
            ${item.description ? `<p><strong>Complaint description:</strong> ${escapeHtml(item.description)}</p>` : ""}
            ${snapshotHtml}
            <p>${escapeHtml(item.concernSentence)}</p>
            <p>${escapeHtml(item.observation)}</p>
            <p>${escapeHtml(item.alignment)}</p>
            <p>${escapeHtml(item.mechanism)}</p>
            <p>${escapeHtml(item.testingSentence)}</p>
            <p>${escapeHtml(item.resultSentence)}</p>
            <p>${escapeHtml(item.conclusion)}</p>
            ${photosHtml}
            <hr />
          </div>
        `;
      })
      .join("");

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>APaRC Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              line-height: 1.45;
              color: #171717;
            }
            * {
              box-sizing: border-box;
            }
            @media print {
              body {
                padding: 18mm 14mm;
              }
            }
          </style>
        </head>
        <body>
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
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6 sm:pt-6">

        <div className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
          <div className="bg-blue-900 px-4 py-5 text-white sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Australian Plumbing & Roofing Consultants
                </div>
                <div className="mt-1 text-sm font-medium text-blue-100 sm:text-base">
                  Roofing & Plumbing Inspection Report System
                </div>
              </div>

              <div className="text-sm text-blue-100 sm:text-right">
                <div>QBCC Licence 715699</div>
                <div>admin@auparc.com.au</div>
                <div>auparc.com.au</div>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-800 bg-blue-50 px-4 py-3 sm:px-6">
            <div className="text-sm font-semibold uppercase tracking-wide text-blue-900">
              APaRC Report Generator
            </div>
            <div className="mt-1 text-sm text-zinc-700">
              Manual complaint item numbering, complaint snapshots at the top of each item, and inspection photos below each item.
            </div>
          </div>
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
        </section>

        <div className="space-y-4">
          {complaintItems.map((item, index) => (
            <section
              key={index}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">
                  Complaint Item {item.itemNumber || index + 1}
                </h2>
                <button
                  onClick={() => removeComplaintItem(index)}
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-3">
                <input
                  value={item.itemNumber}
                  onChange={(e) => updateComplaintItem(index, "itemNumber", e.target.value)}
                  placeholder="Manual item number"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <input
                  type="date"
                  value={item.dateNoticed}
                  onChange={(e) => updateComplaintItem(index, "dateNoticed", e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <input
                  value={item.location}
                  onChange={(e) => updateComplaintItem(index, "location", e.target.value)}
                  placeholder="Item location"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <textarea
                  value={item.description}
                  onChange={(e) => updateComplaintItem(index, "description", e.target.value)}
                  placeholder="Item description / complaint wording"
                  rows={3}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="mb-2 text-sm font-semibold">Complaint Snapshot</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => addComplaintSnapshot(index, e.target.files?.[0] || null)}
                    className="block w-full text-sm"
                  />

                  {item.complaintSnapshot && (
                    <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-2">
                      <img
                        src={item.complaintSnapshot.dataUrl}
                        alt={item.complaintSnapshot.name}
                        className="w-full rounded-lg object-contain"
                      />
                      <div className="mt-2 truncate text-xs text-zinc-600">
                        {item.complaintSnapshot.name}
                      </div>
                      <textarea
                        value={item.complaintSnapshot.notes}
                        onChange={(e) => updateComplaintSnapshotNotes(index, e.target.value)}
                        placeholder="Complaint snapshot notation"
                        rows={3}
                        className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                      />
                      <button
                        onClick={() => updateComplaintItem(index, "complaintSnapshot", null)}
                        className="mt-2 w-full rounded-lg border border-zinc-300 px-2 py-2 text-xs font-semibold"
                      >
                        Remove Complaint Snapshot
                      </button>
                    </div>
                  )}
                </div>

                <textarea
                  value={item.notes}
                  onChange={(e) => updateComplaintItem(index, "notes", e.target.value)}
                  placeholder="Site notes. One point per line works best."
                  rows={6}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <input
                  value={item.areaAbove}
                  onChange={(e) => updateComplaintItem(index, "areaAbove", e.target.value)}
                  placeholder="Area above / corresponding external area"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <input
                  value={item.likelyCause}
                  onChange={(e) => updateComplaintItem(index, "likelyCause", e.target.value)}
                  placeholder="Likely mechanism or cause"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <input
                  value={item.testingMethod}
                  onChange={(e) => updateComplaintItem(index, "testingMethod", e.target.value)}
                  placeholder="Testing method"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <input
                  value={item.testingResult}
                  onChange={(e) => updateComplaintItem(index, "testingResult", e.target.value)}
                  placeholder="Testing result"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />
                <textarea
                  value={item.conclusionNotes}
                  onChange={(e) => updateComplaintItem(index, "conclusionNotes", e.target.value)}
                  placeholder="Conclusion wording to reflect"
                  rows={4}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
                />

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="mb-2 text-sm font-semibold">Inspection Photos</div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={(e) => addInspectionPhotos(index, e.target.files)}
                    className="block w-full text-sm"
                  />

                  {item.inspectionPhotos.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {item.inspectionPhotos.map((photo) => (
                        <div key={photo.id} className="rounded-xl border border-zinc-200 bg-white p-2">
                          <img
                            src={photo.dataUrl}
                            alt={photo.name}
                            className="h-40 w-full rounded-lg object-cover"
                          />
                          <div className="mt-2 truncate text-xs text-zinc-600">{photo.name}</div>
                          <textarea
                            value={photo.notes}
                            onChange={(e) =>
                              updateInspectionPhotoNotes(index, photo.id, e.target.value)
                            }
                            placeholder="Inspection photo notation"
                            rows={3}
                            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          />
                          <button
                            onClick={() => removeInspectionPhoto(index, photo.id)}
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
            onClick={addComplaintItem}
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

            {builtItems.map((item) => (
              <div key={item.index} className="mt-6 rounded-xl border border-zinc-200 p-4">
                <h3 className="mb-3 text-base font-semibold">
                  Complaint Item {item.itemLabel}
                </h3>

                {item.complaintSnapshot && (
                  <div className="mb-4">
                    <div className="mb-2 text-sm font-semibold">Complaint Snapshot</div>
                    <img
                      src={item.complaintSnapshot.dataUrl}
                      alt={item.complaintSnapshot.name}
                      className="w-full rounded-lg border border-zinc-200"
                    />
                    <div className="mt-2 rounded-lg border border-zinc-300 bg-white p-3 text-sm whitespace-pre-wrap">
                      {item.complaintSnapshot.notes || "Complaint snapshot notation"}
                    </div>
                  </div>
                )}

                {item.inspectionPhotos.length > 0 && (
                  <div>
                    <div className="mb-2 text-sm font-semibold">
                      Photos below show the area of concern
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {item.inspectionPhotos.map((photo, i) => (
                        <div key={photo.id}>
                          <img
                            src={photo.dataUrl}
                            alt={photo.name}
                            className="h-40 w-full rounded-lg border border-zinc-200 object-cover"
                          />
                          <div className="mt-1 text-xs text-zinc-600">
                            Inspection Photo {i + 1}
                          </div>
                          <div className="mt-2 rounded-lg border border-zinc-300 bg-white p-3 text-sm whitespace-pre-wrap">
                            {photo.notes || "Inspection photo notation"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-3">
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