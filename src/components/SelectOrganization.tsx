import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { fetchCategories, fetchDistricts, fetchProvinces, fetchOrganizations } from '@/utils/api';
import { Box, FormControl, InputLabel, MenuItem, Select, TextField, Button, CircularProgress, Card, CardContent, Typography, Chip, Menu } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import debounce from 'lodash.debounce';
import styles from '@/styles/SelectOrganization.module.css';

interface SelectOrganizationProps {
  onFilterChange?: (filters: { category: string; district: string; province: string }) => void;
  onOrganizationSelect?: (organization: any, requestData: { id: string, token: string }) => void;
}

interface Organization {
  site_code: string;
  name: string;
}

const SelectOrganization: React.FC<SelectOrganizationProps> = ({ onFilterChange, onOrganizationSelect }) => {
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const prevFiltersRef = useRef({ category: '', district: '', province: '' });

  const debouncedFetchOrganizations = useMemo(
    () => debounce(async (searchTerm: string, filterParams: { category: string; district: string; province: string }) => {
      console.log('Debounced Fetch:', searchTerm, filterParams); // Debug log
      if (searchTerm.length >= 1) {
        setIsLoading(true);
        try {
          const response = await fetchOrganizations({ search: searchTerm, ...filterParams });
          const newOrganizations = response.data;

          setOrganizations((prevOrganizations) => {
            if (JSON.stringify(newOrganizations) !== JSON.stringify(prevOrganizations)) {
              return newOrganizations;
            }
            return prevOrganizations;
          });

          setHasSearched(true);
        } catch (error) {
          console.error('Error fetching organizations:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setOrganizations([]);
        setHasSearched(false);
        setIsLoading(false);
      }
    }, 500),
    []
  );

  const fetchData = useCallback(
    (searchTerm: string, filterParams: { category: string; district: string; province: string }) => {
      console.log('Fetch Data:', searchTerm, filterParams); // Debug log
      if (searchTerm.length === 0) {
        setOrganizations([]);
        setHasSearched(false);
        setIsLoading(false);
        return;
      }
      debouncedFetchOrganizations(searchTerm, filterParams);
    },
    [debouncedFetchOrganizations]
  );

  useEffect(() => {
    async function fetchData() {
      const categories = await fetchCategories();
      setCategories(categories.data);
      const districts = await fetchDistricts();
      setDistricts(districts.data);
      const provinces = await fetchProvinces();
      setProvinces(provinces.data);
    }
    fetchData();
  }, []);

  useEffect(() => {
    const currentFilters = { category: selectedCategory, district: selectedDistrict, province: selectedProvince };
    if (JSON.stringify(prevFiltersRef.current) !== JSON.stringify(currentFilters)) {
      prevFiltersRef.current = currentFilters;
      onFilterChange?.(currentFilters);
      fetchData(search, currentFilters);
    }
  }, [selectedCategory, selectedDistrict, selectedProvince, fetchData, search, onFilterChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    fetchData(e.target.value, prevFiltersRef.current);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRemoveFilter = (filterType: string) => {
    if (filterType === 'category') setSelectedCategory('');
    if (filterType === 'district') setSelectedDistrict('');
    if (filterType === 'province') setSelectedProvince('');
  };

  const handleOrganizationClick = async (organization: Organization) => {
    try {
      const response = await fetch('/api/request/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ site_code: organization.site_code }),
      });

      const result = await response.json();

      if (result.success) {
        const { id, token } = result.data;
        onOrganizationSelect?.(organization, { id, token });
      } else {
        console.error('Failed to create request:', result.msg);
      }
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  return (
    <div className={styles.filterMenu}>
      <div className={styles.filterCard} />
      <div className={styles.filterContainer}>
        <TextField
          className={styles.filterInput}
          label="Search Organization"
          value={search}
          onChange={handleSearchChange}
        />
        <Button variant="contained" onClick={handleMenuOpen}>
          + Filter
        </Button>
      </div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {selectedCategory && (
          <Chip
            label={`Category: ${selectedCategory}`}
            onDelete={() => handleRemoveFilter('category')}
            deleteIcon={<CloseIcon />}
          />
        )}
        {selectedDistrict && (
          <Chip
            label={`District: ${selectedDistrict}`}
            onDelete={() => handleRemoveFilter('district')}
            deleteIcon={<CloseIcon />}
          />
        )}
        {selectedProvince && (
          <Chip
            label={`Province: ${selectedProvince}`}
            onDelete={() => handleRemoveFilter('province')}
            deleteIcon={<CloseIcon />}
          />
        )}
      </div>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        PaperProps={{
          style: {
            width: '90%',
            maxWidth: '500px',
          },
        }}
      >
        <Box padding="10px">
          <FormControl fullWidth size="small" margin="dense" className={styles.filterGroup}>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {categories.map((category: any) => (
                <MenuItem key={category.id} value={category.name}>{category.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" margin="dense" className={styles.filterGroup}>
            <InputLabel id="district-label">District</InputLabel>
            <Select
              labelId="district-label"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {districts.map((district: any) => (
                <MenuItem key={district.id} value={district.name}>{district.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" margin="dense" className={styles.filterGroup}>
            <InputLabel id="province-label">Province</InputLabel>
            <Select
              labelId="province-label"
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {provinces.map((province: any) => (
                <MenuItem key={province.id} value={province.name}>{province.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Menu>
      <div style={{ marginTop: '10px', position: 'relative' }}>
        {isLoading && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <CircularProgress />
          </div>
        )}
        <div className={styles.organizationGrid} style={{ opacity: isLoading ? 0.5 : 1 }}>
          {hasSearched && organizations.length === 0 && !isLoading ? (
            <Typography>No organizations found. Please contact the Network Operation Center Helpdesk to add your organization.</Typography>
          ) : (
            organizations.map((organization) => (
              <Card
                key={organization.site_code}
                className={styles.organizationCard}
                onClick={() => handleOrganizationClick(organization)}
              >
                <CardContent>
                  <Typography variant="h6">{organization.name}</Typography>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectOrganization;
