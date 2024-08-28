"use client"; // Ensure this component is a Client Component

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Use `next/navigation` instead of `next/router`
import { Container, Typography, TextField, Button } from '@mui/material';
import Image from 'next/image'; // Make sure to import Image from 'next/image'

const UploadFormInputPage: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const router = useRouter();

  const handleTokenSubmit = () => {
    if (token) {
      router.push(`/domain/upload-form/${token}`);
    }
  };

  return (
    <Container style={{ marginTop: '20px', position: 'relative' }}>
      {/* Powered by section */}
      <div className="fixed top-0 right-0 m-4">
        <a
          className="flex place-items-center gap-2"
          href="https://icta.lk/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <Image
            src="/icta.jpg"
            alt="ICTA Logo"
            width={200} // Adjust width as needed
            height={86} // Calculated from original ratio (3833 x 1648)
            priority
          />
        </a>
      </div>

      {/* Form Content */}
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
