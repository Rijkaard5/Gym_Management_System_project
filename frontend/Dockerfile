FROM nginx:alpine

COPY public /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Internal address of the backend service (override in Dokploy if your
# backend service has a different name/port, e.g. http://backend:10000)
ENV BACKEND_URL=http://backend:10000

EXPOSE 5211
