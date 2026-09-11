export function logError(error: unknown, context = "Application error") {
  if (process.env.NODE_ENV === "production") {
    console.error(context);
    return;
  }

  console.error(context, error);
}
