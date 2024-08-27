import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Collapse,
  Typography,
} from '@mui/material';

interface CreateUserModalProps {
  visible: boolean;
  onClose: () => void;
  fields: {
    fullName: boolean;
    mobile?: boolean;
    email?: boolean;
    optionalEmployee?: boolean;
    nic?: boolean;
    designation?: boolean;
    auth?: boolean;
  };
  title: string;
  onSubmit: (userData: any) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ visible, onClose, fields, title, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [showEmployeeFields, setShowEmployeeFields] = useState(false);
  const [errorMessages, setErrorMessages] = useState<{ [key: string]: string }>({});
  const [formValues, setFormValues] = useState<{
    fullName: string;
    email?: string;
    mobile?: string;
    nic?: string;
    employee?: boolean;
    designation?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({
    fullName: '',
    email: '',
    mobile: '',
    nic: '',
    employee: false,
    designation: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (fields.auth) {
      setFormValues((prev) => ({ ...prev, auth: true }));
    }
  }, [fields]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrorMessages((prev) => ({
      ...prev,
      [name]: '', // Clear error message for the field
    }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: checked,
    }));
    if (name === 'employee') {
      setShowEmployeeFields(checked);
    }
  };

  const validateForm = () => {
    let errors: { [key: string]: string } = {};

    if (!formValues.fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }

    if (fields.email && formValues.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formValues.email)) {
        errors.email = 'Invalid email format';
      }
    }

    if (fields.auth) {
      if (!formValues.password || formValues.password !== formValues.confirmPassword) {
        errors.password = 'Passwords do not match';
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrorMessages(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFinish = async () => {
    if (!validateForm()) return;

    setLoading(true);

    const userPayload: any = {
      fullName: formValues.fullName,
      ...(fields.email && { email: formValues.email }),
      ...(fields.mobile && { mobile: formValues.mobile }),
      ...(fields.nic && formValues.nic && { nic: formValues.nic }),
      ...(fields.designation && formValues.designation && { designation: formValues.designation }),
    };

    try {
      const { data: userData } = await axios.post('/api/user/create', userPayload);
      if (userData.success) {
        if (fields.auth) {
          const authPayload = {
            username: formValues.username,
            password: formValues.password,
            userId: userData.data.id,
          };
          await axios.post('/api/auth/register', authPayload);
        }
        onSubmit(userData.data); // Return the newly created user data
        setFormValues({
          fullName: '',
          email: '',
          mobile: '',
          nic: '',
          employee: false,
          designation: '',
          username: '',
          password: '',
          confirmPassword: '',
        });
        onClose();
      } else {
        setErrorMessages({ apiError: userData.msg || 'An error occurred' });
      }
    } catch (error: any) {
      setErrorMessages({ apiError: error.response?.data?.msg || 'Failed to add user' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={visible} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {fields.fullName && (
          <TextField
            margin="dense"
            label="Full Name"
            name="fullName"
            fullWidth
            required
            error={!!errorMessages.fullName}
            helperText={errorMessages.fullName}
            value={formValues.fullName}
            onChange={handleChange}
          />
        )}
        {fields.email && (
          <TextField
            margin="dense"
            label="Email"
            name="email"
            type="email"
            fullWidth
            error={!!errorMessages.email}
            helperText={errorMessages.email}
            value={formValues.email}
            onChange={handleChange}
          />
        )}
        {fields.mobile && (
          <TextField
            margin="dense"
            label="Mobile"
            name="mobile"
            fullWidth
            value={formValues.mobile}
            onChange={handleChange}
          />
        )}
        {fields.optionalEmployee && (fields.nic || fields.designation) && (
          <FormControlLabel
            control={
              <Switch
                checked={formValues.employee}
                onChange={handleSwitchChange}
                name="employee"
                color="primary"
              />
            }
            label="Employee"
          />
        )}
        {(fields.nic || fields.designation) && !fields.optionalEmployee && (
          <>
            {fields.nic && (
              <TextField
                margin="dense"
                label="NIC"
                name="nic"
                fullWidth
                required
                value={formValues.nic}
                onChange={handleChange}
              />
            )}
            {fields.designation && (
              <TextField
                margin="dense"
                label="Designation"
                name="designation"
                fullWidth
                required
                value={formValues.designation}
                onChange={handleChange}
              />
            )}
          </>
        )}
        {fields.optionalEmployee && (
          <Collapse in={showEmployeeFields}>
            {fields.nic && (
              <TextField
                margin="dense"
                label="NIC"
                name="nic"
                fullWidth
                value={formValues.nic}
                onChange={handleChange}
              />
            )}
            {fields.designation && (
              <TextField
                margin="dense"
                label="Designation"
                name="designation"
                fullWidth
                value={formValues.designation}
                onChange={handleChange}
              />
            )}
          </Collapse>
        )}
        {fields.auth && (
          <>
            <TextField
              margin="dense"
              label="Username"
              name="username"
              fullWidth
              required
              value={formValues.username}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              label="Password"
              name="password"
              type="password"
              fullWidth
              required
              error={!!errorMessages.password}
              helperText={errorMessages.password}
              value={formValues.password}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              fullWidth
              required
              error={!!errorMessages.confirmPassword}
              helperText={errorMessages.confirmPassword}
              value={formValues.confirmPassword}
              onChange={handleChange}
            />
          </>
        )}
        {errorMessages.apiError && (
          <Typography color="error" variant="body2" gutterBottom>
            {errorMessages.apiError}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleFinish} disabled={loading}>
          Add User
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateUserModal;
