#!/bin/bash -xe

# Log all output
exec > >(tee /var/log/user-data.log) 2>&1

# Install dependencies
sudo apt update -y
sudo apt install mysql-client -y
sudo apt install git -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # Should return v18.x
npm -v   # Should return a valid version


# Clone the repository
cd /home/ubuntu
git clone https://github.com/tejasdurge55/slang-app.git

# Configure server
cd slang-app/simple-nodejs-slang-app

cat <<EOF > .env
DB_HOST=${db_instance_address}
DB_USER=slang_user
DB_PASSWORD=xxx
DB_NAME=slang_db
PORT=5000
GEMINI_API_KEY=${google_api_key}
EMAILJS_ACCESS_TOKEN=xxx
EOF



sudo npm install


# sudo sed -i "s/localhost/${db_instance_address}/g" .env
VM_IP=$(hostname -I | awk '{print $1}')
 
# Initialize database
mysql -h "${db_instance_address}" -u "${db_username}" -p"${db_password}"  <<MYSQL_SCRIPT

CREATE DATABASE slang_db;
CREATE USER 'slang_user'@'$VM_IP' IDENTIFIED BY 'Tejas&2012';
GRANT ALL PRIVILEGES ON slang_db.* TO 'slang_user'@'$VM_IP';
FLUSH PRIVILEGES;

USE slang_db;

CREATE TABLE slangs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  term VARCHAR(255) NOT NULL UNIQUE,
  meaning TEXT NOT NULL,
  count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO slangs (term, meaning) VALUES ('yeet', 'To throw something with force');

-- Insert multiple records
INSERT INTO slangs (term, meaning) VALUES 
  ('simp', 'Someone who does too much for a person they like'),
  ('cap', 'Lie or false statement'),
  ('based', 'Expressing approval for someone being authentic'),
  ('sus', 'Suspicious or shady behavior');

-- Verify insertion
SELECT * FROM slangs;



MYSQL_SCRIPT




node server.js &


while ! curl --silent --fail localhost:5000; do
  echo "Waiting for server to respond..."
  sleep 2  # Wait 2 seconds before retrying
done
echo "Server is up!"