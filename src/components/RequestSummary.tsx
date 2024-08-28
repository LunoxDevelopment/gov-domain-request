import { Typography, Grid, Paper, List, ListItem, ListItemText } from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import styles from '@/styles/RequestProcess.module.css';

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
}

interface RequestSummaryProps {
  summaryData: any;
}

const RequestSummary: React.FC<RequestSummaryProps> = ({ summaryData }) => {
  const renderGrid = (data: { [key: string]: any }) => (
    <Paper className={styles.tableContainer}>
      {Object.entries(data).map(([key, value]) => (
        value && (
          <Grid container key={key} spacing={0} className={styles.gridContainer}>
            <Grid item xs={4} className={`${styles.gridItem} ${styles.smallFont}`}>
              <Typography variant="body2"><strong>{key}</strong></Typography>
            </Grid>
            <Grid item xs={8} className={`${styles.gridItem} ${styles.smallFont}`}>
              <Typography variant="body2">{value}</Typography>
            </Grid>
          </Grid>
        )
      ))}
    </Paper>
  );

  const renderUserSection = (title: string, user: any, extraData: { [key: string]: any } = {}) => (
    <div style={{ marginBottom: '10px' }}>
      <Typography variant="h4" className={styles.smallFont} style={{ marginTop: '10px' }}>{title}</Typography>
      {renderGrid({
        'Full Name': user.full_name,
        'NIC': user.nic,
        'Mobile': user.mobile,
        'Email': user.email,
        'Designation': user.designation,
        ...extraData,
      })}
    </div>
  );

  const renderDomainsTable = (domains: any[]) => (
    <Paper className={styles.tableContainer}>
      <Grid container className={styles.gridContainer}>
        <Grid item xs={3} className={`${styles.gridItem} ${styles.smallFont}`}>
          <Typography variant="body2"><strong>Domain</strong></Typography>
        </Grid>
        <Grid item xs={8} className={`${styles.gridItem} ${styles.smallFont}`}>
          <Typography variant="body2"><strong>Reason</strong></Typography>
        </Grid>
        <Grid item xs={1} className={`${styles.gridItem} ${styles.smallFont} ${styles.centered}`}>
          <Typography variant="body2"><strong>WWW</strong></Typography>
        </Grid>
      </Grid>
      {domains.map((domain: any) => (
        <div key={domain.fqdn}>
          <Grid container spacing={0} className={styles.gridContainer}>
            <Grid item xs={3} className={`${styles.gridItem} ${styles.smallFont}`}>
              <Typography variant="body2">{domain.fqdn}</Typography>
            </Grid>
            <Grid item xs={8} className={`${styles.gridItem} ${styles.smallFont}`}>
              <Typography variant="body2">{domain.reason}</Typography>
            </Grid>
            <Grid item xs={1} className={`${styles.gridItem} ${styles.iconCell} ${styles.smallFont}`}>
              {domain.include_www ? <Check fontSize="small" /> : <Close fontSize="small" />}
            </Grid>
          </Grid>
        </div>
      ))}
    </Paper>
  );

  const renderDnsRecords = (records: DNSRecordData[]) => (
    <Paper className={styles.tableContainer}>
      {records.map((record, index) => (
        <Grid container key={index} spacing={0} className={styles.gridContainer}>
          <Grid item xs={4} className={`${styles.gridItem} ${styles.smallFont} ${styles.centered}`}>
            <Typography variant="body2"><strong>{record.type} Record</strong></Typography>
          </Grid>
          <Grid item xs={8} className={`${styles.gridItem} ${styles.smallFont}`}>
            <List>
              {Object.entries(record)
                .filter(([key]) => key !== 'type_record_id' && key !== 'dns_record_id') // Exclude these keys
                .map(([key, value]) => (
                  value && key !== 'type' && (
                    <ListItem key={key} className={styles.listItem}>
                      <ListItemText primary={`${key.replace('_', ' ')} - ${value}`} className={styles.listItemText} />
                    </ListItem>
                  )
                ))}
            </List>
          </Grid>
        </Grid>
      ))}
    </Paper>
  );
  

  return (
    <div>
      <Typography variant="h3" className={styles.smallFont}>Organization Information</Typography>
      {renderGrid({
        'Name': summaryData.organization_head.full_name,
        'Designation': summaryData.organization_head.designation,
      })}

      <Typography variant="h3" className={styles.smallFont} style={{ marginTop: '10px' }}>Domains</Typography>
      {renderDomainsTable(summaryData.requested_domains)}

      <Typography variant="h3" className={styles.smallFont} style={{ marginTop: '10px' }}>Contact Information</Typography>
      {renderUserSection('Administrator', summaryData.administrator)}
      {renderUserSection('Technical Contact', summaryData.technical_contact)}
      {renderUserSection('Content Developer', summaryData.content_developer)}
      {renderUserSection('Hosting Coordinator', summaryData.hosting_coordinator, { 'Hosting Place': summaryData.hosting_provider })}

      <Typography variant="h3" className={styles.smallFont} style={{ marginTop: '10px' }}>DNS Records</Typography>
      {summaryData.requested_domains.map((domain: any) => (
        <div key={domain.fqdn}>
          <Typography variant="h4" className={styles.smallFont} style={{ marginTop: '5px' }}>{domain.fqdn}</Typography>
          {renderDnsRecords(domain.dns_records)}
        </div>
      ))}
    </div>
  );
};

export default RequestSummary;
