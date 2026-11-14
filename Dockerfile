FROM node:22.23.4-bookworm-slim
WORKDIR /app
COPY index.html landing.html ./
COPY src ./src
COPY assets ./assets
COPY server ./server
EXPOSE 8080
ENV PORT=8080
USER node
CMD ["node", "server/relay.mjs"]
