import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "提交作品",
};

export default function SubmitPage() {
  redirect("/dashboard");
}
