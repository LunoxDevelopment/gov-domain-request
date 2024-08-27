import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLandmark, faGlobe, faAddressCard, faServer, faFileSignature } from '@fortawesome/free-solid-svg-icons';

export const OrganizationIcon: React.FC = () => (
  <FontAwesomeIcon icon={faLandmark} />
);

export const DomainIcon: React.FC = () => (
  <FontAwesomeIcon icon={faGlobe} />
);

export const ContactIcon: React.FC = () => (
  <FontAwesomeIcon icon={faAddressCard} />
);

export const DNSIcon: React.FC = () => (
  <FontAwesomeIcon icon={faServer} />
);

export const FormIcon: React.FC = () => (
  <FontAwesomeIcon icon={faFileSignature} />
);
