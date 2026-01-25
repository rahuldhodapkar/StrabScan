# README

## Development Notes
Camera access requests will not be granted to iphone users when not
running on a server over HTTPS. The below is a quick `openssl`
snippet that creates a self-signed certificate for debugging. When
deploying to Github Pages, the github deployment system will take
care of the cerficates and enabling HTTPS by default

    openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes


