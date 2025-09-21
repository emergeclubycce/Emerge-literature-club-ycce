import cookie from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { payload } = req.body;

    if (!payload?.token) {
      return res.status(400).json({ message: "Token missing" });
    }

    res.setHeader(
      "Set-Cookie",
      cookie.serialize("auth_token", payload.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 90, // 3 months
      })
    );

    return res.status(200).json({ message: "Cookie set successfully", user: payload });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
