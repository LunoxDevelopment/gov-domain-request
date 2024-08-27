import { useState, useEffect } from 'react';
import { Card, CardContent, CardActions, MenuItem, Select, TextField, Typography, Button, Grid, Tooltip, Alert, Box } from '@mui/material';
import styles from '../styles/DNSRecord.module.css';

interface DNSRecordProps {
  domainId: number;
  onAdd: (newRecord: DNSRecordData) => void;
  onCancel: () => void;
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
  content?: string; // Add content field for "other" type
}

const DNSRecord: React.FC<DNSRecordProps> = ({ domainId, onAdd, onCancel }) => {
  const [record, setRecord] = useState<DNSRecordData>({
    type: '',
    ttl: '',
    value: '',
    priority: '',
    m_name: '',
    r_name: '',
    serial: '',
    refresh: '',
    retry: '',
    expire: '',
    min_ttl: '',
    flag: '',
    tag: '',
    service: '',
    weight: '',
    port: '',
    target: '',
    content: '' // Initialize content for "other" type
  });

  const [warning, setWarning] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (showErrors) {
      setShowErrors(false);
    }
  }, [record]);

  const handleTypeChange = (event: any) => {
    const type = event.target.value;
    setRecord({ type, ttl: '', value: '', priority: '', m_name: '', r_name: '', serial: '', refresh: '', retry: '', expire: '', min_ttl: '', flag: '', tag: '', service: '', weight: '', port: '', target: '', content: '' });
    if (type === 'ns') {
      setWarning('Please note that we usually do not accept NS Records. This request may be denied.');
    } else if (type === 'cname') {
      setWarning('We discourage adding CNAME Records. Please use an alternative record type such as A record if possible. This request may be denied.');
    } else {
      setWarning('');
    }
  };

  const handleTTLChange = (event: any) => {
    setRecord({ ...record, ttl: event.target.value || '' });
  };

  const handleValueChange = (event: any, field: string = 'value') => {
    setRecord({ ...record, [field]: event.target.value || '' });
  };

  const isValidIPv4 = (ip: string) => {
    const regex = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
    return regex.test(ip);
  };

  const isValidIPv6 = (ip: string) => {
    const regex = /(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:))|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6}))|(:((:[0-9a-fA-F]{1,4}){1,7}|:))|(::(ffff(:0{1,4}){0,1}:){0,1}(([0-9]{1,3}\.){3,}[0-9]{1,3}))|(([0-9a-fA-F]{1,4}:){1,4}:(([0-9]{1,3}\.){3,}[0-9]{1,3}))$/;
    return regex.test(ip);
  };

  const handleAddRecord = () => {
    setShowErrors(true);

    // Check if all required fields are filled based on record type
    let missingRequiredFields = false;

    switch (record.type) {
      case 'a':
        if (!record.value || !isValidIPv4(record.value)) {
          setWarning('The value for an A Record must be a valid IPv4 address.');
          missingRequiredFields = true;
        }
        break;
      case 'aaaa':
        if (!record.value || !isValidIPv6(record.value)) {
          setWarning('The value for an AAAA Record must be a valid IPv6 address.');
          missingRequiredFields = true;
        }
        break;
      case 'cname':
      case 'txt':
      case 'ptr':
      case 'ns':
        if (!record.value) {
          setWarning(`The value for a ${record.type.toUpperCase()} Record is required.`);
          missingRequiredFields = true;
        }
        break;
      case 'mx':
        if (!record.value || !record.priority || !/^\d+$/.test(record.priority)) {
          setWarning('Both value and priority for MX Record are required and priority must be a valid integer.');
          missingRequiredFields = true;
        }
        break;
      case 'soa':
        if (!record.m_name || !record.r_name || !record.serial || !record.refresh || !record.retry || !record.expire || !record.min_ttl) {
          setWarning('All fields for SOA Record are required.');
          missingRequiredFields = true;
        }
        break;
      case 'srv':
        if (!record.service || !record.weight || !record.port || !record.target) {
          setWarning('All fields for SRV Record are required.');
          missingRequiredFields = true;
        }
        break;
      case 'cca':
        if (!record.flag || !record.tag || !record.value) {
          setWarning('All fields for CCA Record are required.');
          missingRequiredFields = true;
        }
        break;
      case 'other':
        if (!record.content) {
          setWarning('The content for an Other Record is required.');
          missingRequiredFields = true;
        }
        break;
      default:
        setWarning('Please select a record type.');
        missingRequiredFields = true;
        break;
    }

    if (missingRequiredFields) {
      return;
    }

    if (record.ttl && !/^\d+$/.test(record.ttl)) {
      setWarning('TTL must be a valid integer.');
      return;
    }

    const recordToSubmit: DNSRecordData = { ...record };

    // Remove optional fields if they are empty
    Object.keys(recordToSubmit).forEach(key => {
      if (recordToSubmit[key as keyof DNSRecordData] === '') {
        delete recordToSubmit[key as keyof DNSRecordData];
      }
    });

    onAdd(recordToSubmit);
    setRecord({
      type: '',
      ttl: '',
      value: '',
      priority: '',
      m_name: '',
      r_name: '',
      serial: '',
      refresh: '',
      retry: '',
      expire: '',
      min_ttl: '',
      flag: '',
      tag: '',
      service: '',
      weight: '',
      port: '',
      target: '',
      content: '' // Reset content field
    });
    setShowErrors(false);
    setWarning('');
  };

  const renderFields = () => {
    switch (record.type) {
      case 'a':
        return (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Value"
                value={record.value}
                onChange={(e) => handleValueChange(e)}
                fullWidth
                required
                error={showErrors && (!record.value || !isValidIPv4(record.value))}
                helperText={showErrors && (!record.value || !isValidIPv4(record.value)) ? 'Valid IPv4 address required' : ''}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="TTL"
                value={record.ttl || ''}
                onChange={handleTTLChange}
                fullWidth
                error={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '')}
                helperText={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '') ? 'Valid integer required' : ''}
              />
            </Grid>
          </Grid>
        );
      case 'aaaa':
        return (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Value"
                value={record.value}
                onChange={(e) => handleValueChange(e)}
                fullWidth
                required
                error={showErrors && (!record.value || !isValidIPv6(record.value))}
                helperText={showErrors && (!record.value || !isValidIPv6(record.value)) ? 'Valid IPv6 address required' : ''}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="TTL"
                value={record.ttl || ''}
                onChange={handleTTLChange}
                fullWidth
                error={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '')}
                helperText={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '') ? 'Valid integer required' : ''}
              />
            </Grid>
          </Grid>
        );
      case 'cname':
        return (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Value"
                value={record.value}
                onChange={(e) => handleValueChange(e)}
                fullWidth
                required
                error={showErrors && !record.value}
                helperText={showErrors && !record.value ? 'Value required' : ''}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="TTL"
                value={record.ttl || ''}
                onChange={handleTTLChange}
                fullWidth
                error={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '')}
                helperText={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '') ? 'Valid integer required' : ''}
              />
            </Grid>
          </Grid>
        );
      case 'txt':
        return (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Value"
                value={record.value}
                onChange={(e) => handleValueChange(e)}
                fullWidth
                required
                error={showErrors && !record.value}
                helperText={showErrors && !record.value ? 'Value required' : ''}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="TTL"
                value={record.ttl || ''}
                onChange={handleTTLChange}
                fullWidth
                error={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '')}
                helperText={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '') ? 'Valid integer required' : ''}
              />
            </Grid>
          </Grid>
        );
      case 'ptr':
        return (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Value"
                value={record.value}
                onChange={(e) => handleValueChange(e)}
                fullWidth
                required
                error={showErrors && !record.value}
                helperText={showErrors && !record.value ? 'Value required' : ''}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="TTL"
                value={record.ttl || ''}
                onChange={handleTTLChange}
                fullWidth
                error={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '')}
                helperText={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '') ? 'Valid integer required' : ''}
              />
            </Grid>
          </Grid>
        );
      case 'ns':
        return (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Value"
                value={record.value}
                onChange={(e) => handleValueChange(e)}
                fullWidth
                required
                error={showErrors && !record.value}
                helperText={showErrors && !record.value ? 'Value required' : ''}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="TTL"
                value={record.ttl || ''}
                onChange={handleTTLChange}
                fullWidth
                error={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '')}
                helperText={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '') ? 'Valid integer required' : ''}
              />
            </Grid>
          </Grid>
        );
      case 'mx':
        return (
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="Value"
                value={record.value}
                onChange={(e) => handleValueChange(e)}
                fullWidth
                required
                error={showErrors && !record.value}
                helperText={showErrors && !record.value ? 'Value required' : ''}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Priority"
                value={record.priority || ''}
                onChange={(e) => handleValueChange(e, 'priority')}
                fullWidth
                required
                error={showErrors && (!record.priority || !/^\d+$/.test(record.priority))}
                helperText={showErrors && (!record.priority || !/^\d+$/.test(record.priority)) ? 'Valid integer required' : ''}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="TTL"
                value={record.ttl || ''}
                onChange={handleTTLChange}
                fullWidth
                error={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '')}
                helperText={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '') ? 'Valid integer required' : ''}
              />
            </Grid>
          </Grid>
        );
      case 'soa':
        return (
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="MName"
                value={record.m_name || ''}
                onChange={(e) => handleValueChange(e, 'm_name')}
                fullWidth
                required
                error={showErrors && !record.m_name}
                helperText={showErrors && !record.m_name ? 'MName required' : ''}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="RName"
                value={record.r_name || ''}
                onChange={(e) => handleValueChange(e, 'r_name')}
                fullWidth
                required
                error={showErrors && !record.r_name}
                helperText={showErrors && !record.r_name ? 'RName required' : ''}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Serial"
                value={record.serial || ''}
                onChange={(e) => handleValueChange(e, 'serial')}
                fullWidth
                required
                error={showErrors && !record.serial}
                helperText={showErrors && !record.serial ? 'Serial required' : ''}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Refresh"
                value={record.refresh || ''}
                onChange={(e) => handleValueChange(e, 'refresh')}
                fullWidth
                required
                error={showErrors && !record.refresh}
                helperText={showErrors && !record.refresh ? 'Refresh required' : ''}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Retry"
                value={record.retry || ''}
                onChange={(e) => handleValueChange(e, 'retry')}
                fullWidth
                required
                error={showErrors && !record.retry}
                helperText={showErrors && !record.retry ? 'Retry required' : ''}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Expire"
                value={record.expire || ''}
                onChange={(e) => handleValueChange(e, 'expire')}
                fullWidth
                required
                error={showErrors && !record.expire}
                helperText={showErrors && !record.expire ? 'Expire required' : ''}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Min TTL"
                value={record.min_ttl || ''}
                onChange={(e) => handleValueChange(e, 'min_ttl')}
                fullWidth
                required
                error={showErrors && !record.min_ttl}
                helperText={showErrors && !record.min_ttl ? 'Min TTL required' : ''}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="TTL"
                value={record.ttl || ''}
                onChange={handleTTLChange}
                fullWidth
                error={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '')}
                helperText={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '') ? 'Valid integer required' : ''}
              />
            </Grid>
          </Grid>
        );
      case 'cca':
        return (
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="Flag"
                value={record.flag || ''}
                onChange={(e) => handleValueChange(e, 'flag')}
                fullWidth
                required
                error={showErrors && !record.flag}
                helperText={showErrors && !record.flag ? 'Flag required' : ''}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Tag"
                value={record.tag || ''}
                onChange={(e) => handleValueChange(e, 'tag')}
                fullWidth
                required
                error={showErrors && !record.tag}
                helperText={showErrors && !record.tag ? 'Tag required' : ''}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Value"
                value={record.value || ''}
                onChange={(e) => handleValueChange(e)}
                fullWidth
                required
                error={showErrors && !record.value}
                helperText={showErrors && !record.value ? 'Value required' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="TTL"
                value={record.ttl || ''}
                onChange={handleTTLChange}
                fullWidth
                error={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '')}
                helperText={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '') ? 'Valid integer required' : ''}
              />
            </Grid>
          </Grid>
        );
      case 'srv':
        return (
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <TextField
                label="Service"
                value={record.service || ''}
                onChange={(e) => handleValueChange(e, 'service')}
                fullWidth
                required
                error={showErrors && !record.service}
                helperText={showErrors && !record.service ? 'Service required' : ''}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Weight"
                value={record.weight || ''}
                onChange={(e) => handleValueChange(e, 'weight')}
                fullWidth
                required
                error={showErrors && (!record.weight || !/^\d+$/.test(record.weight))}
                helperText={showErrors && (!record.weight || !/^\d+$/.test(record.weight)) ? 'Valid integer required' : ''}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Port"
                value={record.port || ''}
                onChange={(e) => handleValueChange(e, 'port')}
                fullWidth
                required
                error={showErrors && (!record.port || !/^\d+$/.test(record.port))}
                helperText={showErrors && (!record.port || !/^\d+$/.test(record.port)) ? 'Valid integer required' : ''}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Target"
                value={record.target || ''}
                onChange={(e) => handleValueChange(e, 'target')}
                fullWidth
                required
                error={showErrors && !record.target}
                helperText={showErrors && !record.target ? 'Target required' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="TTL"
                value={record.ttl || ''}
                onChange={handleTTLChange}
                fullWidth
                error={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '')}
                helperText={showErrors && record.ttl !== '' && !/^\d+$/.test(record.ttl || '') ? 'Valid integer required' : ''}
              />
            </Grid>
          </Grid>
        );
      case 'other':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Content"
                value={record.content || ''}
                onChange={(e) => handleValueChange(e, 'content')}
                fullWidth
                required
                error={showErrors && !record.content}
                helperText={showErrors && !record.content ? 'Content required' : ''}
              />
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={styles.dnsRecord}>
      <CardContent className={styles.cardContent}>
        <Box mb={2}>
          {warning && (
            <Box mb={2}>
              <Alert severity="warning">{warning}</Alert>
            </Box>
          )}
          {showErrors && (!record.type || !record.value) && (
            <Box mb={2}>
              <Alert severity="error">Please fill in all required fields.</Alert>
            </Box>
          )}
          <Box mt={2}>
            <Select value={record.type} onChange={handleTypeChange} displayEmpty className={styles.selectType}>
              <MenuItem value="" disabled>Select Record Type</MenuItem>
              <MenuItem value="a">A Record</MenuItem>
              <MenuItem value="aaaa">AAAA Record</MenuItem>
              <MenuItem value="txt">TXT Record</MenuItem>
              <MenuItem value="mx">MX Record</MenuItem>
              <MenuItem value="srv">SRV Record</MenuItem>
              <MenuItem value="other">Other Record</MenuItem>
            </Select>
          </Box>
        </Box>
        {renderFields()}
      </CardContent>

      <CardActions className={styles.actions}>
        <Button variant="contained" onClick={handleAddRecord}>Save</Button>
        <Button variant="outlined" onClick={onCancel}>Cancel</Button>
      </CardActions>
    </Card>
  );
};

export default DNSRecord;
