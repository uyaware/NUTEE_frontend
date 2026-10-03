import { useState } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";

export function PasswordField(props: TextFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      sx={[
        {
          // Keep our accessible visibility control instead of Edge's duplicate.
          "& input::-ms-reveal, & input::-ms-clear": { display: "none" },
        },
        ...(Array.isArray(props.sx) ? props.sx : props.sx ? [props.sx] : []),
      ]}
      slotProps={{
        ...props.slotProps,
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                type="button"
                aria-label={`${visible ? "Ẩn" : "Hiện"} ${String(props.label).toLowerCase()}`}
                aria-pressed={visible}
                disabled={props.disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
