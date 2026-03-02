import { useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Stack,
} from "@mui/material";

export default function SignUp() {
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Placeholder: replace with real signup logic later
    console.log("Sign up submit", formValues);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        py: 6,
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 480,
          p: 4,
          borderRadius: 4,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          Inscription
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Crée ton compte BAZARDIM pour commencer.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <TextField
              label="Nom"
              name="name"
              fullWidth
              required
              value={formValues.name}
              onChange={handleChange}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              fullWidth
              required
              value={formValues.email}
              onChange={handleChange}
            />
            <TextField
              label="Mot de passe"
              name="password"
              type="password"
              fullWidth
              required
              value={formValues.password}
              onChange={handleChange}
            />
            <TextField
              label="Confirme ton mot de passe"
              name="confirmPassword"
              type="password"
              fullWidth
              required
              value={formValues.confirmPassword}
              onChange={handleChange}
            />
            <Button type="submit" variant="contained" size="large" fullWidth>
              S&apos;inscrire
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

