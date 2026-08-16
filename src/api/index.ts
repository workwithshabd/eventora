export default function handler(req: any, res: any) {
  return res.status(200).json({
    success: true,
    message: "Vercel backend function is working",
  });
}