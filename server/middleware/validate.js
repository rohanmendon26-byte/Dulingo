/**
 * Express middleware for declarative request payload validation using Zod.
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate =
      source === 'query' ? req.query : source === 'params' ? req.params : req.body;

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const message = firstIssue?.message || 'Invalid input data';
      return res.status(400).json({
        error: message,
        issues: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    // Assign sanitized and parsed values back
    if (source === 'body') req.body = result.data;
    else if (source === 'query') req.query = result.data;
    else if (source === 'params') req.params = result.data;

    req.validated = result.data;
    next();
  };
};
