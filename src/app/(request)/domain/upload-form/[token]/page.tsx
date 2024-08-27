"use client"; // Ensure this component is a Client Component

import UploadDomainForms from '@/components/UploadDomainForms';
import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

interface UploadFormPageProps {
  params: { token: string };
}

const UploadFormPage: React.FC<UploadFormPageProps> = ({ params }) => {
  const { token } = params;
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await axios.post('/api/request/validate-token', { token });
        if (response.data.success) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          setErrorMessage('Invalid or Expired token, Please re-check your token and try again.');
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 400) {
          setIsValidToken(false);
          setErrorMessage('Invalid or Expired token, Please re-check your token and try again.');
        } else {
          setIsValidToken(false);
          setErrorMessage('An error occurred while validating the token. Please try again later.');
        }
      }
    };

    validateToken();
  }, [token]);

  if (isValidToken === null) {
    return (
      <Container>
        <CircularProgress />
        <Typography variant="h6" style={{ marginTop: 20 }}>
          Validating token...
        </Typography>
      </Container>
    );
  }

  if (!isValidToken) {
    return (
      <Container>
        <Typography variant="h6" color="error">
          {errorMessage}
        </Typography>
      </Container>
    );
  }

  return (
    <Container>
      <br />
      <UploadDomainForms token={token} />
      <br />
      <br />
    </Container>
  );
};

export default UploadFormPage;
