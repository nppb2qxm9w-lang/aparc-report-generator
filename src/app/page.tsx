"use client";

import { useMemo, useRef, useState } from "react";

type JobMode = "complaint" | "stormwater";

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

type StormwaterInspection = {
  frontOfHousePhoto: PhotoItem | null;

  ownerBriefingDone: boolean;
  ownerBriefingNotes: string;
  explainedSewerFillTime: boolean;
  explainedBubblingNormal: boolean;
  explainedStopUsingFixtures: boolean;
  explainedDownpipeCuts: boolean;

  councilConnectionLocated: boolean;
  openingsLocated: boolean;

  iosCapRemoved: boolean;
  upstreamInspectionCompleted: boolean;

  articulationPhoto: PhotoItem | null;
  articulationLocationPhoto: PhotoItem | null;

  sewerBreakFound: "unknown" | "yes" | "no";
  sewerBreakNotes: string;
  sewerBreakPhotos: PhotoItem[];

  orgCheckDone: boolean;
  fixturesBelowOrg: "unknown" | "yes" | "no";
  fixturesBelowOrgNotes: string;

  sewerPluggedAndFilling: boolean;

  downpipesDrilled: boolean;
  stormwaterLinesCameraed: boolean;
  stormwaterObservations: string;
  stormwaterIssuePhotos: PhotoItem[];

  sewerLevelCheckedRegularly: boolean;

  sewerFilled: "unknown" | "yes" | "no";
  fullPipePhoto: PhotoItem | null;
  heldFiveMinutes: boolean;
  plugReleasedSafely: boolean;
  sewerTestNotes: string;

  downpipeHolesCapped: boolean;
  siteTidied: boolean;

  ownerAdvisedWaterOff: boolean;
  waterTurnedOff: boolean;
  waterOffFiveMinutes: boolean;
  waterTurnedBackOnSlowly: boolean;
  meterDialSpun: "unknown" | "yes" | "no";
  meterDialNotes: string;

  finalNotes: string;
};

type JobData = {
  jobMode: JobMode;
  propertyAddress: string;
  clientName: string;
  inspectionDate: string;
  complaintItems: ComplaintItem[];
  stormwaterInspection: StormwaterInspection;
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

function blankStormwaterInspection(): StormwaterInspection {
  return {
    frontOfHousePhoto: null,

    ownerBriefingDone: false,
    ownerBriefingNotes: "",
    explainedSewerFillTime: false,
    explainedBubblingNormal: false,
    explainedStopUsingFixtures: false,
    explainedDownpipeCuts: false,

    councilConnectionLocated: false,
    openingsLocated: false,

    iosCapRemoved: false,
    upstreamInspectionCompleted: false,

    articulationPhoto: null,
    articulationLocationPhoto: null,

    sewerBreakFound: "unknown",
    sewerBreakNotes: "",
    sewerBreakPhotos: [],

    orgCheckDone: false,
    fixturesBelowOrg: "unknown",
    fixturesBelowOrgNotes: "",

    sewerPluggedAndFilling: false,

    downpipesDrilled: false,
    stormwaterLinesCameraed: false,
    stormwaterObservations: "",
    stormwaterIssuePhotos: [],

    sewerLevelCheckedRegularly: false,

    sewerFilled: "unknown",
    fullPipePhoto: null,
    heldFiveMinutes: false,
    plugReleasedSafely: false,
    sewerTestNotes: "",

    downpipeHolesCapped: false,
    siteTidied: false,

    ownerAdvisedWaterOff: false,
    waterTurnedOff: false,
    waterOffFiveMinutes: false,
    waterTurnedBackOnSlowly: false,
    meterDialSpun: "unknown",
    meterDialNotes: "",

    finalNotes: "",
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

function yesNoLabel(value: "unknown" | "yes" | "no") {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return "Not recorded";
}

function PhotoUploadCard({
  title,
  photo,
  onAdd,
  onRemove,
  onNotesChange,
}: {
  title: string;
  photo: PhotoItem | null;
  onAdd: (file: File | null) => void;
  onRemove: () => void;
  onNotesChange: (value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onAdd(e.target.files?.[0] || null)}
        className="block w-full text-sm"
      />

      {photo && (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-2">
          <img
            src={photo.dataUrl}
            alt={photo.name}
            className="w-full rounded-lg object-contain"
          />
          <div className="mt-2 truncate text-xs text-zinc-600">{photo.name}</div>
          <textarea
            value={photo.notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Photo notation"
            rows={3}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
          <button
            onClick={onRemove}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-2 py-2 text-xs font-semibold"
          >
            Remove Photo
          </button>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [jobMode, setJobMode] = useState<JobMode>("complaint");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [complaintItems, setComplaintItems] = useState<ComplaintItem[]>([blankComplaintItem()]);
  const [stormwaterInspection, setStormwaterInspection] = useState<StormwaterInspection>(
    blankStormwaterInspection()
  );
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

  const updateStorm = <K extends keyof StormwaterInspection>(
    field: K,
    value: StormwaterInspection[K]
  ) => {
    setStormwaterInspection((prev) => ({ ...prev, [field]: value }));
  };

  const addSingleStormPhoto = async (
    field: keyof StormwaterInspection,
    file: File | null
  ) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    updateStorm(field as never, {
      id: uid(),
      name: file.name,
      dataUrl,
      notes: "",
    } as never);
  };

  const addStormPhotoArray = async (
    field: "sewerBreakPhotos" | "stormwaterIssuePhotos",
    files: FileList | null
  ) => {
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

    setStormwaterInspection((prev) => ({
      ...prev,
      [field]: [...prev[field], ...newPhotos],
    }));
  };

  const updateStormSinglePhotoNotes = (
    field: "frontOfHousePhoto" | "articulationPhoto" | "articulationLocationPhoto" | "fullPipePhoto",
    value: string
  ) => {
    setStormwaterInspection((prev) => {
      const photo = prev[field];
      if (!photo) return prev;
      return {
        ...prev,
        [field]: { ...photo, notes: value },
      };
    });
  };

  const updateStormArrayPhotoNotes = (
    field: "sewerBreakPhotos" | "stormwaterIssuePhotos",
    photoId: string,
    value: string
  ) => {
    setStormwaterInspection((prev) => ({
      ...prev,
      [field]: prev[field].map((photo) =>
        photo.id === photoId ? { ...photo, notes: value } : photo
      ),
    }));
  };

  const removeStormArrayPhoto = (
    field: "sewerBreakPhotos" | "stormwaterIssuePhotos",
    photoId: string
  ) => {
    setStormwaterInspection((prev) => ({
      ...prev,
      [field]: prev[field].filter((photo) => photo.id !== photoId),
    }));
  };

  const builtComplaintItems = useMemo(() => {
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

  const generatedComplaintReport = useMemo(() => {
    const header = [
      propertyAddress ? `PROPERTY: ${propertyAddress}` : "PROPERTY:",
      clientName ? `CLIENT: ${clientName}` : "CLIENT:",
      inspectionDate ? `DATE: ${inspectionDate}` : "DATE:",
      "",
      "---",
      "",
    ].join("\n");

    const body = builtComplaintItems
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
  }, [propertyAddress, clientName, inspectionDate, builtComplaintItems]);

  const generatedStormReport = useMemo(() => {
    const sw = stormwaterInspection;

    const lines = [
      propertyAddress ? `PROPERTY: ${propertyAddress}` : "PROPERTY:",
      clientName ? `CLIENT: ${clientName}` : "CLIENT:",
      inspectionDate ? `DATE: ${inspectionDate}` : "DATE:",
      "",
      "STORMWATER / SEWER INSPECTION",
      "",
      sw.ownerBriefingDone
        ? "The owner was advised of the expected inspection process, including the approximate sewer fill time, the possibility of bubbling or gurgling at fixtures, the need to stop using fixtures once bubbling was heard, and that downpipes may require cutting and patching."
        : "Owner briefing not recorded.",
      "",
      sw.councilConnectionLocated
        ? "The location of the council connection point was identified."
        : "The location of the council connection point was not recorded as identified.",
      sw.openingsLocated
        ? "Other inspection openings around the property were identified."
        : "Other inspection openings were not recorded as identified.",
      "",
      sw.iosCapRemoved
        ? "The IOS cap at the council connection was removed."
        : "Removal of the IOS cap was not recorded.",
      sw.upstreamInspectionCompleted
        ? "An upstream inspection toward the dwelling was carried out."
        : "An upstream inspection toward the dwelling was not recorded as completed.",
      "",
      `Sewer break found: ${yesNoLabel(sw.sewerBreakFound)}.`,
      sw.sewerBreakNotes ? `Break notes: ${sw.sewerBreakNotes}` : "",
      "",
      sw.orgCheckDone
        ? `Fixtures lower than ORG: ${yesNoLabel(sw.fixturesBelowOrg)}.`
        : "A check for fixtures lower than the ORG was not recorded as completed.",
      sw.fixturesBelowOrgNotes ? `ORG notes: ${sw.fixturesBelowOrgNotes}` : "",
      "",
      sw.sewerPluggedAndFilling
        ? "The sewer line was plugged and filling commenced."
        : "The sewer line was not recorded as plugged and filling.",
      sw.downpipesDrilled
        ? "Downpipes were drilled out while the drain was filling."
        : "Drilling of downpipes was not recorded.",
      sw.stormwaterLinesCameraed
        ? "Stormwater lines were camera inspected back toward the kerb."
        : "Stormwater camera inspection back toward the kerb was not recorded.",
      sw.stormwaterObservations ? `Stormwater observations: ${sw.stormwaterObservations}` : "",
      sw.sewerLevelCheckedRegularly
        ? "The level of the sewer test was checked regularly during the inspection."
        : "Regular sewer level checks were not recorded.",
      "",
      `Sewer filled: ${yesNoLabel(sw.sewerFilled)}.`,
      sw.heldFiveMinutes
        ? "Where filled, the sewer test was held for approximately 5 minutes."
        : "A 5 minute hold period was not recorded.",
      sw.plugReleasedSafely
        ? "The plug was released in a controlled manner."
        : "Controlled release of the plug was not recorded.",
      sw.sewerTestNotes ? `Sewer test notes: ${sw.sewerTestNotes}` : "",
      "",
      sw.downpipeHolesCapped
        ? "Downpipe holes were capped on completion of the inspection."
        : "Capping of downpipe holes was not recorded.",
      sw.siteTidied
        ? "The site was tidied on completion of the inspection."
        : "Site tidy-up was not recorded.",
      "",
      sw.ownerAdvisedWaterOff
        ? "The owner was advised that the water supply would be shut off temporarily."
        : "Advice to the owner regarding temporary water shut-off was not recorded.",
      sw.waterTurnedOff ? "The water supply was turned off." : "Turning off the water supply was not recorded.",
      sw.waterOffFiveMinutes
        ? "The water was left off for approximately 5 minutes."
        : "A 5 minute water isolation period was not recorded.",
      sw.waterTurnedBackOnSlowly
        ? "The water was turned back on slowly while observing the meter."
        : "Slow restoration of water while observing the meter was not recorded.",
      `Meter dial movement: ${yesNoLabel(sw.meterDialSpun)}.`,
      sw.meterDialNotes ? `Meter notes: ${sw.meterDialNotes}` : "",
      "",
      sw.finalNotes ? `Additional notes: ${sw.finalNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return lines;
  }, [propertyAddress, clientName, inspectionDate, stormwaterInspection]);

  const generatedReport =
    jobMode === "complaint" ? generatedComplaintReport : generatedStormReport;

  const currentJobData = useMemo<JobData>(
    () => ({
      jobMode,
      propertyAddress,
      clientName,
      inspectionDate,
      complaintItems,
      stormwaterInspection,
    }),
    [jobMode, propertyAddress, clientName, inspectionDate, complaintItems, stormwaterInspection]
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

    setJobMode(data.jobMode || "complaint");
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
    setStormwaterInspection({
      ...blankStormwaterInspection(),
      ...(data.stormwaterInspection || {}),
      sewerBreakPhotos: Array.isArray(data.stormwaterInspection?.sewerBreakPhotos)
        ? data.stormwaterInspection!.sewerBreakPhotos
        : [],
      stormwaterIssuePhotos: Array.isArray(data.stormwaterInspection?.stormwaterIssuePhotos)
        ? data.stormwaterInspection!.stormwaterIssuePhotos
        : [],
    });
  };

  const exportTxt = () => {
    const blob = new Blob([generatedReport], { type: "text/plain;charset=utf-8" });
    const fileName = `APaRC-Report-${propertyAddress || "Untitled"}.txt`;
    downloadBlob(blob, fileName);
  };

  const buildComplaintWordHtml = () => {
    const htmlItems = builtComplaintItems
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

  const buildStormWordHtml = () => {
    const sw = stormwaterInspection;

    const twoPhotoGrid = (photos: PhotoItem[], labelPrefix: string) =>
      photos.length
        ? `
          <div style="
            display:grid;
            grid-template-columns: 1fr 1fr;
            gap:16px;
            align-items:start;
            margin-top:10px;
          ">
            ${photos
              .map(
                (p, i) => `
                  <div style="break-inside:avoid;">
                    <div style="font-weight:bold; margin-bottom:6px;">${labelPrefix} ${i + 1}</div>
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

    const singlePhoto = (photo: PhotoItem | null, title: string) =>
      photo
        ? `
          <div style="margin:12px 0 18px 0;">
            <div style="font-weight:bold; margin-bottom:6px;">${title}</div>
            <img
              src="${photo.dataUrl}"
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
            ${photoNotesHtml(photo.notes)}
          </div>
        `
        : "";

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>APaRC Stormwater / Sewer Inspection</title>
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
          <h1>APaRC Stormwater / Sewer Inspection</h1>
          <p><strong>PROPERTY:</strong> ${escapeHtml(propertyAddress)}</p>
          <p><strong>CLIENT:</strong> ${escapeHtml(clientName)}</p>
          <p><strong>DATE:</strong> ${escapeHtml(inspectionDate)}</p>
          <hr />

          ${singlePhoto(sw.frontOfHousePhoto, "Front of House")}
          <p><strong>Owner briefing completed:</strong> ${sw.ownerBriefingDone ? "Yes" : "No"}</p>
          ${sw.ownerBriefingNotes ? `<p><strong>Owner briefing notes:</strong> ${escapeHtml(sw.ownerBriefingNotes)}</p>` : ""}
          <p><strong>Explained sewer fill time:</strong> ${sw.explainedSewerFillTime ? "Yes" : "No"}</p>
          <p><strong>Explained bubbling/gurgling:</strong> ${sw.explainedBubblingNormal ? "Yes" : "No"}</p>
          <p><strong>Explained stop using fixtures:</strong> ${sw.explainedStopUsingFixtures ? "Yes" : "No"}</p>
          <p><strong>Explained downpipe cuts/patching:</strong> ${sw.explainedDownpipeCuts ? "Yes" : "No"}</p>

          <hr />
          <p><strong>Council connection located:</strong> ${sw.councilConnectionLocated ? "Yes" : "No"}</p>
          <p><strong>Inspection openings located:</strong> ${sw.openingsLocated ? "Yes" : "No"}</p>
          <p><strong>IOS cap removed:</strong> ${sw.iosCapRemoved ? "Yes" : "No"}</p>
          <p><strong>Upstream inspection completed:</strong> ${sw.upstreamInspectionCompleted ? "Yes" : "No"}</p>

          ${singlePhoto(sw.articulationPhoto, "Articulation Photo")}
          ${singlePhoto(sw.articulationLocationPhoto, "Articulation Location Photo")}

          <hr />
          <p><strong>Sewer break found:</strong> ${yesNoLabel(sw.sewerBreakFound)}</p>
          ${sw.sewerBreakNotes ? `<p><strong>Sewer break notes:</strong> ${escapeHtml(sw.sewerBreakNotes)}</p>` : ""}
          ${twoPhotoGrid(sw.sewerBreakPhotos, "Sewer Break Photo")}

          <hr />
          <p><strong>ORG check completed:</strong> ${sw.orgCheckDone ? "Yes" : "No"}</p>
          <p><strong>Fixtures below ORG:</strong> ${yesNoLabel(sw.fixturesBelowOrg)}</p>
          ${sw.fixturesBelowOrgNotes ? `<p><strong>ORG notes:</strong> ${escapeHtml(sw.fixturesBelowOrgNotes)}</p>` : ""}

          <hr />
          <p><strong>Sewer plugged and filling started:</strong> ${sw.sewerPluggedAndFilling ? "Yes" : "No"}</p>
          <p><strong>Downpipes drilled out:</strong> ${sw.downpipesDrilled ? "Yes" : "No"}</p>
          <p><strong>Stormwater lines camera inspected:</strong> ${sw.stormwaterLinesCameraed ? "Yes" : "No"}</p>
          ${sw.stormwaterObservations ? `<p><strong>Stormwater observations:</strong> ${escapeHtml(sw.stormwaterObservations)}</p>` : ""}
          ${twoPhotoGrid(sw.stormwaterIssuePhotos, "Stormwater Issue Photo")}
          <p><strong>Sewer level checked regularly:</strong> ${sw.sewerLevelCheckedRegularly ? "Yes" : "No"}</p>

          <hr />
          <p><strong>Sewer filled:</strong> ${yesNoLabel(sw.sewerFilled)}</p>
          ${singlePhoto(sw.fullPipePhoto, "Full Pipe Photo")}
          <p><strong>Held for 5 minutes:</strong> ${sw.heldFiveMinutes ? "Yes" : "No"}</p>
          <p><strong>Plug released safely:</strong> ${sw.plugReleasedSafely ? "Yes" : "No"}</p>
          ${sw.sewerTestNotes ? `<p><strong>Sewer test notes:</strong> ${escapeHtml(sw.sewerTestNotes)}</p>` : ""}

          <hr />
          <p><strong>Downpipe holes capped:</strong> ${sw.downpipeHolesCapped ? "Yes" : "No"}</p>
          <p><strong>Site tidied:</strong> ${sw.siteTidied ? "Yes" : "No"}</p>

          <hr />
          <p><strong>Owner advised water off:</strong> ${sw.ownerAdvisedWaterOff ? "Yes" : "No"}</p>
          <p><strong>Water turned off:</strong> ${sw.waterTurnedOff ? "Yes" : "No"}</p>
          <p><strong>Water off for 5 minutes:</strong> ${sw.waterOffFiveMinutes ? "Yes" : "No"}</p>
          <p><strong>Water turned back on slowly:</strong> ${sw.waterTurnedBackOnSlowly ? "Yes" : "No"}</p>
          <p><strong>Meter dial spun:</strong> ${yesNoLabel(sw.meterDialSpun)}</p>
          ${sw.meterDialNotes ? `<p><strong>Meter notes:</strong> ${escapeHtml(sw.meterDialNotes)}</p>` : ""}

          ${sw.finalNotes ? `<hr /><p><strong>Final notes:</strong> ${escapeHtml(sw.finalNotes)}</p>` : ""}
        </body>
      </html>
    `;
  };

  const buildWordHtml = () =>
    jobMode === "complaint" ? buildComplaintWordHtml() : buildStormWordHtml();

  const exportWord = () => {
    const html = buildWordHtml();
    const blob = new Blob([html], { type: "application/msword" });
    const fileName =
      jobMode === "complaint"
        ? `APaRC-Report-${propertyAddress || "Untitled"}.doc`
        : `APaRC-Stormwater-Sewer-${propertyAddress || "Untitled"}.doc`;
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
          <title>APaRC PDF</title>
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
              Complaint / defect inspections and stormwater / sewer inspection workflow.
            </div>
          </div>
        </div>

        <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold">Job Setup</h2>
          <div className="grid gap-3">
            <select
              value={jobMode}
              onChange={(e) => setJobMode(e.target.value as JobMode)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-500"
            >
              <option value="complaint">Complaint / Defect Inspection</option>
              <option value="stormwater">Stormwater / Sewer Inspection</option>
            </select>

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

        {jobMode === "complaint" ? (
          <>
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
          </>
        ) : (
          <>
            <section className="space-y-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
                <h2 className="mb-3 text-lg font-semibold">Pre-Start</h2>
                <div className="grid gap-3">
                  <PhotoUploadCard
                    title="Front of House Photo"
                    photo={stormwaterInspection.frontOfHousePhoto}
                    onAdd={(file) => addSingleStormPhoto("frontOfHousePhoto", file)}
                    onRemove={() => updateStorm("frontOfHousePhoto", null)}
                    onNotesChange={(value) => updateStormSinglePhotoNotes("frontOfHousePhoto", value)}
                  />

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.ownerBriefingDone}
                      onChange={(e) => updateStorm("ownerBriefingDone", e.target.checked)}
                    />
                    <span>Owner briefing completed</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.explainedSewerFillTime}
                      onChange={(e) => updateStorm("explainedSewerFillTime", e.target.checked)}
                    />
                    <span>Explained sewer fill takes approximately 45 minutes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.explainedBubblingNormal}
                      onChange={(e) => updateStorm("explainedBubblingNormal", e.target.checked)}
                    />
                    <span>Explained bubbling/gurgling is normal</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.explainedStopUsingFixtures}
                      onChange={(e) => updateStorm("explainedStopUsingFixtures", e.target.checked)}
                    />
                    <span>Explained to stop using fixtures once bubbling is heard</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.explainedDownpipeCuts}
                      onChange={(e) => updateStorm("explainedDownpipeCuts", e.target.checked)}
                    />
                    <span>Explained downpipe cutting and patching process</span>
                  </label>

                  <textarea
                    value={stormwaterInspection.ownerBriefingNotes}
                    onChange={(e) => updateStorm("ownerBriefingNotes", e.target.value)}
                    placeholder="Owner briefing notes"
                    rows={3}
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
                <h2 className="mb-3 text-lg font-semibold">Connection / Openings</h2>
                <div className="grid gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.councilConnectionLocated}
                      onChange={(e) => updateStorm("councilConnectionLocated", e.target.checked)}
                    />
                    <span>Council connection point identified</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.openingsLocated}
                      onChange={(e) => updateStorm("openingsLocated", e.target.checked)}
                    />
                    <span>Other inspection openings identified</span>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
                <h2 className="mb-3 text-lg font-semibold">Initial Sewer Inspection</h2>
                <div className="grid gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.iosCapRemoved}
                      onChange={(e) => updateStorm("iosCapRemoved", e.target.checked)}
                    />
                    <span>IOS cap removed at council connection</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.upstreamInspectionCompleted}
                      onChange={(e) => updateStorm("upstreamInspectionCompleted", e.target.checked)}
                    />
                    <span>Upstream inspected toward the house</span>
                  </label>

                  <PhotoUploadCard
                    title="Articulation Photo"
                    photo={stormwaterInspection.articulationPhoto}
                    onAdd={(file) => addSingleStormPhoto("articulationPhoto", file)}
                    onRemove={() => updateStorm("articulationPhoto", null)}
                    onNotesChange={(value) => updateStormSinglePhotoNotes("articulationPhoto", value)}
                  />

                  <PhotoUploadCard
                    title="Articulation Location Photo"
                    photo={stormwaterInspection.articulationLocationPhoto}
                    onAdd={(file) => addSingleStormPhoto("articulationLocationPhoto", file)}
                    onRemove={() => updateStorm("articulationLocationPhoto", null)}
                    onNotesChange={(value) =>
                      updateStormSinglePhotoNotes("articulationLocationPhoto", value)
                    }
                  />

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <div className="mb-2 text-sm font-semibold">Sewer break found</div>
                    <select
                      value={stormwaterInspection.sewerBreakFound}
                      onChange={(e) =>
                        updateStorm("sewerBreakFound", e.target.value as "unknown" | "yes" | "no")
                      }
                      className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none"
                    >
                      <option value="unknown">Not recorded</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>

                    <textarea
                      value={stormwaterInspection.sewerBreakNotes}
                      onChange={(e) => updateStorm("sewerBreakNotes", e.target.value)}
                      placeholder="Break notes / how to plug upstream"
                      rows={3}
                      className="mt-3 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none"
                    />

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={(e) => addStormPhotoArray("sewerBreakPhotos", e.target.files)}
                      className="mt-3 block w-full text-sm"
                    />

                    {stormwaterInspection.sewerBreakPhotos.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {stormwaterInspection.sewerBreakPhotos.map((photo) => (
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
                                updateStormArrayPhotoNotes(
                                  "sewerBreakPhotos",
                                  photo.id,
                                  e.target.value
                                )
                              }
                              placeholder="Photo notation"
                              rows={3}
                              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none"
                            />
                            <button
                              onClick={() => removeStormArrayPhoto("sewerBreakPhotos", photo.id)}
                              className="mt-2 w-full rounded-lg border border-zinc-300 px-2 py-2 text-xs font-semibold"
                            >
                              Remove Photo
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.orgCheckDone}
                      onChange={(e) => updateStorm("orgCheckDone", e.target.checked)}
                    />
                    <span>Checked for fixtures lower than ORG</span>
                  </label>

                  <select
                    value={stormwaterInspection.fixturesBelowOrg}
                    onChange={(e) =>
                      updateStorm("fixturesBelowOrg", e.target.value as "unknown" | "yes" | "no")
                    }
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none"
                  >
                    <option value="unknown">Fixtures below ORG not recorded</option>
                    <option value="yes">Fixtures below ORG - Yes</option>
                    <option value="no">Fixtures below ORG - No</option>
                  </select>

                  <textarea
                    value={stormwaterInspection.fixturesBelowOrgNotes}
                    onChange={(e) => updateStorm("fixturesBelowOrgNotes", e.target.value)}
                    placeholder="ORG / fixture notes"
                    rows={3}
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none"
                  />

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.sewerPluggedAndFilling}
                      onChange={(e) => updateStorm("sewerPluggedAndFilling", e.target.checked)}
                    />
                    <span>Sewer plugged and filling started</span>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
                <h2 className="mb-3 text-lg font-semibold">While Sewer Filling / Stormwater Inspection</h2>
                <div className="grid gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.downpipesDrilled}
                      onChange={(e) => updateStorm("downpipesDrilled", e.target.checked)}
                    />
                    <span>Downpipes drilled out</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.stormwaterLinesCameraed}
                      onChange={(e) => updateStorm("stormwaterLinesCameraed", e.target.checked)}
                    />
                    <span>Stormwater lines camera’d back to kerb</span>
                  </label>

                  <textarea
                    value={stormwaterInspection.stormwaterObservations}
                    onChange={(e) => updateStorm("stormwaterObservations", e.target.value)}
                    placeholder="Backfill / ponding / visibility / dents / obstructions observations"
                    rows={4}
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none"
                  />

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={(e) => addStormPhotoArray("stormwaterIssuePhotos", e.target.files)}
                    className="block w-full text-sm"
                  />

                  {stormwaterInspection.stormwaterIssuePhotos.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {stormwaterInspection.stormwaterIssuePhotos.map((photo) => (
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
                              updateStormArrayPhotoNotes(
                                "stormwaterIssuePhotos",
                                photo.id,
                                e.target.value
                              )
                            }
                            placeholder="Photo notation"
                            rows={3}
                            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none"
                          />
                          <button
                            onClick={() => removeStormArrayPhoto("stormwaterIssuePhotos", photo.id)}
                            className="mt-2 w-full rounded-lg border border-zinc-300 px-2 py-2 text-xs font-semibold"
                          >
                            Remove Photo
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.sewerLevelCheckedRegularly}
                      onChange={(e) =>
                        updateStorm("sewerLevelCheckedRegularly", e.target.checked)
                      }
                    />
                    <span>Sewer level checked regularly</span>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
                <h2 className="mb-3 text-lg font-semibold">Sewer Test Result</h2>
                <div className="grid gap-3">
                  <select
                    value={stormwaterInspection.sewerFilled}
                    onChange={(e) =>
                      updateStorm("sewerFilled", e.target.value as "unknown" | "yes" | "no")
                    }
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none"
                  >
                    <option value="unknown">Sewer filled not recorded</option>
                    <option value="yes">Sewer filled - Yes</option>
                    <option value="no">Sewer filled - No</option>
                  </select>

                  <PhotoUploadCard
                    title="Full Pipe Photo"
                    photo={stormwaterInspection.fullPipePhoto}
                    onAdd={(file) => addSingleStormPhoto("fullPipePhoto", file)}
                    onRemove={() => updateStorm("fullPipePhoto", null)}
                    onNotesChange={(value) => updateStormSinglePhotoNotes("fullPipePhoto", value)}
                  />

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.heldFiveMinutes}
                      onChange={(e) => updateStorm("heldFiveMinutes", e.target.checked)}
                    />
                    <span>Held for 5 minutes</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.plugReleasedSafely}
                      onChange={(e) => updateStorm("plugReleasedSafely", e.target.checked)}
                    />
                    <span>Plug released safely</span>
                  </label>

                  <textarea
                    value={stormwaterInspection.sewerTestNotes}
                    onChange={(e) => updateStorm("sewerTestNotes", e.target.value)}
                    placeholder="Sewer test notes"
                    rows={4}
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
                <h2 className="mb-3 text-lg font-semibold">Finish / Water Meter Test</h2>
                <div className="grid gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.downpipeHolesCapped}
                      onChange={(e) => updateStorm("downpipeHolesCapped", e.target.checked)}
                    />
                    <span>Downpipe holes capped</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.siteTidied}
                      onChange={(e) => updateStorm("siteTidied", e.target.checked)}
                    />
                    <span>Site tidied</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.ownerAdvisedWaterOff}
                      onChange={(e) => updateStorm("ownerAdvisedWaterOff", e.target.checked)}
                    />
                    <span>Owner advised water will be shut off</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.waterTurnedOff}
                      onChange={(e) => updateStorm("waterTurnedOff", e.target.checked)}
                    />
                    <span>Water turned off</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.waterOffFiveMinutes}
                      onChange={(e) => updateStorm("waterOffFiveMinutes", e.target.checked)}
                    />
                    <span>Water left off for 5 minutes</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stormwaterInspection.waterTurnedBackOnSlowly}
                      onChange={(e) => updateStorm("waterTurnedBackOnSlowly", e.target.checked)}
                    />
                    <span>Water turned back on slowly while watching meter</span>
                  </label>

                  <select
                    value={stormwaterInspection.meterDialSpun}
                    onChange={(e) =>
                      updateStorm("meterDialSpun", e.target.value as "unknown" | "yes" | "no")
                    }
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none"
                  >
                    <option value="unknown">Meter dial movement not recorded</option>
                    <option value="yes">Meter dial spun - Yes</option>
                    <option value="no">Meter dial spun - No</option>
                  </select>

                  <textarea
                    value={stormwaterInspection.meterDialNotes}
                    onChange={(e) => updateStorm("meterDialNotes", e.target.value)}
                    placeholder="Meter dial notes"
                    rows={3}
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none"
                  />

                  <textarea
                    value={stormwaterInspection.finalNotes}
                    onChange={(e) => updateStorm("finalNotes", e.target.value)}
                    placeholder="Additional final notes"
                    rows={4}
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none"
                  />
                </div>
              </div>
            </section>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowPreview((v) => !v)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-zinc-900 sm:w-auto"
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>
          </>
        )}

        {showPreview && (
          <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold">Generated Report</h2>
            <pre className="whitespace-pre-wrap break-words rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-800">
              {generatedReport}
            </pre>

            {jobMode === "complaint" ? (
              builtComplaintItems.map((item) => (
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
              ))
            ) : (
              <div className="mt-6 space-y-6">
                {stormwaterInspection.frontOfHousePhoto && (
                  <div className="rounded-xl border border-zinc-200 p-4">
                    <div className="mb-2 text-sm font-semibold">Front of House</div>
                    <img
                      src={stormwaterInspection.frontOfHousePhoto.dataUrl}
                      alt={stormwaterInspection.frontOfHousePhoto.name}
                      className="w-full rounded-lg border border-zinc-200"
                    />
                    <div className="mt-2 rounded-lg border border-zinc-300 bg-white p-3 text-sm whitespace-pre-wrap">
                      {stormwaterInspection.frontOfHousePhoto.notes || "Photo notation"}
                    </div>
                  </div>
                )}

                {stormwaterInspection.sewerBreakPhotos.length > 0 && (
                  <div className="rounded-xl border border-zinc-200 p-4">
                    <div className="mb-2 text-sm font-semibold">Sewer Break Photos</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {stormwaterInspection.sewerBreakPhotos.map((photo, i) => (
                        <div key={photo.id}>
                          <img
                            src={photo.dataUrl}
                            alt={photo.name}
                            className="h-40 w-full rounded-lg border border-zinc-200 object-cover"
                          />
                          <div className="mt-1 text-xs text-zinc-600">Sewer Break Photo {i + 1}</div>
                          <div className="mt-2 rounded-lg border border-zinc-300 bg-white p-3 text-sm whitespace-pre-wrap">
                            {photo.notes || "Photo notation"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stormwaterInspection.stormwaterIssuePhotos.length > 0 && (
                  <div className="rounded-xl border border-zinc-200 p-4">
                    <div className="mb-2 text-sm font-semibold">Stormwater Issue Photos</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {stormwaterInspection.stormwaterIssuePhotos.map((photo, i) => (
                        <div key={photo.id}>
                          <img
                            src={photo.dataUrl}
                            alt={photo.name}
                            className="h-40 w-full rounded-lg border border-zinc-200 object-cover"
                          />
                          <div className="mt-1 text-xs text-zinc-600">
                            Stormwater Issue Photo {i + 1}
                          </div>
                          <div className="mt-2 rounded-lg border border-zinc-300 bg-white p-3 text-sm whitespace-pre-wrap">
                            {photo.notes || "Photo notation"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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