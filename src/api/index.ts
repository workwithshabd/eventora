export default async function handler(req: any, res: any) {
  try {
    console.log("Starting function");

    const { default: app } = await import("../app.ts");

    console.log("App imported successfully");

    return app(req, res);
  } catch (error) {
    console.error("APP IMPORT ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : String(error),
      stack:
        error instanceof Error
          ? error.stack
          : undefined,
    });
  }
}