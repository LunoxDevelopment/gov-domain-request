# GOV Domain Request Application

This repository contains the GOV Domain Request application, a tool designed to manage domain requests for `.gov.lk` domains through integration with the GOV LK API.

## Requirements

To run this application, ensure you have the following:

- **Linux Environment**: The application is designed to run on a Linux system.
- **PostgreSQL Database**: Required for storing application data.
- **SMTP Server**: Necessary for sending email notifications.
- **Access to the GOV LK API**: For interacting with the registrar's services.

## Installation Guide

### 1. Clone the Repository

Start by cloning the repository to your local machine using the following command:

```bash
git clone https://github.com/LunoxDevelopment/gov-domain-request.git
cd gov-domain-request
```

### 2. Install PostgreSQL

If PostgreSQL is not installed on your system, install it using the appropriate package manager. For example, on Ubuntu:

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

### 3. Setup PostgreSQL

1. **Create a PostgreSQL User**:

   Replace `DBUSER` with your preferred username:

   ```bash
   sudo -u postgres createuser --interactive --pwprompt DBUSER
   ```

2. **Create a Database**:

   Replace `DBNAME` with your preferred database name:

   ```bash
   sudo -u postgres createdb DBNAME -O DBUSER
   ```

### 4. Configure the Application

Create a `.env` file in the root of the repository by copying the `.env.example` file:

```bash
cp .env.example .env
```

Edit the `.env` file and replace the placeholder values with your actual configuration:

```env
DATABASE_URL="postgresql://DBUSER:DBPASS@localhost:5432/DBNAME?schema=public"
NODE_TLS_REJECT_UNAUTHORIZED=0

NEXTAUTH_URL=http://localhost:3002
SECRET=<RANDOM_STRING>
JWT_SECRET=<RANDOM_STRING>

GOV_API_HOST=https://api.registrar.gov.lk
GOV_LK_HOST=http://registrar.gov.lk

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
UPLOAD_NOTIFY_EMAIL=example@email.com
```

- Replace `DBUSER`, `DBPASS`, and `DBNAME` with your PostgreSQL user, password, and database name.
- Replace `<RANDOM_STRING>` with a securely generated random string for authentication purposes.
- Configure the SMTP settings with your email service details.

### 5. Generate Prisma Client

Run the following command to generate the Prisma client based on your database schema:

```bash
npx prisma generate
```

### 6. Database Default Data Setup

To set up the initial data in your database, run the following SQL script against the database you created:

```sql
-- Insert records into dns_type table if they do not exist
DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dns_type WHERE name = 'A') THEN
        INSERT INTO dns_type (name, description, table_name, tip, warn)
        VALUES ('A', 'Maps a domain to an IPv4 address.', 'dns_a_record', '', '');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM dns_type WHERE name = 'AAA') THEN
        INSERT INTO dns_type (name, description, table_name, tip, warn)
        VALUES ('AAA', 'Maps a domain to an IPv6 address.', 'dns_aaaa_record', '', '');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM dns_type WHERE name = 'CNAME') THEN
        INSERT INTO dns_type (name, description, table_name, tip, warn)
        VALUES ('CNAME', 'Aliases one domain name to another.', 'dns_cname_record', '', '');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM dns_type WHERE name = 'TXT') THEN
        INSERT INTO dns_type (name, description, table_name, tip, warn)
        VALUES ('TXT', 'Holds text information.', 'dns_txt_record', '', '');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM dns_type WHERE name = 'PTR') THEN
        INSERT INTO dns_type (name, description, table_name, tip, warn)
        VALUES ('PTR', 'Maps an IP address to a domain (reverse DNS).', 'dns_ptr_record', '', '');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM dns_type WHERE name = 'NS') THEN
        INSERT INTO dns_type (name, description, table_name, tip, warn)
        VALUES ('NS', 'Nameserver record.', 'dns_ns_record', '', '');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM dns_type WHERE name = 'MX') THEN
        INSERT INTO dns_type (name, description, table_name, tip, warn)
        VALUES ('MX', 'Mail exchange record.', 'dns_mx_record', '', '');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM dns_type WHERE name = 'SOA') THEN
        INSERT INTO dns_type (name, description, table_name, tip, warn)
        VALUES ('SOA', 'Start of Authority, holds admin info.', 'dns_soa_record', '', '');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM dns_type WHERE name = 'CCA') THEN
        INSERT INTO dns_type (name, description, table_name, tip, warn)
        VALUES ('CCA', 'Certification Authority Authorization.', 'cca_record', '', '');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM dns_type WHERE name = 'SRV') THEN
        INSERT INTO dns_type (name, description, table_name, tip, warn)
        VALUES ('SRV', 'Service locator, general service record.', 'dns_srv_record', '', '');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM dns_type WHERE name = 'OTHER') THEN
        INSERT INTO dns_type (name, description, table_name, tip, warn)
        VALUES ('OTHER', 'Custom DNS Record', 'dns_other_record', '', '');
    END IF;

END
$$;

-- Insert records into request_status table if they do not exist
DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM request_status WHERE name = 'Request Created') THEN
        INSERT INTO request_status (name, description, level, progress)
        VALUES ('Request Created', 'User has created a request', 1, 10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM request_status WHERE name = 'Added Domains') THEN
        INSERT INTO request_status (name, description, level, progress)
        VALUES ('Added Domains', 'User has added domains to the request', 2, 20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM request_status WHERE name = 'Added Contacts') THEN
        INSERT INTO request_status (name, description, level, progress)
        VALUES ('Added Contacts', 'User has added contacts to the request', 3, 30);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM request_status WHERE name = 'Added DNS Records') THEN
        INSERT INTO request_status (name, description, level, progress)
        VALUES ('Added DNS Records', 'User has added DNS Records to the request', 4, 40);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM request_status WHERE name = 'Generated Forms') THEN
        INSERT INTO request_status (name, description, level, progress)
        VALUES ('Generated Forms', 'User has generated the Forms', 5, 50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM request_status WHERE name = 'Uploaded Forms') THEN
        INSERT INTO request_status (name, description, level, progress)
        VALUES ('Uploaded Forms', 'User has Uploaded the Certified Forms', 6, 60);
    END IF;

END
$$;
```

This will ensure that the required default data is present in your database.

## Running the Application

Once everything is set up, you can start the application by running:

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3002`.

## Contributing

If you wish to contribute to this project, please follow the [contribution guidelines](CONTRIBUTING.md) provided in this repository.

## License

Do not replicate the system implementation without permission of ICTA, Source code is available for public just for information purposes.
