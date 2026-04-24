# 🚀 Deployment Guide

## Option 1: Deployment ใน Vercel (Recommended)

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub/GitLab/Bitbucket
3. Import your repository

### Step 2: Setup Environment Variables
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_LINE_CHANNEL_ID
   NEXT_PUBLIC_GOOGLE_CLIENT_ID
   NEXT_PUBLIC_FACEBOOK_PAGE_URL
   NEXT_PUBLIC_APP_URL
   ```

### Step 3: Configure Supabase
1. Update OAuth redirect URIs:
   - Google: `https://your-domain.vercel.app/auth/callback`
   - LINE: `https://your-domain.vercel.app/auth/callback`

### Step 4: Deploy
```bash
git push to main branch
```
Vercel automatically builds and deploys!

---

## Option 2: Self-Hosted (VPS/Docker)

### Prerequisites
- Node.js 18+
- Docker (optional)
- Nginx/Apache for reverse proxy
- SSL certificate (Let's Encrypt)

### Step 1: Setup Server
```bash
# SSH into server
ssh root@your-server-ip

# Install Node.js
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone <your-repo-url>
cd fe-mhaina
```

### Step 2: Install Dependencies
```bash
npm install
npm run build
```

### Step 3: Run Production Server
```bash
npm start
```

### Step 4: Setup Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 5: Setup SSL
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

### Step 6: Use PM2 for Process Management
```bash
npm install -g pm2
pm2 start npm --name "fishing-app" -- start
pm2 startup
pm2 save
```

---

## Option 3: Docker Deployment

### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
```

### Build and Run
```bash
docker build -t fishing-app .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  fishing-app
```

---

## Environment Variables Checklist

Before deployment, ensure you have:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (backend only)
- [ ] `NEXT_PUBLIC_LINE_CHANNEL_ID` - LINE channel ID (if using LINE login)
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `NEXT_PUBLIC_FACEBOOK_PAGE_URL` - Your Facebook page URL
- [ ] `NEXT_PUBLIC_APP_URL` - Your app's URL (production domain)

---

## Post-Deployment Checklist

### 1. Verify Functionality
- [ ] Home page loads
- [ ] Authentication works (all providers)
- [ ] Map displays correctly
- [ ] Image upload works
- [ ] Database queries work

### 2. Security
- [ ] Enable HTTPS only
- [ ] Setup CORS properly
- [ ] Verify RLS policies on all tables
- [ ] Check storage bucket permissions

### 3. Performance
- [ ] Test page load speed
- [ ] Check image optimization
- [ ] Verify caching headers
- [ ] Monitor API response times

### 4. Monitoring
- [ ] Setup error logging (Sentry/LogRocket)
- [ ] Setup uptime monitoring
- [ ] Enable analytics
- [ ] Setup email alerts

### 5. Database Maintenance
- [ ] Backup database
- [ ] Setup automated backups
- [ ] Monitor storage usage
- [ ] Verify indexes

---

## Scaling Tips

1. **Database**: Consider read replicas for high traffic
2. **Storage**: Use CDN for images (Cloudflare, AWS CloudFront)
3. **Caching**: Implement Redis for session management
4. **Load Balancing**: Use Vercel's built-in load balancing
5. **Monitoring**: Use tools like Datadog or New Relic

---

## Troubleshooting Deployment

### Build Fails
```bash
# Clear build cache
rm -rf .next
npm install
npm run build
```

### Environment Variables Not Set
```bash
# Verify on server
echo $NEXT_PUBLIC_SUPABASE_URL
```

### Database Connection Issues
- Check firewall rules
- Verify IP whitelist in Supabase
- Test connection string locally

### SSL Certificate Issues
```bash
sudo certbot renew --dry-run
```

### Memory Issues
```bash
# Increase memory (Node.js)
NODE_OPTIONS=--max_old_space_size=2048 npm start
```

---

## Performance Optimization

### 1. Image Optimization ✓ (Already configured)
- Next.js Image component
- Automatic format conversion

### 2. Code Splitting ✓
- Dynamic imports
- Route-based splitting

### 3. Caching Strategy
- Next.js ISR (Incremental Static Regeneration)
- Client-side caching with Zustand

### 4. Database Optimization
- Indexed queries
- Connection pooling (Supabase)

---

## Monitoring & Analytics

### Add Google Analytics
```tsx
// In layout.tsx
import Script from 'next/script';

<Script
  strategy="afterInteractive"
  src={`https://www.googletagmanager.com/gtag/js?id=GA_ID`}
/>
```

### Add Error Tracking
```bash
npm install @sentry/nextjs
```

---

## Backup Strategy

1. **Database Backups**: Supabase automated backups
2. **File Backups**: Regular storage snapshots
3. **Code Backups**: Git repository (GitHub)
4. **Recovery Plan**: Document restore procedures

---

## Support & Maintenance

### Regular Tasks
- [ ] Weekly: Check error logs
- [ ] Monthly: Review analytics
- [ ] Quarterly: Security audit
- [ ] Yearly: Performance review

### Update Schedule
- Next.js: Quarterly
- Dependencies: Monthly
- Security patches: Immediately

---

## Cost Estimation

### Vercel
- $0-20/month (most apps)
- Free tier with generous limits

### Supabase
- $0-100/month
- Free tier with 1GB storage + 500K rows

### Total Estimated: $0-120/month

---

## Rollback Procedure

### Vercel
1. Go to Deployments
2. Click the previous version
3. Click "Redeploy"

### Self-Hosted
```bash
git revert <commit-hash>
npm run build
pm2 restart fishing-app
```

---

Have questions? Check the [QUICKSTART.md](QUICKSTART.md) or contact support!
