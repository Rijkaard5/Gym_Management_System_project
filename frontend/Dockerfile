FROM nginx:alpine

COPY public /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Address of the backend service (override in Dokploy if your
# backend is reachable at a different host/port)
ENV BACKEND_URL=http://62.171.174.37:10000

EXPOSE 5211
