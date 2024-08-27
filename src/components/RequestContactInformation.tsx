import React, { useState, ChangeEvent } from 'react';
import axios from 'axios';
import {
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import styles from '@/styles/RequestContactInformation.module.css';
import CreateUserModal from './CreateUserModal';

interface RequestContactInformationProps {
  requestData: { id: string; token: string };
  onContactSubmit: (contactInfo: any) => void;
}

interface User {
  id: string;
  fullName: string;
  email?: string;
  mobile?: string;
  nic?: string;
  designation?: string;
}

interface RoleContact {
  id: string | null;
  name: string | null;
}

interface ContactInfo {
  owner: RoleContact;
  administrator: RoleContact;
  technical: RoleContact;
  content: RoleContact;
  hosting: RoleContact;
  hostingProvider: string;
  address: string;
  email: string;
  contactNo: string;
}

const RequestContactInformation: React.FC<RequestContactInformationProps> = ({ requestData, onContactSubmit }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalFields, setModalFields] = useState<{ fullName: boolean }>({ fullName: true });
  const [currentRole, setCurrentRole] = useState<keyof ContactInfo | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    owner: { id: null, name: null },
    administrator: { id: null, name: null },
    technical: { id: null, name: null },
    content: { id: null, name: null },
    hosting: { id: null, name: null },
    hostingProvider: '',
    address: '',
    email: '',
    contactNo: '',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [errors, setErrors] = useState<{ [key in keyof ContactInfo]?: string }>({});

  const handleOpenModal = (role: keyof ContactInfo, title: string, fields: any) => {
    setCurrentRole(role);
    setModalTitle(title);
    setModalFields(fields);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleModalSubmit = (userData: User) => {
    console.log("User added:", userData);
    const newUser = { ...userData, id: userData.id.toString() };
    setUsers((prev) => {
      console.log("Users before adding new user:", prev);
      const updatedUsers = [...prev, newUser];
      console.log("Users after adding new user:", updatedUsers);
      return updatedUsers;
    });
    setModalVisible(false);

    if (currentRole) {
      setContactInfo((prev) => {
        const updatedContactInfo = {
          ...prev,
          [currentRole]: { id: newUser.id, name: newUser.fullName },
        };
        console.log(`ContactInfo after adding ${currentRole}:`, updatedContactInfo);
        return updatedContactInfo;
      });

      if (currentRole === 'administrator') {
        setContactInfo((prev) => {
          const updatedContactInfo = {
            ...prev,
            technical: { id: newUser.id, name: newUser.fullName },
            content: { id: newUser.id, name: newUser.fullName },
            hosting: { id: newUser.id, name: newUser.fullName },
          };
          console.log("ContactInfo after setting administrator:", updatedContactInfo);
          return updatedContactInfo;
        });
      }
    }
  };

  const handleSelectUser = (role: keyof ContactInfo, userId: string | null) => {
    if (userId === 'add-user') {
      handleOpenModal(role, `Add ${role.charAt(0).toUpperCase() + role.slice(1)}`, getFieldsForRole(role));
      return;
    }

    console.log(`User selected for ${role}:`, userId);
    const user = users.find((u) => u.id === userId);
    console.log(`User found for ${role}:`, user);
    setContactInfo((prev) => {
      const updatedContactInfo = {
        ...prev,
        [role]: { id: user?.id || null, name: user?.fullName || null },
      };
      console.log(`ContactInfo after selecting user for ${role}:`, updatedContactInfo);
      return updatedContactInfo;
    });
  };

  const handleSubmit = async () => {
    console.log("Submit button clicked");
    const requiredFields: (keyof ContactInfo)[] = ['owner', 'administrator', 'content', 'hosting', 'address', 'email', 'contactNo', 'hostingProvider'];
    const newErrors: { [key in keyof ContactInfo]?: string } = {};

    requiredFields.forEach((field) => {
      const value = contactInfo[field];
      if (typeof value === 'string') {
        if (!value) {
          newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
        } else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[field] = 'Invalid email format.';
        } else if (field === 'contactNo' && (!/^[0-9]{10}$/.test(value) || !value.startsWith('0'))) {
          newErrors[field] = 'Contact number should start with 0 and be exactly 10 digits.';
        }
      } else if ((value as RoleContact).id === null) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} Contact Person is required.`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      console.log("Validation errors:", newErrors);
      return;
    }

    const payload = {
      request_id: requestData.id,
      owner_user_id: contactInfo.owner.id,
      administrator_user_id: contactInfo.administrator.id,
      technical_user_id: contactInfo.technical.id,
      content_developer_user_id: contactInfo.content.id,
      hosting_coordinator_user_id: contactInfo.hosting.id,
      hosting_place: contactInfo.hostingProvider,
      address: contactInfo.address,
      email: contactInfo.email,
      contact_no: contactInfo.contactNo,
    };

    console.log("Submitting payload:", payload);

    try {
      const response = await axios.post('/api/request/submit-contacts', payload);
      console.log("Response from submit:", response.data);
      onContactSubmit(response.data);
    } catch (error) {
      console.error('Failed to submit contact information:', error);
    }
  };

  const renderUserDropdown = (role: keyof ContactInfo) => {
    const filteredUsers = users.filter(user => user.id !== contactInfo.owner.id);

    const uniqueUsers = Array.from(new Set(filteredUsers.map(user => user.id)))
      .map(id => filteredUsers.find(user => user.id === id));

    return (
      <FormControl fullWidth>
        <Select
          value={(contactInfo[role] as RoleContact).id || ''}
          onChange={(e) => handleSelectUser(role, e.target.value as string)}
          displayEmpty
          error={!!errors[role]}
        >
          <MenuItem value="">
            <em>Select User</em>
          </MenuItem>
          <MenuItem value="add-user">
            <em>Add User</em>
          </MenuItem>
          {uniqueUsers.map((user) => (
            user && (
              <MenuItem key={user.id} value={user.id}>
                {user.fullName}
              </MenuItem>
            )
          ))}
        </Select>
      </FormControl>
    );
  };

  const getFieldsForRole = (role: keyof ContactInfo) => {
    switch (role) {
      case 'owner':
        return { fullName: true, designation: true };
      case 'administrator':
        return { fullName: true, mobile: true, email: true, nic: true, designation: true };
      case 'technical':
        return { fullName: true, mobile: true, email: true, optionalEmployee: true, designation: true };
      case 'content':
      case 'hosting':
        return { fullName: true, mobile: true, email: true, optionalEmployee: true, designation: true };
      default:
        return { fullName: true };
    }
  };

  return (
    <div className={styles.container}>

{     Object.keys(errors).length > 0 && (
        <Alert severity="error">
          {Object.values(errors).map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </Alert>
      )}
      <h3>Organization Information</h3>
      <TableContainer component={Paper} style={{ width: '100%' }}>
        <Table className={styles.table}>
          <TableBody>
            <TableRow>
              <TableCell className={`${styles.tableCell} ${styles.roleLabel}`}>Organization Head</TableCell>
              <TableCell className={styles.tableCell}>
                {contactInfo.owner.id ? (
                  <span>{contactInfo.owner.name}</span>
                ) : (
                  <Button onClick={() => handleOpenModal('owner', 'Add Organization Head', getFieldsForRole('owner'))} className={errors.owner ? styles.errorBorder : ''}>
                    + Add User
                  </Button>
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className={`${styles.tableCell} ${styles.roleLabel}`}>Address</TableCell>
              <TableCell className={styles.tableCell}>
                <TextField
                  label="Address"
                  value={contactInfo.address}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setContactInfo((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))}
                  fullWidth
                  required
                  error={!!errors.address}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className={`${styles.tableCell} ${styles.roleLabel}`}>Email</TableCell>
              <TableCell className={styles.tableCell}>
                <TextField
                  label="Email"
                  value={contactInfo.email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setContactInfo((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))}
                  fullWidth
                  required
                  error={!!errors.email}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className={`${styles.tableCell} ${styles.roleLabel}`}>Contact Number</TableCell>
              <TableCell className={styles.tableCell}>
                <TextField
                  label="Contact Number"
                  value={contactInfo.contactNo}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setContactInfo((prev) => ({
                    ...prev,
                    contactNo: e.target.value,
                  }))}
                  fullWidth
                  required
                  error={!!errors.contactNo}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>



      <h3>Contact Information</h3>
      <TableContainer component={Paper} style={{ width: '100%', marginTop: '20px' }}>
        <Table className={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell className={`${styles.tableHeaderCell} ${styles.roleLabel}`}>Role</TableCell>
              <TableCell className={styles.tableHeaderCell}>User</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell className={`${styles.tableCell} ${styles.roleLabel}`}>Administrator</TableCell>
              <TableCell className={styles.tableCell}>
                {contactInfo.administrator.id ? (
                  <span>{contactInfo.administrator.name}</span>
                ) : (
                  <Button onClick={() => handleOpenModal('administrator', 'Add Administrator', getFieldsForRole('administrator'))} className={errors.administrator ? styles.errorBorder : ''}>
                    + Add User
                  </Button>
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className={`${styles.tableCell} ${styles.roleLabel}`}>Technical Contact</TableCell>
              <TableCell className={styles.tableCell}>
                {contactInfo.technical.id ? (
                  renderUserDropdown('technical')
                ) : (
                  <Button onClick={() => handleOpenModal('technical', 'Add Technical Contact', getFieldsForRole('technical'))}>
                    + Add User
                  </Button>
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className={`${styles.tableCell} ${styles.roleLabel}`}>Content Developer</TableCell>
              <TableCell className={styles.tableCell}>
                {contactInfo.content.id ? (
                  renderUserDropdown('content')
                ) : (
                  <Button onClick={() => handleOpenModal('content', 'Add Content Developer', getFieldsForRole('content'))} className={errors.content ? styles.errorBorder : ''}>
                    + Add User
                  </Button>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <h3>Hosting Information</h3>
      <TableContainer component={Paper} style={{ width: '100%', marginTop: '20px' }}>
        <Table className={styles.table}>
          <TableBody>
            <TableRow>
              <TableCell className={`${styles.tableCell} ${styles.roleLabel}`}>Hosting Provider</TableCell>
              <TableCell className={styles.tableCell}>
                <TextField
                  label="Hosting Provider"
                  value={contactInfo.hostingProvider}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setContactInfo((prev) => ({
                    ...prev,
                    hostingProvider: e.target.value,
                  }))}
                  fullWidth
                  required
                  error={!!errors.hostingProvider}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className={`${styles.tableCell} ${styles.roleLabel}`}>Hosting Coordinator</TableCell>
              <TableCell className={styles.tableCell}>
                {contactInfo.hosting.id ? (
                  renderUserDropdown('hosting')
                ) : (
                  <Button onClick={() => handleOpenModal('hosting', 'Add Hosting Coordinator', getFieldsForRole('hosting'))} className={errors.hosting ? styles.errorBorder : ''}>
                    + Add User
                  </Button>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        className={styles.submitButton}
      >
        Submit
      </Button>

      <CreateUserModal
        visible={modalVisible}
        onClose={handleCloseModal}
        fields={modalFields}
        title={modalTitle}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default RequestContactInformation;
