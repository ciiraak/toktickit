import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_change_me_in_prod";

export function getAuthCookie(userId: number, role: string = "REQUESTER") {
  const token = jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "1h" });
  return `token=${token}`;
}
