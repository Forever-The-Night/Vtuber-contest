import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import RegisterPage from "@/app/register/page";

describe("RegisterPage invite code control", () => {
  it("marks inviteCode as required when INVITE_REQUIRED=true", async () => {
    process.env.INVITE_REQUIRED = "true";
    const element = await RegisterPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('name="inviteCode"');
    expect(html).toContain("当前已开启邀请码注册");
    expect(html).toContain('required=""');
    expect(html).toContain("请输入管理员发放的邀请码");
  });

  it("keeps inviteCode optional when INVITE_REQUIRED=false", async () => {
    process.env.INVITE_REQUIRED = "false";
    const element = await RegisterPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('name="inviteCode"');
    expect(html).toContain("当前未开启邀请码强制校验");
    expect(html).not.toContain("请输入管理员发放的邀请码");
    expect(html).toContain("未开启时可留空");

    const inviteInputStart = html.indexOf('name="inviteCode"');
    const inviteInputEnd = html.indexOf(">", inviteInputStart);
    const inviteInputTag = html.slice(inviteInputStart, inviteInputEnd);
    expect(inviteInputTag).not.toContain("required");
  });
});
