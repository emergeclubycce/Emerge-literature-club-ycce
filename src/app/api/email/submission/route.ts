import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const FROM = process.env.EMAIL_FROM ?? "emerge@emergeycce.club";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://emergeycce.club";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY is not set. Email not sent.");
      return NextResponse.json(
        { error: "RESEND_API_KEY environment variable is not configured" },
        { status: 500 }
      );
    }
    const resend = new Resend(apiKey);

    const { email, name, preview } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const todayDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The Emerge Chronicle</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    body, table, td, p, a, h1, h2 {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f2eb;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f2eb;padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Compact Newspaper Card -->
        <table width="460" cellpadding="0" cellspacing="0" style="max-width:460px;width:100%;background-color:#fcfaf5;border:1px solid #292524;box-shadow:0 3px 12px rgba(0,0,0,0.08);">
          
          <!-- Masthead -->
          <tr>
            <td style="padding:18px 24px 12px;text-align:center;border-bottom:1px solid #e7e5e4;">
              <p style="margin:0 0 2px;font-size:9px;font-weight:700;letter-spacing:2.5px;color:#78716c;text-transform:uppercase;">
                YCCE LITERARY DISPATCH · ${todayDate}
              </p>
              <h1 style="margin:0;font-size:22px;font-weight:900;color:#1c1917;letter-spacing:2px;text-transform:uppercase;">
                THE EMERGE CHRONICLE
              </h1>
              <div style="margin-top:8px;border-top:3px double #1c1917;"></div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:20px 24px 16px;">
              <h2 style="margin:0 0 10px;font-size:16px;font-weight:800;color:#1c1917;text-transform:uppercase;letter-spacing:0.5px;">
                ✍️ Manuscript Received & Under Review
              </h2>

              <p style="margin:0 0 12px;font-size:13px;color:#292524;line-height:1.6;">
                Hi <strong>${name ?? "Poet"}</strong>, your shayari has been received and is waiting for review by our editors. We'll send you an email the moment it is approved and live on the feed!
              </p>

              ${
                preview
                  ? `<!-- Short Verse Snippet -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;background-color:#f4f0e6;border-left:3px solid #1c1917;padding:12px 14px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#1c1917;line-height:1.7;font-style:italic;white-space:pre-line;">
                      “ ${preview.slice(0, 180)}${preview.length > 180 ? "…" : ""} ”
                    </p>
                  </td>
                </tr>
              </table>`
                  : ""
              }

              <!-- Short Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 12px;">
                <tr>
                  <td align="center">
                    <a href="${SITE_URL}/shers" style="display:inline-block;background-color:#1c1917;color:#ffffff;padding:10px 24px;font-size:11px;font-weight:800;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;">
                      BROWSE THE FEED →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Compact Footer -->
          <tr>
            <td style="background-color:#f5f2e9;border-top:1px solid #e7e5e4;padding:10px 20px;text-align:center;">
              <p style="margin:0;font-size:10px;color:#78716c;">
                Emerge Literature Club · YCCE Nagpur · <a href="${SITE_URL}" style="color:#1c1917;text-decoration:none;font-weight:600;">emergeycce.club</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const configuredFrom = (process.env.EMAIL_FROM || "").trim();
    const isPublicWebmail = /@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/i.test(configuredFrom);
    const initialFrom = !configuredFrom || isPublicWebmail ? "onboarding@resend.dev" : configuredFrom;
    const replyTo = configuredFrom || undefined;

    // Send email via Resend
    let { data, error } = await resend.emails.send({
      from: `The Emerge Chronicle <${initialFrom}>`,
      to: [email],
      replyTo: replyTo,
      subject: "✍️ Your Shayari is under review — The Emerge Chronicle",
      html: htmlContent,
    });

    if (error && (error.message?.includes("domain is not verified") || (error as any)?.statusCode === 403)) {
      const retry = await resend.emails.send({
        from: "The Emerge Chronicle <onboarding@resend.dev>",
        to: [email],
        replyTo: replyTo,
        subject: "✍️ Your Shayari is under review — The Emerge Chronicle",
        html: htmlContent,
      });
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to send email" },
      { status: 500 }
    );
  }
}
