export function normalizeZambianPhone(value: string): string | null {
  const cleaned = value.trim().replace(/[\s()-]/g, "").replace(/^00/, "+");
  let digits = cleaned.replace(/\D/g, "");

  if (digits.startsWith("0") && digits.length === 10) digits = `260${digits.slice(1)}`;
  if (digits.startsWith("260") && digits.length === 12) return `+${digits}`;
  return null;
}

export function whatsappHref(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
