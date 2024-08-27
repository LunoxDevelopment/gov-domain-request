import React from 'react';
import styles from '@/styles/Breadcrumbs.module.css';
import { OrganizationIcon, DomainIcon, ContactIcon, DNSIcon, FormIcon } from './Icons';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

const steps = [
  { icon: <OrganizationIcon />, label: 'Select Organization' },
  { icon: <DomainIcon />, label: 'Add Domain(s)' },
  { icon: <ContactIcon />, label: 'Contact Information' },
  { icon: <DNSIcon />, label: 'DNS Record(s)' },
  { icon: <FormIcon />, label: 'Process Forms & Submit' },
];

interface RegistrationBreadcrumbProps {
  currentStep: number;
}

const RegistrationBreadcrumb: React.FC<RegistrationBreadcrumbProps> = ({ currentStep }) => {
  return (
    <div className={styles.breadcrumbs}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className={`${styles.breadcrumbItem} ${index === currentStep ? styles.active : ''}`}>
            {step.icon}
            <span>{step.label}</span>
          </div>
          {index < steps.length - 1 && <ChevronRightIcon className={styles.separator} />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default RegistrationBreadcrumb;
