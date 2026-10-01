export async function copyInviteUrl(value: string): Promise<boolean> {
  if (!value) return false;
  try { await navigator.clipboard.writeText(value); return true; } catch {}
  const previous = document.activeElement;
  const field = document.createElement('textarea');
  field.value = value; field.readOnly = true;
  field.style.position = 'fixed'; field.style.opacity = '0';
  document.body.appendChild(field);
  try { field.select(); field.setSelectionRange(0, value.length); return document.execCommand('copy'); }
  catch { return false; }
  finally { field.remove(); if (previous instanceof HTMLElement) previous.focus(); }
}
