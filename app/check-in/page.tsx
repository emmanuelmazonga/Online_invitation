import type { Metadata } from "next";
import { CheckInShell } from "@/components/admin-shell";

export const metadata: Metadata = { title: "Guest Verification | James & Diana", robots: { index: false, follow: false } };
export default function CheckInPage() { return <CheckInShell />; }
