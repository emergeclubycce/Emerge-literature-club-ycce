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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The Emerge Chronicle · Manuscript Received</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&display=swap" rel="stylesheet" />
  <style>
    body, table, td, p, a, h1, h2, h3 {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ece8e0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ece8e0;padding:36px 12px;">
    <tr>
      <td align="center">
        <!-- Newspaper Sheet -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#fcfaf5;border:1px solid #1c1917;box-shadow:0 6px 28px rgba(0,0,0,0.12);overflow:hidden;">

          <!-- Top Gazette Header Bar -->
          <tr>
            <td style="background-color:#1c1917;padding:7px 24px;text-align:center;">
              <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:3.5px;color:#f5f5f4;text-transform:uppercase;">
                ★ THE OFFICIAL LITERARY GAZETTE OF YCCE NAGPUR ★
              </p>
            </td>
          </tr>

          <!-- Masthead Section -->
          <tr>
            <td style="padding:28px 36px 16px;text-align:center;background-color:#fcfaf5;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:4px;color:#78716c;text-transform:uppercase;">
                ESTABLISHED 2024 · LITERARY SOCIETY
              </p>
              <h1 style="margin:0;font-size:36px;font-weight:900;color:#1c1917;letter-spacing:3px;text-transform:uppercase;line-height:1.05;">
                THE EMERGE CHRONICLE
              </h1>
              <p style="margin:8px 0 0;font-size:12px;font-weight:500;color:#57534e;letter-spacing:1px;font-style:italic;">
                "Where Thoughts Find Ink & Poetry Takes Flight"
              </p>
            </td>
          </tr>

          <!-- Double-Rule Newspaper Dateline Bar -->
          <tr>
            <td style="padding:0 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:3px double #1c1917;border-bottom:1px solid #1c1917;padding:6px 0;">
                <tr>
                  <td align="left" style="font-size:10px;font-weight:700;color:#292524;text-transform:uppercase;letter-spacing:1px;">
                    VOL. II · NO. 14
                  </td>
                  <td align="center" style="font-size:10px;font-weight:600;color:#44403c;text-transform:uppercase;letter-spacing:0.8px;">
                    ${todayDate}
                  </td>
                  <td align="right" style="font-size:10px;font-weight:700;color:#292524;text-transform:uppercase;letter-spacing:1px;">
                    DISPATCH REF. #PENDING
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Article / News Story -->
          <tr>
            <td style="padding:28px 36px 20px;">

              <!-- Kicker -->
              <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#b45309;text-transform:uppercase;letter-spacing:2px;">
                EDITORIAL DESK · DISPATCH ACKNOWLEDGEMENT
              </p>

              <!-- Main Headline -->
              <h2 style="margin:0 0 14px;font-size:24px;font-weight:900;color:#1c1917;letter-spacing:-0.5px;line-height:1.25;text-transform:uppercase;">
                MANUSCRIPT RECEIVED: NEW SHAYARI SUBMITTED FOR EDITORIAL REVIEW
              </h2>

              <!-- Byline -->
              <p style="margin:0 0 20px;font-size:11px;font-weight:600;color:#78716c;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e7e5e4;padding-bottom:12px;">
                BY THE EMERGE REVIEW BOARD · FOR CONTRIBUTOR ${(name ?? "POET").toUpperCase()}
              </p>

              <!-- Story Body -->
              <p style="margin:0 0 16px;font-size:14px;color:#292524;line-height:1.75;font-weight:400;">
                <span style="font-size:28px;font-weight:900;float:left;line-height:0.85;padding-right:6px;padding-top:3px;color:#1c1917;">D</span>ear <strong>${name ?? "Poet"}</strong>, this dispatch confirms that your original poetic manuscript has been duly received by the Editorial Desk of the Emerge Literature Club. Your composition has been cataloged and entered into our moderation review pipeline.
              </p>

              <p style="margin:0 0 24px;font-size:14px;color:#292524;line-height:1.75;font-weight:400;">
                Our editorial curators are reviewing every submission with care. As soon as the review board approves your work, it will be published across the public Broadside Feed for all literature lovers to appreciate.
              </p>

              ${
                preview
                  ? `<!-- Featured Broadside Poetry Column -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background-color:#f4f0e6;border:2px dashed #a8a29e;padding:22px 24px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #d6d3d1;padding-bottom:8px;margin-bottom:14px;">
                      <tr>
                        <td align="left">
                          <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:2.5px;color:#78716c;text-transform:uppercase;">
                            ❖ THE POET'S CORNER · COLUMN I ❖
                          </p>
                        </td>
                        <td align="right">
                          <span style="font-size:9px;font-weight:700;color:#78716c;text-transform:uppercase;letter-spacing:1px;background:#e7e5e4;padding:2px 6px;border-radius:2px;">ORIGINAL VERSE</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0;font-size:15px;color:#1c1917;line-height:1.9;font-weight:500;font-style:italic;white-space:pre-line;text-align:center;">
                      “ ${preview.slice(0, 320)}${preview.length > 320 ? "…" : ""} ”
                    </p>
                    <p style="margin:14px 0 0;font-size:11px;font-weight:700;color:#57534e;text-align:right;letter-spacing:1px;text-transform:uppercase;">
                      — ${name ?? "Contributor"}
                    </p>
                  </td>
                </tr>
              </table>`
                  : ""
              }

              <!-- The Editorial Process (3 Column Strip) -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1c1917;background-color:#ffffff;margin:24px 0;padding:16px;">
                <tr>
                  <td width="33%" style="text-align:center;padding:8px;border-right:1px solid #e7e5e4;" valign="top">
                    <p style="margin:0 0 4px;font-size:18px;">✍️</p>
                    <p style="margin:0 0 4px;font-size:11px;font-weight:800;color:#1c1917;text-transform:uppercase;letter-spacing:0.8px;">1. RECEIVED</p>
                    <p style="margin:0;font-size:11px;color:#78716c;line-height:1.4;">Logged & entered into the press ledger</p>
                  </td>
                  <td width="33%" style="text-align:center;padding:8px;border-right:1px solid #e7e5e4;" valign="top">
                    <p style="margin:0 0 4px;font-size:18px;">🔍</p>
                    <p style="margin:0 0 4px;font-size:11px;font-weight:800;color:#b45309;text-transform:uppercase;letter-spacing:0.8px;">2. UNDER REVIEW</p>
                    <p style="margin:0;font-size:11px;color:#78716c;line-height:1.4;">Editors proofing & reviewing verse</p>
                  </td>
                  <td width="33%" style="text-align:center;padding:8px;" valign="top">
                    <p style="margin:0 0 4px;font-size:18px;">📰</p>
                    <p style="margin:0 0 4px;font-size:11px;font-weight:800;color:#1c1917;text-transform:uppercase;letter-spacing:0.8px;">3. IN CIRCULATION</p>
                    <p style="margin:0;font-size:11px;color:#78716c;line-height:1.4;">Going live on public feed</p>
                  </td>
                </tr>
              </table>

              <!-- Call to Action (The Newspaper Broadside Button) -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 16px;">
                <tr>
                  <td align="center">
                    <a href="${SITE_URL}/shers" style="display:inline-block;background-color:#1c1917;color:#fcfaf5;padding:14px 34px;font-size:12px;font-weight:800;text-decoration:none;letter-spacing:2px;text-transform:uppercase;border:2px solid #1c1917;box-shadow:3px 3px 0px #78716c;">
                      READ THE CURRENT EDITION →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Editorial Sign-off -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e7e5e4;padding-top:18px;margin-top:20px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#57534e;line-height:1.6;font-style:italic;">
                      "A poem begins as a lump in the throat, a sense of wrong, a homesickness, a lovesickness."
                    </p>
                    <p style="margin:8px 0 0;font-size:11px;font-weight:800;color:#1c1917;letter-spacing:1px;text-transform:uppercase;">
                      — THE EDITORIAL BOARD, EMERGE LITERATURE CLUB
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Gazette Footer / Printing Details -->
          <tr>
            <td style="background-color:#f5f2e9;border-top:2px solid #1c1917;padding:20px 36px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#44403c;letter-spacing:1.5px;text-transform:uppercase;">
                ❖ PRINTED & PUBLISHED BY THE EMERGE LITERATURE CLUB ❖
              </p>
              <p style="margin:0 0 6px;font-size:10px;color:#78716c;">
                Yeshwantrao Chavan College of Engineering · Hingna Road, Wanadongri, Nagpur 441110
              </p>
              <p style="margin:0;font-size:10px;color:#a8a29e;">
                © ${new Date().getFullYear()} Emerge Literature Club · All Rights Reserved · <a href="${SITE_URL}" style="color:#1c1917;font-weight:600;text-decoration:underline;">emergeycce.club</a>
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
      subject: "📰 DISPATCH: Your Shayari Manuscript is Under Review — Emerge YCCE",
      html: htmlContent,
    });

    // If custom domain isn't verified in Resend yet, fall back to onboarding@resend.dev
    if (error && (error.message?.includes("domain is not verified") || (error as any)?.statusCode === 403)) {
      const retry = await resend.emails.send({
        from: "The Emerge Chronicle <onboarding@resend.dev>",
        to: [email],
        replyTo: replyTo,
        subject: "📰 DISPATCH: Your Shayari Manuscript is Under Review — Emerge YCCE",
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
