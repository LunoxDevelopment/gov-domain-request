"use client"; // Ensure this component is a Client Component

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Use `next/navigation` instead of `next/router`
import { Container, Typography, TextField, Button } from '@mui/material';

const UploadFormInputPage: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const router = useRouter();

  const handleTokenSubmit = () => {
    if (token) {
      router.push(`/domain/upload-form/${token}`);
    }
  };

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Enter Request Token
      </Typography>
      <TextField
        label="Token"
        variant="outlined"
        fullWidth
        value={token}
        onChange={(e) => setToken(e.target.value)}
        style={{ marginTop: 10 }}
      />
      <Button variant="contained" onClick={handleTokenSubmit} style={{ marginTop: 10 }}>
        Submit
      </Button>
    </Container>
  );
};

export default UploadFormInputPage;
