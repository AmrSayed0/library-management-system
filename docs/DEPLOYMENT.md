# Deployment Guide

This guide covers deploying the Library Management System API to various environments including production servers, cloud platforms, and containerized environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Production Environment Setup](#production-environment-setup)
- [Docker Deployment](#docker-deployment)
- [Cloud Platform Deployment](#cloud-platform-deployment)
- [Environment Configuration](#environment-configuration)
- [Security Hardening](#security-hardening)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [CI/CD Pipeline](#cicd-pipeline)

## Prerequisites

### System Requirements

**Minimum Requirements:**

- 2 CPU cores
- 4GB RAM
- 20GB storage
- Ubuntu 20.04+ / CentOS 8+ / RHEL 8+

**Recommended Requirements:**

- 4 CPU cores
- 8GB RAM
- 50GB SSD storage
- Load balancer (for high availability)

### Software Dependencies

- Node.js 18.x or higher
- PostgreSQL 13+ or 15+ (recommended)
- PM2 (for process management)
- Nginx (reverse proxy)
- SSL certificates (Let's Encrypt recommended)

## Production Environment Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create production database
CREATE DATABASE library_management_prod;
CREATE USER library_prod_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE library_management_prod TO library_prod_user;

# Configure PostgreSQL for production
sudo nano /etc/postgresql/14/main/postgresql.conf
```

**PostgreSQL Production Configuration:**

```conf
# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Connections
max_connections = 100

# WAL
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Logging
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
```

### 3. Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/library-management
sudo chown $USER:$USER /var/www/library-management

# Clone repository
cd /var/www/library-management
git clone https://github.com/AmrSayed0/library-management-system.git

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Set up environment variables
cp .env.example .env.production
nano .env.production
```

### 4. PM2 Configuration

Create PM2 ecosystem file:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "library-management-api",
      script: "dist/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      max_memory_restart: "1G",
      watch: false,
      ignore_watch: ["node_modules", "logs"],
    },
  ],
};
```

```bash
# Create logs directory
mkdir logs

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
```

### 5. Nginx Configuration

```nginx
# /etc/nginx/sites-available/library-management
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no rate limiting)
    location /api/v1/health {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (if any)
    location /static/ {
        alias /var/www/library-management/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/library-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Docker Deployment

### 1. Production Dockerfile

```dockerfile
# Production Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

USER nodejs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/index.js"]
```

### 2. Production Docker Compose

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: library_api_prod
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - library_network
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:3001/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })",
        ]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    container_name: library_postgres_prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/backup:/backup
    networks:
      - library_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: library_nginx_prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/sites:/etc/nginx/conf.d
      - ./ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
    networks:
      - library_network

networks:
  library_network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

### 3. Deploy with Docker

```bash
# Create production environment file
cp .env.example .env.prod

# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f app

# Scale application (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

## Cloud Platform Deployment

### AWS Deployment (EC2 + RDS)

#### 1. RDS Setup

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
    --db-name library_management \
    --db-instance-identifier library-management-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username admin \
    --master-user-password your-strong-password \
    --allocated-storage 20 \
    --vpc-security-group-ids sg-xxxxxx \
    --backup-retention-period 7 \
    --multi-az \
    --storage-encrypted
```

#### 2. EC2 Deployment

```bash
# Launch EC2 instance
aws ec2 run-instances \
    --image-id ami-0c55b159cbfafe1d0 \
    --count 1 \
    --instance-type t3.medium \
    --key-name your-key-pair \
    --security-group-ids sg-xxxxxx \
    --subnet-id subnet-xxxxxx \
    --user-data file://user-data.sh
```

#### 3. Application Load Balancer

```bash
# Create target group
aws elbv2 create-target-group \
    --name library-management-targets \
    --protocol HTTP \
    --port 3001 \
    --vpc-id vpc-xxxxxx \
    --health-check-path /api/v1/health

# Create load balancer
aws elbv2 create-load-balancer \
    --name library-management-alb \
    --subnets subnet-xxxxxx subnet-yyyyyy \
    --security-groups sg-xxxxxx
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: library-management-api
services:
  - name: api
    source_dir: /
    github:
      repo: your-username/library-management-backend
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 2
    instance_size_slug: basic-xxs
    env:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        type: SECRET
      - key: JWT_SECRET
        type: SECRET
    http_port: 3001
    health_check:
      http_path: /api/v1/health
databases:
  - name: library-postgres
    engine: PG
    version: "15"
    size: basic-xs
    num_nodes: 1
```

### Heroku Deployment

```bash
# Install Heroku CLI and login
heroku login

# Create application
heroku create library-management-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-jwt-secret

# Deploy
git push heroku main

# Run migrations
heroku run npm run prisma:migrate
```

## Environment Configuration

### Production Environment Variables

```env
# Application
NODE_ENV=production
PORT=3001
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/library_management_prod

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# Rate Limiting
BORROWING_RATE_LIMIT=10
EXPORT_RATE_LIMIT=5
GLOBAL_RATE_LIMIT=100

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/library-management/app.log

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090

# Email (if implemented)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASS=your-smtp-password
```

### Configuration Management

```javascript
// src/config/index.ts
import dotenv from 'dotenv';

// Load environment-specific config
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });

export const config = {
  app: {
    port: parseInt(process.env.PORT || '3001'),
    env: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1'
  },
  database: {
    url: process.env.DATABASE_URL!,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000')
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },
  rateLimit: {
    borrowing: parseInt(process.env.BORROWING_RATE_LIMIT || '10'),
    export: parseInt(process.env.EXPORT_RATE_LIMIT || '5'),
    global: parseInt(process.env.GLOBAL_RATE_LIMIT || '100')
  }
};
```

## Security Hardening

### 1. Server Security

```bash
# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
sudo systemctl restart ssh

# Install fail2ban
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

### 2. Database Security

```sql
-- Create read-only user for monitoring
CREATE USER library_monitor WITH PASSWORD 'monitor_password';
GRANT CONNECT ON DATABASE library_management_prod TO library_monitor;
GRANT USAGE ON SCHEMA public TO library_monitor;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO library_monitor;

-- Revoke unnecessary permissions
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO library_prod_user;
```

### 3. Application Security

```javascript
// Additional security middleware
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many login attempts, please try again later",
});

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // allow 5 requests per windowMs without delay
  delayMs: 500, // add 500ms delay per request after delayAfter
});

app.use("/api/v1/auth", authLimiter);
app.use(speedLimiter);
```

## Monitoring and Logging

### 1. Application Monitoring

```javascript
// src/middleware/monitoring.ts
import { Request, Response, NextFunction } from "express";
import { performance } from "perf_hooks";

export const requestMonitoring = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = performance.now();

  res.on("finish", () => {
    const duration = performance.now() - start;
    console.log(
      `${req.method} ${req.url} - ${res.statusCode} - ${duration.toFixed(2)}ms`
    );
  });

  next();
};
```

### 2. Health Checks

```javascript
// src/routes/health.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/health", async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check memory usage
    const memUsage = process.memoryUsage();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      },
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    });
  }
});

export default router;
```

### 3. Logging Configuration

```javascript
// src/utils/logger.ts
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "library-management-api" },
  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export { logger };
```

## Backup and Recovery

### 1. Database Backup Script

```bash
#!/bin/bash
# backup-database.sh

DB_NAME="library_management_prod"
DB_USER="library_prod_user"
BACKUP_DIR="/var/backups/library-management"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### 2. Automated Backup Cron

```bash
# Add to crontab (crontab -e)
# Backup database daily at 2 AM
0 2 * * * /var/www/library-management/scripts/backup-database.sh >> /var/log/backup.log 2>&1

# Backup application files weekly
0 3 * * 0 tar -czf /var/backups/library-management/app_backup_$(date +\%Y\%m\%d).tar.gz /var/www/library-management --exclude=node_modules --exclude=logs
```

### 3. Recovery Procedures

```bash
# Restore from backup
gunzip -c /var/backups/library-management/backup_20231201_020000.sql.gz | psql -h localhost -U library_prod_user -d library_management_prod

# Point-in-time recovery (if WAL archiving is enabled)
pg_basebackup -h localhost -U library_prod_user -D /var/lib/postgresql/recovery -P -W
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/library-management
            git pull origin main
            npm ci --only=production
            npm run build
            pm2 restart library-management-api
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Monitoring and logging enabled
- [ ] Backup procedures tested
- [ ] Health checks passing
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] Documentation updated

## Troubleshooting

### Common Deployment Issues

1. **Port already in use**

   ```bash
   sudo lsof -i :3001
   sudo kill -9 <PID>
   ```

2. **Database connection failed**

   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql

   # Check connection string
   psql $DATABASE_URL
   ```

3. **PM2 application not starting**

   ```bash
   # Check PM2 logs
   pm2 logs library-management-api

   # Restart application
   pm2 restart library-management-api
   ```

4. **Nginx configuration issues**

   ```bash
   # Test configuration
   sudo nginx -t

   # Check error logs
   sudo tail -f /var/log/nginx/error.log
   ```

### Performance Optimization

1. **Enable compression**

   - Gzip compression in Nginx
   - Response compression in Express

2. **Database optimization**

   - Connection pooling
   - Query optimization
   - Index tuning

3. **Caching strategies**

   - Redis for session storage
   - CDN for static assets
   - Database query caching

4. **Load balancing**
   - Multiple application instances
   - Database read replicas
   - Horizontal scaling

This deployment guide provides Detailed coverage for deploying the Library Management System API in production environments with security, monitoring, and reliability best practices.
