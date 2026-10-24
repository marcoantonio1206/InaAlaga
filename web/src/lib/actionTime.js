// Audit time is independent of the fixed demonstration schedule clock.
// In the local adapter this is the browser clock; in Supabase routes it is the server clock.
export function actionTimestamp() {
  return new Date().toISOString();
}
