import { redirect } from "next/navigation";

export default function AdminCancellationsRedirectPage() {
  redirect("/admin/cancellation-requests");
}
