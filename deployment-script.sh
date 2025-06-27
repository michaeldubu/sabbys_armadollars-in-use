#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Update system packages
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo "Installing required packages..."
sudo apt-get install -y curl git nginx

# Install Node.js 18 LTS
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
echo "Verifying installations..."
node --version
npm --version

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Clone the repository
echo "Cloning the repository..."
git clone https://github.com/michaeldubu/Armadollars.git
cd Armadollars

# Install project dependencies
echo "Installing project dependencies..."
npm install

# Build the Next.js application
echo "Building the application..."
npm run build

# Create environment file
echo "Setting up environment variables..."
cat << EOF > .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
# Add other environment variables as needed
EOF

# Set up Nginx
echo "Setting up Nginx..."
sudo tee /etc/nginx/sites-available/armadollars << EOF
server {
    listen 80;
    server_name ayasal.cc;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/armadollars /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL with Certbot
echo "Setting up SSL with Let's Encrypt..."
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d ayasal.cc --non-interactive --agree-tos --email your-email@example.com

# Start the application with PM2
echo "Starting the application with PM2..."
pm2 start npm --name "armadollars" -- start

# Save PM2 process list and configure to start on system boot
pm2 save
pm2 startup

echo "Setup and deployment complete!"
echo "Your Andy's Armadollars application should now be running at https://ayasal.cc"
