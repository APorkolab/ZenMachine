# Base image
FROM nginx:alpine

# Copy static files to the nginx html directory
COPY . /usr/share/nginx/html

# Expose the default port
EXPOSE 80
