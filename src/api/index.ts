export default function handler(req: any, res: any) {
  console.log("VERCEL FUNCTION IS RUNNING");

  return res.status(200).json({
    success: true,
    message: "Vercel function works",
    method: req.method,
    url: req.url,
  });
}