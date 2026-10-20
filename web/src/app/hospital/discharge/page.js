"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/hospital/PageHeader";
import Pill from "@/components/hospital/Pill";
import Field, { controlClass } from "@/components/hospital/Field";
import Card from "@/components/ui/Card";
import { BARANGAYS, OTHER_BARANGAY, lookupStation } from "@/lib/demoGeography";
import { validateDischarge, toManilaIso } from "@/lib/validation";
import { createDischarge } from "@/lib/data";
import { formatDotYear } from "@/lib/format";

const EMPTY = { alias: "", barangay: "", birth: "", discharge: "", due: "" };

function Item({ label, value }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

const primary = "h-12 rounded-xl bg-brand-900 px-6 font-bold text-white disabled:opacity-60";
const outline = "flex h-12 items-center rounded-xl border border-brand-200 bg-white px-6 font-bold text-brand-900";

export default function RecordDischargePage() {
  const [step, setStep] = useState("edit");
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [result, setResult] = useState(null);
  const keyRef = useRef(null);

  const errorList = Object.values(errors).filter(Boolean);
  const station = values.barangay ? lookupStation(values.barangay) : null;

  function update(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  function review() {
    const found = validateDischarge(values);
    setErrors(found);
    if (Object.keys(found).length === 0) setStep("review");
  }

  async function save() {
    if (saving) return;
    keyRef.current ??= crypto.randomUUID();
    setSaving(true);
    setSaveError(false);
    try {
      const saved = await createDischarge({
        alias: values.alias.trim(),
        barangay: values.barangay,
        birth_at: toManilaIso(values.birth),
        discharge_at: toManilaIso(values.discharge),
        due_at: toManilaIso(values.due),
        idempotency_key: keyRef.current,
      });
      setResult(saved);
      setStep("saved");
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setValues(EMPTY);
    setErrors({});
    setResult(null);
    setSaveError(false);
    keyRef.current = null;
    setStep("edit");
  }

  if (step === "saved" && result) {
    const c = result.case;
    const unassigned = c.handoff_state === "unassigned";
    return (
      <>
        <PageHeader
          title="Discharge saved"
          subtitle={
            unassigned
              ? "Station assignment needs coordinator review"
              : "The fictional discharge and station assignment are recorded"
          }
        />
        <Card>
          <Pill tone={unassigned ? "warn" : "ok"}>{unassigned ? "Station not assigned" : "✓ Saved"}</Pill>
          <h2 className="text-xl font-extrabold">
            {c.alias} · {c.id}
          </h2>
          {result.duplicate ? (
            <p className="text-muted">This discharge was already saved. No second record was created.</p>
          ) : null}
          {unassigned ? (
            <>
              <p>No matching demo station was found.</p>
              <p>The record is saved and visible as unassigned. A coordinator must review the assignment.</p>
              <Item label="Responsible worker" value="Not assigned" />
              <p className="text-sm text-muted">No receiving station or worker acceptance has been recorded.</p>
            </>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Item label="Assigned demo station" value={c.station_name} />
                <Item label="Demo follow-up target" value={formatDotYear(c.due_at)} />
              </div>
              <Item label="Responsibility" value="Awaiting worker acceptance" />
              <p>The case is available in the demo station inbox. No worker has accepted it yet.</p>
            </>
          )}
          <p className="text-sm text-muted">No visit scheduled yet.</p>
        </Card>
        <div className="mt-4 flex gap-3">
          {unassigned ? (
            <Link href="/hospital/patients" className={`${primary} flex items-center`}>
              Back to patient list
            </Link>
          ) : (
            <Link href={`/hospital/patients/${c.id}`} className={`${primary} flex items-center`}>
              View handoff
            </Link>
          )}
          <button type="button" onClick={reset} className={outline}>
            Record another discharge
          </button>
        </div>
      </>
    );
  }

  if (step === "review") {
    return (
      <>
        <PageHeader title="Review handoff" subtitle="Check this fictional record before saving" />
        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="text-xl font-extrabold">Mother and discharge</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Item label="Mother alias" value={values.alias.trim()} />
              <Item label="Birth" value={formatDotYear(toManilaIso(values.birth))} />
              <Item label="Barangay" value={values.barangay} />
              <Item label="Discharged" value={formatDotYear(toManilaIso(values.discharge))} />
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-extrabold">Follow-up handoff</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Item label="Demo follow-up target" value={formatDotYear(toManilaIso(values.due))} />
              <Item label="Demo station" value={station ?? "Not assigned (coordinator review)"} />
            </div>
            <p className="text-sm text-muted">
              Administrative target only. Station assignment follows the demonstration lookup.
            </p>
          </Card>
          <Card tone="tint">
            <h2 className="font-bold text-brand-900">Worker acceptance is still pending</h2>
            <p>Saving records the discharge and station assignment. It does not confirm a visit or worker acceptance.</p>
          </Card>
          {saveError ? (
            <div role="alert" className="rounded-2xl bg-danger-bg p-4 text-danger-ink">
              <p className="font-bold">Couldn't save the record.</p>
              <p>Your entries are kept. Try again.</p>
            </div>
          ) : null}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep("edit")} disabled={saving} className={outline}>
              ‹ Edit details
            </button>
            <button type="button" onClick={save} disabled={saving} className={primary}>
              {saving ? "Saving…" : "Save discharge"}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Record discharge"
        subtitle="Fictional information only · All dates and times use Philippine time"
      />
      {errorList.length > 0 ? (
        <div role="alert" className="mb-4 rounded-2xl bg-danger-bg p-4 text-danger-ink">
          <p className="font-bold">Check the highlighted fields</p>
          {errorList.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      ) : null}
      <div className="flex flex-col gap-4">
        <Card>
          <h2 className="text-xl font-extrabold">Mother</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Mother alias *" htmlFor="alias" error={errors.alias}>
              <input
                id="alias"
                value={values.alias}
                onChange={(e) => update("alias", e.target.value)}
                placeholder="e.g. Maria Santos (fictional)"
                className={controlClass(errors.alias)}
              />
            </Field>
            <Field label="Barangay *" htmlFor="barangay" error={errors.barangay}>
              <select
                id="barangay"
                value={values.barangay}
                onChange={(e) => update("barangay", e.target.value)}
                className={controlClass(errors.barangay)}
              >
                <option value="">Choose a barangay</option>
                {BARANGAYS.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
                <option value={OTHER_BARANGAY}>{OTHER_BARANGAY}</option>
              </select>
            </Field>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-extrabold">Birth</h2>
          <Field label="Date and time of birth *" htmlFor="birth" error={errors.birth}>
            <input
              id="birth"
              type="datetime-local"
              value={values.birth}
              onChange={(e) => update("birth", e.target.value)}
              className={controlClass(errors.birth)}
            />
          </Field>
        </Card>
        <Card>
          <h2 className="text-xl font-extrabold">Discharge details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Discharge date and time *" htmlFor="discharge" error={errors.discharge}>
              <input
                id="discharge"
                type="datetime-local"
                value={values.discharge}
                onChange={(e) => update("discharge", e.target.value)}
                className={controlClass(errors.discharge)}
              />
            </Field>
            <Field label="Facility · provided by demo workspace" htmlFor="facility">
              <input
                id="facility"
                value="Cagayan Valley Medical Center"
                readOnly
                className="h-12 w-full rounded-lg border border-brand-200 bg-brand-200 px-3 text-base"
              />
            </Field>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-extrabold">Follow-up target</h2>
          <Field
            label="Demo follow-up target *"
            htmlFor="due"
            hint="Administrative demo target, not medical guidance."
            error={errors.due}
          >
            <input
              id="due"
              type="datetime-local"
              value={values.due}
              onChange={(e) => update("due", e.target.value)}
              className={controlClass(errors.due)}
            />
          </Field>
        </Card>
        <Card tone="tint">
          {!values.barangay ? (
            <p className="text-muted">Choose a barangay to see the suggested demo station.</p>
          ) : station ? (
            <>
              <h2 className="font-bold text-brand-900">Suggested demo station: {station}</h2>
              <p className="text-muted">Based on the demo barangay lookup. A worker has not accepted responsibility yet.</p>
            </>
          ) : (
            <>
              <h2 className="font-bold text-warn-ink">No matching demo station</h2>
              <p className="text-muted">Saving will record this case as unassigned for coordinator review.</p>
            </>
          )}
        </Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">* Required fields</p>
          <div className="flex gap-3">
            <Link href="/hospital/patients" className={outline}>
              Cancel
            </Link>
            <button type="button" onClick={review} className={primary}>
              Review handoff
            </button>
          </div>
        </div>
      </div>
    </>
  );
}