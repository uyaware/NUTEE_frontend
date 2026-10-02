import { Box, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
export function Brand({ management = false }: { management?: boolean }) {
  return (
    <Stack
      component={Link}
      to={management ? "/management" : "/"}
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ textDecoration: "none", flexShrink: 0 }}
    >
      <Box
        component="img"
        src="/logo_nutee.png"
        alt=""
        sx={{ width: 50, height: 50, objectFit: "contain", borderRadius: 1 }}
      />
      <Box>
        <Typography
          sx={{
            fontSize: 21,
            fontWeight: 800,
            letterSpacing: "-.06em",
            lineHeight: 1.1,
          }}
        >
          <Box component="span" sx={{ color: "primary.main" }}>
            NUT
          </Box>
          EE
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {management ? "WORKSPACE" : "Không gian công nghệ"}
        </Typography>
      </Box>
    </Stack>
  );
}
