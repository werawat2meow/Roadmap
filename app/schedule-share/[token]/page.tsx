import type { Metadata } from "next";
import ShareScheduleWorkspace from "./ShareScheduleWorkspace";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <>
    <meta name="referrer" content="no-referrer" />
    <ShareScheduleWorkspace token={token} />
  </>;
}
