import { Card, CardContent, IconButton, Typography, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import styles from '../styles/DNSRecord.module.css';

interface AddedDNSRecordProps {
  record: {
    type: string;
    ttl?: string; // Make ttl optional
    value?: string; // Make value optional
    content?: string; // Add content field for "other" type
    [key: string]: any;
  };
  onDelete: () => void;
}

const recordTypeDisplayName: { [key: string]: string } = {
  'a': 'A Record',
  'aaaa': 'AAAA Record',
  'cname': 'CNAME Record',
  'txt': 'TXT Record',
  'ptr': 'PTR Record',
  'ns': 'NS Record',
  'mx': 'MX Record',
  'soa': 'SOA Record',
  'cca': 'CCA Record',
  'srv': 'SRV Record',
  'other': 'Other Record' // Add display name for "other" type
};

const AddedDNSRecord: React.FC<AddedDNSRecordProps> = ({ record, onDelete }) => {
  return (
    <Card className={styles.addedRecord}>
      <CardContent className={styles.cardContent}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2"><strong>{recordTypeDisplayName[record.type.toLowerCase()]}</strong></Typography>
            {record.value && <Typography variant="body2">Value: {record.value}</Typography>}
            {record.ttl && <Typography variant="body2">TTL: {record.ttl}</Typography>}
            {record.priority && <Typography variant="body2">Priority: {record.priority}</Typography>}
            {record.m_name && <Typography variant="body2">MName: {record.m_name}</Typography>}
            {record.r_name && <Typography variant="body2">RName: {record.r_name}</Typography>}
            {record.serial && <Typography variant="body2">Serial: {record.serial}</Typography>}
            {record.refresh && <Typography variant="body2">Refresh: {record.refresh}</Typography>}
            {record.retry && <Typography variant="body2">Retry: {record.retry}</Typography>}
            {record.expire && <Typography variant="body2">Expire: {record.expire}</Typography>}
            {record.min_ttl && <Typography variant="body2">Min TTL: {record.min_ttl}</Typography>}
            {record.flag && <Typography variant="body2">Flag: {record.flag}</Typography>}
            {record.tag && <Typography variant="body2">Tag: {record.tag}</Typography>}
            {record.service && <Typography variant="body2">Service: {record.service}</Typography>}
            {record.weight && <Typography variant="body2">Weight: {record.weight}</Typography>}
            {record.port && <Typography variant="body2">Port: {record.port}</Typography>}
            {record.target && <Typography variant="body2">Target: {record.target}</Typography>}
            {record.content && <Typography variant="body2">Content: {record.content}</Typography>} {/* Display content for "other" type */}
          </Box>
          <IconButton className={styles.deleteIcon} onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AddedDNSRecord;
