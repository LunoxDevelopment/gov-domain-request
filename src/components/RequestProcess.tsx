"use client";

import { useState, useEffect } from 'react';
import { Typography, Button, LinearProgress } from '@mui/material';
import RequestSummary from './RequestSummary';
import RequestForms from './RequestForms';
import styles from '@/styles/RequestProcess.module.css';

interface RequestProcessProps {
  requestData: { id: string; token: string };
  onFormsGenerated: () => void;
}

const RequestProcess: React.FC<RequestProcessProps> = ({ requestData, onFormsGenerated }) => {
  const [view, setView] = useState<'summary' | 'forms'>('summary');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await fetch(`/api/request/get-summary?requestToken=${requestData.token}`);
      const data = await response.json();
      if (data.success) {
        setSummaryData(data.data);
      }
    };

    fetchSummary();
  }, [requestData.token]);

  const handleGenerateForms = async () => {
    setLoading(true);
    const response = await fetch('/api/request/generate-forms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requestToken: requestData.token }),
    });
    const data = await response.json();
    setLoading(false);

    if (data.success) {
      // Trigger download for the forms
      const link1 = document.createElement('a');
      link1.href = data.data.request_form_path;
      link1.download = 'Request_Form.pdf';
      link1.click();

      const link2 = document.createElement('a');
      link2.href = data.data.cover_letter_path;
      link2.download = 'Cover_Letter.pdf';
      link2.click();

      setView('forms');
      onFormsGenerated();
    } else {
      console.error(data.msg);
    }
  };

  return (
    <div>
      {view === 'summary' && summaryData && !loading && (
        <>
          <RequestSummary summaryData={summaryData} />
          <Button variant="contained" color="primary" onClick={handleGenerateForms} disabled={loading}>
            {loading ? 'Generating Forms...' : 'Generate Forms'}
          </Button>
        </>
      )}

      {loading && (
        <div style={{ marginTop: '20px', width: '100%' }}>
          <LinearProgress />
        </div>
      )}

      {view === 'forms' && (
        <RequestForms requestData={requestData} />
      )}
    </div>
  );
};

export default RequestProcess;
