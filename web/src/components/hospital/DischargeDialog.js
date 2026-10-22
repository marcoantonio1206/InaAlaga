"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Overlay";
import Pill from "@/components/hospital/Pill";
import Field, { controlClass } from "@/components/hospital/Field";
import MotherLink from "@/components/hospital/MotherLink";
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

const primary = "h-12 rounded-xl bg-brand-900 px-6 font-bold text-white disabled:opacity-50";
const outline =
  "flex h-12 items-center rounded-xl border border-brand-200 bg-white px-6 font-bold text-brand-900 disabled:opacity-50";

// Three states of one dialog: edit -> review -> saved. Cancel or close returns
// to the list without saving; entries are kept while the dialog stays open.
export default function DischargeDialog({ open, onClose, onSaved, onViewHandoff }) {
  const [step, setStep] = useState("edit");
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [result, setResult] = useState(null);
  const keyRef = useRef(null);

  const errorList = Object.values(errors).filter(Boolean);
  const station = values.barangay ? lookupStation(values.barangay) : null;
  const complete = Object.values(values).every((v) => String(v).trim());

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
      onSaved?.(saved.case);
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

  function close() {
    reset();
    onClose();
  }

  if (step === "saved" && result) {
    const c = result.case;
    const unassigned = c.handoff_state === "unassigned";
    return (
      <Modal
        open={open}
        onClose={close}
        title="Discharge saved"
        subtitle={
          unassigned
            ? "Station assignment needs coordinator review"
            : "The fictional discharge and station assignment are recorded"
        }
      >
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
              <div className="grid gap-4 border-b border-brand-200 pb-3 md:grid-cols-2">
                <Item label="Assigned demo station" value={c.station_name} />
                <Item label="Demo follow-up target" value={formatDotYear(c.due_at)} />
              </div>
              <Item label="Responsibility" value="Awaiting worker acceptance" />
              <p>The case is available in the demo station inbox. No worker has accepted it yet.</p>
            </>
          )}
          <p className="text-sm text-muted">No visit scheduled yet.</p>
          <div className="border-t border-brand-200 pt-3">
            <MotherLink link={result.link} />
          </div>
        </Card>
        <div className="mt-5 flex flex-wrap gap-3">
          {unassigned ? (
            <button type="button" onClick={close} className={primary}>
              Back to patient list
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const id = c.id;
                reset();
                onViewHandoff(id);
              }}
              className={primary}
            >
              View handoff
            </button>
          )}
          <button type="button" onClick={reset} className={outline}>
            Record another discharge
          </button>
        </div>
      </Modal>
    );
  }

  if (step === "review") {
    return (
      <Modal open={open} onClose={close} title="Review handoff" subtitle="Check this fictional record before saving">
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
              <p className="font-bold">Couldn&apos;t save the record.</p>
              <p>Your entries are kept. Try again.</p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep("edit")} disabled={saving} className={outline}>
              ‹ Edit details
            </button>
            <button type="button" onClick={save} disabled={saving} className={primary}>
              {saving ? "Saving…" : "Save discharge"}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  const editFooter = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">* Required fields</p>
      <div className="flex gap-3">
        <button type="button" onClick={close} className={outline}>
          Cancel
        </button>
        <button type="button" onClick={review} disabled={!complete} className={primary}>
          Review handoff
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={close}
      title="Record discharge"
      subtitle="Fictional information only · All dates and times use Philippine time"
      footer={editFooter}
    >
      {errorList.length > 0 ? (
        <div role="alert" className="mb-3 rounded-2xl bg-danger-bg p-3 text-sm text-danger-ink">
          <p className="font-bold">Check the highlighted fields</p>
          {errorList.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <Card>
          <h2 className="text-lg font-extrabold">Mother and birth</h2>
          <div className="grid gap-3 md:grid-cols-2">
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
            <Field label="Date and time of birth *" htmlFor="birth" error={errors.birth}>
              <input
                id="birth"
                type="datetime-local"
                value={values.birth}
                onChange={(e) => update("birth", e.target.value)}
                className={controlClass(errors.birth)}
              />
            </Field>
            <Field label="Discharge date and time *" htmlFor="discharge" error={errors.discharge}>
              <input
                id="discharge"
                type="datetime-local"
                value={values.discharge}
                onChange={(e) => update("discharge", e.target.value)}
                className={controlClass(errors.discharge)}
              />
            </Field>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-extrabold">Follow-up handoff</h2>
          <div className="grid gap-3 md:grid-cols-2">
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
            <Field label="Facility · provided by demo workspace" htmlFor="facility" hint="Read only.">
              <input
                id="facility"
                value="Cagayan Valley Medical Center"
                readOnly
                className="h-12 w-full rounded-lg border border-brand-200 bg-brand-200 px-3 text-base"
              />
            </Field>
          </div>
        </Card>
        <Card tone="tint">
          {!values.barangay ? (
            <p className="text-sm text-muted">Choose a barangay to see the suggested demo station.</p>
          ) : station ? (
            <>
              <h2 className="font-bold text-brand-900">Suggested demo station: {station}</h2>
              <p className="text-sm text-muted">Based on the demo barangay lookup. A worker has not accepted responsibility yet.</p>
            </>
          ) : (
            <>
              <h2 className="font-bold text-warn-ink">No matching demo station</h2>
              <p className="text-sm text-muted">Saving will record this case as unassigned for coordinator review.</p>
            </>
          )}
        </Card>
      </div>
    </Modal>
  );
}
