export function toManilaIso(local) {
  return local ? `${local}:00+08:00` : "";
}

// ISO string -> "YYYY-MM-DDTHH:mm" in Asia/Manila, for datetime-local inputs.
export function toManilaLocalInput(iso) {
  if (!iso) return "";
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value])
  );
  const hour = p.hour === "24" ? "00" : p.hour;
  return `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}`;
}

export function validateDischarge(values) {
  const errors = {};
  if (!values.alias.trim()) errors.alias = "Enter a fictional alias.";
  if (!values.barangay) errors.barangay = "Choose a barangay.";
  if (!values.birth) errors.birth = "Enter the date and time of birth.";
  if (!values.discharge) errors.discharge = "Enter the discharge date and time.";
  if (!values.due) errors.due = "Enter a demo follow-up target.";
  if (values.birth && values.discharge && new Date(toManilaIso(values.discharge)) < new Date(toManilaIso(values.birth))) {
    errors.discharge = "Discharge cannot be before birth.";
  }
  if (values.discharge && values.due && new Date(toManilaIso(values.due)) < new Date(toManilaIso(values.discharge))) {
    errors.due = "Choose a target on or after discharge.";
  }
  return errors;
}