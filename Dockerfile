FROM node:24-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY . .

# RUN npm install
RUN pnpm install
RUN pnpm run build

EXPOSE ${PORT}

CMD ["pnpm", "start"]