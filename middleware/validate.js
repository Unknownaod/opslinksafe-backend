// Zod-based body validator
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (err) {
      const issues = err?.issues?.map((i) => `${i.path.join(".")}: ${i.message}`) || [];
      res.status(400).json({
        ok: false,
        error: {
          message: "Validation error",
          details: issues
        }
      });
    }
  };
}
