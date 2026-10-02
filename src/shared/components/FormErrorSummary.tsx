import { useEffect, useRef } from "react";
import { Alert, Link, Stack, Typography } from "@mui/material";

export function FormErrorSummary({
  errors,
  submitCount,
}: {
  errors: { fieldId: string; message: string }[];
  submitCount: number;
}) {
  const element = useRef<HTMLDivElement>(null);
  const previousSubmit = useRef(0);
  useEffect(() => {
    if (submitCount !== previousSubmit.current) {
      previousSubmit.current = submitCount;
      if (errors.length) element.current?.focus();
    }
  }, [submitCount, errors.length]);
  if (!errors.length) return null;
  return (
    <Alert severity="error" ref={element} tabIndex={-1}>
      <Stack spacing={1}>
        <Typography fontWeight={600}>Kiểm tra các trường sau</Typography>
        {errors.map((error) => (
          <Link
            key={error.fieldId}
            href={`#${error.fieldId}`}
            onClick={(event) => {
              event.preventDefault();
              document.getElementById(error.fieldId)?.focus();
            }}
          >
            {error.message}
          </Link>
        ))}
      </Stack>
    </Alert>
  );
}
