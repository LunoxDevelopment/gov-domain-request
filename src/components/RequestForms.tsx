import React from 'react';
import { Typography, Card, CardContent, IconButton, TextField } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UploadDomainForms from './UploadDomainForms';
import { styled, useTheme } from '@mui/system';

interface RequestFormsProps {
  requestData: { id: string, token: string } | null;
}

const StyledCard = styled(Card)(({ theme }) => ({
  marginTop: 20,
  backgroundColor: theme?.palette?.info?.light || '#d0f0fd', // Fallback color
  borderColor: theme?.palette?.info?.main || '#90caf9', // Fallback color
}));

const RequestForms: React.FC<RequestFormsProps> = ({ requestData }) => {
  const theme = useTheme();

  if (!requestData) return null;

  const handleCopyClick = () => {
    navigator.clipboard.writeText(`https://registrar.gov.lk/domain/upload-form/${requestData.token}`);
  };

  return (
    <div>
      <StyledCard variant="outlined" theme={theme}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            You can visit the Forms Upload page again by the URL
          </Typography>
          <TextField
            variant="outlined"
            value={`https://registrar.gov.lk/domain/upload-form/${requestData.token}`}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton onClick={handleCopyClick}>
                  <ContentCopyIcon />
                </IconButton>
              ),
            }}
            fullWidth
          />
        </CardContent>
      </StyledCard>
      <UploadDomainForms token={requestData.token} />
    </div>
  );
};

export default RequestForms;
