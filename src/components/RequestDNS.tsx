"use client";

import { useState, useEffect } from 'react';
import { Typography, Button, Card, CardContent, Alert } from '@mui/material';
import axios from 'axios';
import DNSRecord from './DNSRecord';
import AddedDNSRecord from './AddedDNSRecord';
import styles from '../styles/DNSRecord.module.css';

interface Domain {
  request_domain_id: number;
  fqdn: string;
}

interface DNSRecordData {
  type: string;
  ttl?: string;
  value?: string;
  priority?: string;
  m_name?: string;
  r_name?: string;
  serial?: string;
  refresh?: string;
  retry?: string;
  expire?: string;
  min_ttl?: string;
  flag?: string;
  tag?: string;
  service?: string;
  weight?: string;
  port?: string;
  target?: string;
  content?: string;  // Added for the "other" DNS type
}

interface RequestDNSProps {
  requestData: { id: string, token: string };
  contactInfo: any;
  onSuccess: () => void; // Added callback prop
}

const RequestDNS: React.FC<RequestDNSProps> = ({ requestData, contactInfo, onSuccess }) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [dnsRecords, setDnsRecords] = useState<{ [key: number]: DNSRecordData[] }>({});
  const [addingDomainId, setAddingDomainId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Added state for error message

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await axios.post('/api/request/get-domains', { requestToken: requestData.token });
        if (response.data.success) {
          setDomains(response.data.data);
          const initialRecords = response.data.data.reduce((acc: any, domain: any) => {
            acc[domain.request_domain_id] = [];
            return acc;
          }, {});
          setDnsRecords(initialRecords);
        }
      } catch (error) {
        console.error('Error fetching domains:', error);
      }
    };

    fetchDomains();
  }, [requestData.token]);

  const handleAddRecord = (domainId: number, newRecord: DNSRecordData) => {
    const isValid = newRecord.type && (newRecord.value || newRecord.target || newRecord.service || newRecord.content);
    if (!isValid) {
      setErrorMessage('DNS record is missing required fields');
      return;
    }

    setDnsRecords({
      ...dnsRecords,
      [domainId]: [...dnsRecords[domainId], newRecord]
    });
    setAddingDomainId(null);
  };

  const handleDeleteRecord = (domainId: number, index: number) => {
    const newRecords = dnsRecords[domainId].filter((_, i) => i !== index);
    setDnsRecords({
      ...dnsRecords,
      [domainId]: newRecords
    });
  };

  const handleSubmitAll = async () => {
    // Check if each domain has at least one DNS record
    const missingRecords = domains.some(domain => dnsRecords[domain.request_domain_id].length === 0);

    if (missingRecords) {
      setErrorMessage('Each domain must have at least one DNS record.');
      return;
    }

    try {
      const payload = {
        request_token: requestData.token,
        dns_records: Object.keys(dnsRecords).flatMap(domainId =>
          dnsRecords[Number(domainId)].map(record => ({
            type: record.type,
            request_domain_id: Number(domainId),
            values: {
              ttl: record.ttl,
              value: record.value,
              priority: record.priority,
              m_name: record.m_name,
              r_name: record.r_name,
              serial: record.serial,
              refresh: record.refresh,
              retry: record.retry,
              expire: record.expire,
              min_ttl: record.min_ttl,
              flag: record.flag,
              tag: record.tag,
              service: record.service,
              weight: record.weight,
              port: record.port,
              target: record.target,
              content: record.content // Include content field for "other" type
            }
          }))
        )
      };
      const response = await axios.post('/api/request/add-dns', payload);
      if (response.data.success) {
        onSuccess(); // Call the success callback
      } else {
        setErrorMessage(response.data.msg); 
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.msg) {
        setErrorMessage(error.response.data.msg);
      } else {
        console.error('Error submitting DNS records:', error);
        setErrorMessage('An error occurred while submitting DNS records');
      }
    }
  };
  
  return (
    <div className={styles.container}>
      <div>
        <Typography variant="h5" className={styles.title}>Add DNS Records</Typography>
        {errorMessage && (
          <Alert severity="error" className={styles.gap}>{errorMessage}</Alert> // Apply the gap class here
        )}
        {domains.map(domain => (
          <Card key={domain.request_domain_id} className={styles.domainCard}>
            <CardContent className={styles.cardContent}>
              <div className={styles.domainHeader}>
                <Typography variant="h6" className={styles.fqdn}>{domain.fqdn}</Typography>
                <Button 
                  variant="outlined" 
                  style={{ borderColor: 'black', color: 'black' }} 
                  onClick={() => setAddingDomainId(domain.request_domain_id)}
                >
                  + DNS Record
                </Button>
              </div>
              <div className={styles.recordsSection}>
                {dnsRecords[domain.request_domain_id].map((record, index) => (
                  <AddedDNSRecord 
                    key={index} 
                    record={record} 
                    onDelete={() => handleDeleteRecord(domain.request_domain_id, index)} 
                  />
                ))}
                {addingDomainId === domain.request_domain_id && (
                  <DNSRecord 
                    domainId={domain.request_domain_id}
                    onAdd={(newRecord) => handleAddRecord(domain.request_domain_id, newRecord)}
                    onCancel={() => setAddingDomainId(null)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className={styles.addButton}>
        <Button variant="contained" onClick={handleSubmitAll}>Proceed</Button>
      </div>
    </div>
  );
};

export default RequestDNS;
