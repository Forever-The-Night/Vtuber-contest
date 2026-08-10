import type { Metadata } from "next";
import { GroupJoinGate } from "@/components/GroupJoinGate";
import { getGroupConfig } from "@/lib/group-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "加入交流群",
};

export default async function GroupPage() {
  const config = await getGroupConfig();

  if (!config?.enabled) {
    return (
      <main className="page-shell grid place-items-center">
        <div className="panel grid min-h-64 place-items-center p-8 text-center font-bold text-[#6d6258]">
          加群入口暂未开放。
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell grid gap-6">
      <section className="panel p-6">
        <h1 className="text-3xl font-black">加入交流群</h1>
        {config.body ? (
          <p className="mt-4 whitespace-pre-wrap font-medium leading-8 text-[#5b5047]">{config.body}</p>
        ) : (
          <p className="mt-4 font-medium text-[#6d6258]">回答正确后即可看到加群二维码。</p>
        )}
      </section>
      <GroupJoinGate
        qrCodeUrl={config.qrCodeUrl}
        question={config.question ?? ""}
        questionEnabled={config.questionEnabled}
      />
    </main>
  );
}
