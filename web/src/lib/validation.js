export function toManilaIso(local) {
  return local ? `${local}:00+08:00` : "";
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