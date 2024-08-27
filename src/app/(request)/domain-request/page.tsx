"use client";

import { useState } from 'react';
import { Typography } from '@mui/material';
import RegistrationBreadcrumb from '@/components/Breadcrumbs';
import SelectOrganization from '@/components/SelectOrganization';
import AddDomains from '@/components/AddDomains';
import RequestContactInformation from '@/components/RequestContactInformation';
import RequestDNS from '@/components/RequestDNS';
import RequestProcess from '@/components/RequestProcess';
import RequestForms from '@/components/RequestForms';

const DomainRequestPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [requestData, setRequestData] = useState<{ id: string, token: string } | null>(null);
  const [addedDomains, setAddedDomains] = useState<string[]>([]);
  const [contactInfo, setContactInfo] = useState<{ name: string, email: string, phone: string } | null>(null);

  const handleOrganizationSelect = (organization: any, requestData: { id: string, token: string }) => {
    setSelectedOrganization(organization);
    setRequestData(requestData);
    localStorage.setItem('selectedOrganization', JSON.stringify(organization));
    localStorage.setItem('requestData', JSON.stringify(requestData));
    setCurrentStep(1);
  };

  const handleDomainsSubmit = (domains: string[]) => {
    setAddedDomains(domains);
  };

  const handleContactSubmit = (contactInfo: any) => {
    setContactInfo(contactInfo);
    setCurrentStep(3); // Proceed to the next step
  };

  const handleProceed = () => {
    setCurrentStep(2);
  };

  const handleDNSRecordsSuccess = () => {
    setCurrentStep(4); // Proceed to the next step
  };

  const handleFormsGenerated = () => {
    setCurrentStep(5); // Proceed to the final step
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      <RegistrationBreadcrumb currentStep={currentStep} />
      {currentStep === 0 && (
        <SelectOrganization onOrganizationSelect={handleOrganizationSelect} />
      )}
      {currentStep === 1 && requestData && (
        <div>
          <AddDomains
            organization={selectedOrganization}
            requestData={requestData}
            onDomainsSubmit={handleDomainsSubmit}
            onProceed={handleProceed}
          />
        </div>
      )}
      {currentStep === 2 && requestData && (
        <RequestContactInformation
          requestData={requestData}
          onContactSubmit={handleContactSubmit}
        />
      )}
      {currentStep === 3 && requestData && (
        <RequestDNS
          requestData={requestData}
          contactInfo={contactInfo}
          onSuccess={handleDNSRecordsSuccess}
        />
      )}
      {currentStep === 4 && requestData && (
        <RequestProcess requestData={requestData} onFormsGenerated={handleFormsGenerated} />
      )}
      {currentStep === 5 && requestData && (
        <RequestForms requestData={requestData} />
      )}
    </div>
  );
};

export default DomainRequestPage;
