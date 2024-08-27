"use client"; // Ensure client-side rendering

import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Card, CardContent, Grid, Alert, LinearProgress, TextField } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';
import { styled } from '@mui/system';
import { Theme } from '@mui/material/styles';

interface UploadDomainFormsProps {
  token?: string;
}

const StyledCard = styled(Card)(({ theme }) => {
  const typedTheme = theme as Theme;
  return {
    boxShadow: 'none',
    transition: 'box-shadow 0.3s ease-in-out',
    height: '100%', // Ensures the card takes full height of the grid item
    backgroundColor: 'lightblue', // Default background color
    '&.uploading': {
      boxShadow: typedTheme.shadows ? typedTheme.shadows[5] : '0px 4px 6px rgba(0, 0, 0, 0.1)', // Fallback value
    },
    '&.uploaded': {
      backgroundColor: typedTheme.palette.success ? typedTheme.palette.success.light : '#d0f0c0', // Fallback value
      color: typedTheme.palette.success ? typedTheme.palette.success.contrastText : '#000', // Fallback value
    },
  };
});

const UploadDomainForms: React.FC<UploadDomainFormsProps> = ({ token: initialToken }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [token, setToken] = useState<string | null>(initialToken || null);
  const [coverLetter, setCoverLetter] = useState<File | null>(null);
  const [requestForm, setRequestForm] = useState<File | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(initialToken ? true : null);
  const [uploading, setUploading] = useState<{ coverLetter: boolean; requestForm: boolean }>({
    coverLetter: false,
    requestForm: false,
  });
  const [progress, setProgress] = useState<{ coverLetter: number; requestForm: number }>({
    coverLetter: 0,
    requestForm: 0,
  });
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      setIsValidToken(true);
    }
  }, [initialToken]);

  const handleFileUpload = useCallback(async (file: File, type: 'cover-letter' | 'request-form') => {
    if (file && token) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('token', token);

      try {
        setUploading((prevState) => ({ ...prevState, [type]: true }));
        const url = type === 'cover-letter'
          ? '/api/request/upload-cover-letter'
          : '/api/request/upload-request-form';

        await axios.post(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress((prevState) => ({ ...prevState, [type]: percentCompleted }));
            }
          },
        });

        type === 'cover-letter' ? setCoverLetter(file) : setRequestForm(file);
        setAlert({ type: 'success', message: `${file.name} uploaded successfully.` });
      } catch (error) {
        setAlert({ type: 'error', message: `Error uploading file: ${file.name}` });
      } finally {
        setUploading((prevState) => ({ ...prevState, [type]: false }));
      }
    }
  }, [token]);

  const handleCompleteSubmission = async () => {
    if (token && isMounted) {
      try {
        await axios.post('/api/request/complete-submission', { request_token: token });
        setAlert({ type: 'success', message: 'Submission completed successfully.' });
        setTimeout(() => {
          window.location.href = '/'; // Use window.location.href to redirect to the home page
        }, 1500); // Optional delay to show the success message
      } catch (error) {
        setAlert({ type: 'error', message: 'Error completing submission.' });
      }
    }
  };

  const handleTokenValidation = async () => {
    if (token) {
      try {
        const response = await axios.post('/api/request/validate-token', { token });
        setIsValidToken(response.data.success);
        if (!response.data.success) {
          setAlert({ type: 'error', message: 'Invalid token. Please try again.' });
        }
      } catch (error) {
        setIsValidToken(false);
        setAlert({ type: 'error', message: 'Invalid token. Please try again.' });
      }
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], type: 'cover-letter' | 'request-form') => {
    const file = acceptedFiles[0];
    if (file) {
      handleFileUpload(file, type);
    }
  }, [handleFileUpload]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'cover-letter' | 'request-form') => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      handleFileUpload(file, type);
    }
  };

  const handleDownload = async (type: 'cover_letter' | 'request_form') => {
    if (!token) {
      setAlert({ type: 'error', message: 'Token is required to download files.' });
      return;
    }

    try {
      const response = await axios.get(`/api/request/download-form`, {
        params: { requestToken: token, type },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', type === 'cover_letter' ? 'Cover_Letter.pdf' : 'Request_Form.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to download the file.' });
    }
  };

  if (!isMounted || isValidToken === null || isValidToken === false) {
    return (
      <Card variant="outlined" style={{ marginTop: 20 }}>
        <CardContent>
          <Typography variant="h5">Enter Request Token</Typography>
          <TextField
            label="Token"
            variant="outlined"
            fullWidth
            value={token || ''}
            onChange={(e) => setToken(e.target.value)}
            style={{ marginTop: 10 }}
          />
          <Button variant="contained" onClick={handleTokenValidation} style={{ marginTop: 10 }}>
            Validate Token
          </Button>
          {isValidToken === false && (
            <Typography variant="body2" color="error" style={{ marginTop: 10 }}>
              Invalid token. Please try again.
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {alert && <Alert severity={alert.type}>{alert.message}</Alert>}
      <Grid container spacing={2} style={{ marginTop: 20 }}>
        {/* Download Cover Letter */}
        <Grid item xs={12} sm={6}>
          <StyledCard style={{ backgroundColor: 'lightskyblue' }} variant="outlined">
            <CardContent>
              <Typography variant="h5">Download Cover Letter</Typography>
              <Typography variant="body1" style={{ margin: '10px 0' }}>
                Click the button below to download the Cover Letter.
              </Typography>
              <Button variant="contained" onClick={() => handleDownload('cover_letter')} startIcon={<DownloadIcon />}>
                Download Cover Letter
              </Button>
            </CardContent>
          </StyledCard>
        </Grid>
        
        {/* Download Request Form */}
        <Grid item xs={12} sm={6}>
          <StyledCard style={{ backgroundColor: 'lightskyblue' }} variant="outlined">
            <CardContent>
              <Typography variant="h5">Download Request Form</Typography>
              <Typography variant="body1" style={{ margin: '10px 0' }}>
                Click the button below to download the Request Form.
              </Typography>
              <Button variant="contained" onClick={() => handleDownload('request_form')} startIcon={<DownloadIcon />}>
                Download Request Form
              </Button>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Upload Boxes */}
        <Grid item xs={12} sm={6}>
          <StyledCard 
            variant="outlined" 
            className={uploading.coverLetter ? 'uploading' : coverLetter ? 'uploaded' : ''}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'cover-letter')}
          >
            <CardContent>
              <Typography variant="h5">Upload Cover Letter</Typography>
              <Typography variant="body1" style={{ margin: '10px 0' }}>
                Please upload the cover letter for your domain request.
              </Typography>
              <input
                accept=".pdf,image/*"
                style={{ display: 'none' }}
                id="upload-cover-letter"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file, 'cover-letter');
                  }
                }}
                disabled={!!coverLetter}
              />
              <label htmlFor="upload-cover-letter">
                <Button variant="contained" component="span" startIcon={<UploadFileIcon />} disabled={!!coverLetter}>
                  {coverLetter ? 'Uploaded' : 'Upload Cover Letter'}
                </Button>
              </label>
              {uploading.coverLetter && <LinearProgress variant="determinate" value={progress.coverLetter} />}
              {coverLetter && (
                <Typography variant="body2" style={{ marginTop: 10 }}>
                  {coverLetter.name}
                </Typography>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6}>
          <StyledCard 
            variant="outlined" 
            className={uploading.requestForm ? 'uploading' : requestForm ? 'uploaded' : ''}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'request-form')}
          >
            <CardContent>
              <Typography variant="h5">Upload Request Form</Typography>
              <Typography variant="body1" style={{ margin: '10px 0' }}>
                Please upload the request form for your domain request.
              </Typography>
              <input
                accept=".pdf,image/*"
                style={{ display: 'none' }}
                id="upload-request-form"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file, 'request-form');
                  }
                }}
                disabled={!!requestForm}
              />
              <label htmlFor="upload-request-form">
                <Button variant="contained" component="span" startIcon={<UploadFileIcon />} disabled={!!requestForm}>
                  {requestForm ? 'Uploaded' : 'Upload Request Form'}
                </Button>
              </label>
              {uploading.requestForm && <LinearProgress variant="determinate" value={progress.requestForm} />}
              {requestForm && (
                <Typography variant="body2" style={{ marginTop: 10 }}>
                  {requestForm.name}
                </Typography>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
      <Button variant="contained" color="primary" onClick={handleCompleteSubmission} style={{ marginTop: 20 }}>
        Complete Submission
      </Button>
    </div>
  );
};

export default UploadDomainForms;
