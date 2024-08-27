import React, { useState } from 'react';
import { TextField, Button, Typography, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Select, MenuItem, FormControl, Switch } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import styles from '@/styles/RequestAddDomain.module.css';

interface AddDomainsProps {
  organization: any;
  requestData: { id: string, token: string };
  onDomainsSubmit: (domains: string[]) => void;
  onProceed: () => void;
}

const AddDomains: React.FC<AddDomainsProps> = ({ organization, requestData, onDomainsSubmit, onProceed }) => {
  const [domains, setDomains] = useState<{ domain: string, reason: string, type: string, isTypeOther: boolean, includeWWW: boolean, typeTouched: boolean }[]>([{ domain: '', reason: '', type: '', isTypeOther: false, includeWWW: false, typeTouched: false }]);
  const [addedDomains, setAddedDomains] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ domain: boolean, reason: boolean, type: boolean }[]>([{ domain: false, reason: false, type: false }]);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleDomainChange = (index: number, field: string, value: string | boolean) => {
    const newDomains = [...domains];
    newDomains[index] = { ...newDomains[index], [field]: value };
    setDomains(newDomains);

    const newErrors = [...errors];
    newErrors[index] = { ...newErrors[index], [field]: !value };
    setErrors(newErrors);

    console.log(`Updated domains[${index}]:`, newDomains[index]);
  };

  const handleTypeChange = (index: number, value: string) => {
    const newDomains = [...domains];
    newDomains[index].type = value === 'Other' ? '' : value;
    newDomains[index].isTypeOther = value === 'Other';
    newDomains[index].typeTouched = value !== 'Other';
    setDomains(newDomains);

    const newErrors = [...errors];
    newErrors[index] = { ...newErrors[index], type: value === 'Other' ? false : !value };
    setErrors(newErrors);

    console.log(`Type changed to: ${value}`);
  };

  const addDomainField = () => {
    setDomains([...domains, { domain: '', reason: '', type: '', isTypeOther: false, includeWWW: false, typeTouched: false }]);
    setErrors([...errors, { domain: false, reason: false, type: false }]);
  };

  const removeDomainField = (index: number) => {
    const newDomains = domains.filter((_, i) => i !== index);
    setDomains(newDomains);

    const newErrors = errors.filter((_, i) => i !== index);
    setErrors(newErrors);
  };

  const handleSubmit = async () => {
    setSubmissionError(null);
    let valid = true;
    const newErrors = domains.map(({ domain, reason, type }) => {
      const domainError = !domain;
      const reasonError = !reason;
      const typeError = !type;
      if (domainError || reasonError || typeError) valid = false;
      return { domain: domainError, reason: reasonError, type: typeError };
    });
    setErrors(newErrors);

    if (!valid) {
      setSubmissionError('Please fill out all required fields.');
      return;
    }

    const submittedDomains: string[] = [];
    for (const { domain, reason, type, includeWWW } of domains) {
      const fqdn = `${domain}.gov.lk`;

      try {
        const response = await fetch('/api/request/add-domain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId: requestData.id,
            requestToken: requestData.token,
            fqdn,
            reason,
            type,
            include_www: includeWWW,
          }),
        });

        const result = await response.json();
        if (result.success) {
          console.log(`Domain ${fqdn} added successfully`);
          submittedDomains.push(fqdn);
        } else {
          console.error(`Failed to add domain ${fqdn}: ${result.msg}`);
          setSubmissionError(`Failed to add domain ${fqdn}: ${result.msg}`);
          return;
        }
      } catch (error) {
        console.error(`Error adding domain ${fqdn}:`, error);
        setSubmissionError(`Error adding domain ${fqdn}`);
        return;
      }
    }
    setAddedDomains(submittedDomains);
    onDomainsSubmit(submittedDomains);
    onProceed();
  };

  return (
    <div className={styles.container}>
      <Typography variant="h6">Add Domains for {organization?.name}</Typography>
      <Table className={styles.table}>
        <TableHead>
          <TableRow>
            <TableCell className={styles.tableCell}>Domain</TableCell>
            <TableCell className={styles.tableCell}>Reason</TableCell>
            <TableCell className={styles.tableCell}>Type</TableCell>
            <TableCell className={styles.tableCell}>Include WWW</TableCell>
            <TableCell className={styles.tableCell}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {domains.map((domainData, index) => (
            <TableRow key={index}>
              <TableCell className={styles.tableCell}>
                <div className={styles.domainContainer}>
                  <TextField
                    label="Sub Domain"
                    value={domainData.domain}
                    onChange={(e) => handleDomainChange(index, 'domain', e.target.value)}
                    fullWidth
                    required
                    error={errors[index].domain}
                  />
                  <span className={styles.fixedSuffix}>.gov.lk</span>
                </div>
              </TableCell>
              <TableCell className={styles.tableCell}>
                <TextField
                  label="Reason"
                  value={domainData.reason}
                  onChange={(e) => handleDomainChange(index, 'reason', e.target.value)}
                  fullWidth
                  required
                  error={errors[index].reason}
                />
              </TableCell>
              <TableCell className={styles.tableCell}>
                {domainData.isTypeOther ? (
                  <TextField
                    label="Type"
                    value={domainData.type}
                    onChange={(e) => handleDomainChange(index, 'type', e.target.value)}
                    fullWidth
                    required
                    error={errors[index].type && domainData.typeTouched}
                    onBlur={() => {
                      const newErrors = [...errors];
                      newErrors[index] = { ...newErrors[index], type: !domainData.type };
                      setErrors(newErrors);
                      const newDomains = [...domains];
                      newDomains[index].typeTouched = true;
                      setDomains(newDomains);
                    }}
                  />
                ) : (
                  <FormControl fullWidth required error={errors[index].type}>
                    <Select
                      value={domainData.type}
                      displayEmpty
                      onChange={(e) => handleTypeChange(index, e.target.value as string)}
                    >
                      <MenuItem value="" disabled>-- Select --</MenuItem>
                      <MenuItem value="Domain Registration">Domain Registration</MenuItem>
                      <MenuItem value="DNS Change">DNS Change</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </TableCell>
              <TableCell className={styles.tableCell} style={{ textAlign: 'center' }}>
                <Switch
                  checked={domainData.includeWWW}
                  onChange={(e) => handleDomainChange(index, 'includeWWW', e.target.checked)}
                />
              </TableCell>
              <TableCell className={styles.tableCell} style={{ textAlign: 'center' }}>
                {index > 0 && (
                  <IconButton onClick={() => removeDomainField(index)}>
                    <CloseIcon />
                  </IconButton>
                )}
                {index === domains.length - 1 && (
                  <IconButton onClick={addDomainField}>
                    <AddIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {submissionError && (
        <Typography variant="body1" color="error" style={{ marginTop: '10px' }}>
          {submissionError}
        </Typography>
      )}
      <Button variant="contained" color="primary" onClick={handleSubmit} className={styles.submitButton}>
        Proceed
      </Button>
    </div>
  );
};

export default AddDomains;
