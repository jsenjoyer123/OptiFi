# SSL Certificates

Place your issued certificate files here when deploying manually with existing SSL material.

Expected file names:
- `fullchain.pem` – combined server certificate and intermediate chain
- `privkey.pem` – private key for the domain certificate

These files are ignored by Git via the accompanying `.gitignore`. Copy them onto the server at `/opt/optifi/deploy/certs/` (or another secure path) and reference them from the Nginx configuration.
