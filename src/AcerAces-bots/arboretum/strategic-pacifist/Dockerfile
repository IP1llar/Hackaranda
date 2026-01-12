FROM node:20-slim AS build


WORKDIR /bot
# Install the Javascript dependencies, including all devDependencies.
COPY package.json .
RUN npm install

# Copy the rest of the application in and build it.
COPY . .
# RUN npm build
RUN npx tsc -p ./tsconfig.json

# Now /usr/src/app/dist has the built files.

# Second stage: run things.
FROM node:20-slim
WORKDIR /bot

# (Install OS dependencies; just libraries.)

# Install the Javascript dependencies, only runtime libraries.
COPY package.json .
RUN npm install --production

# Copy the dist tree from the first stage.
COPY --from=build /bot/dist dist

# Run the built application when the container starts.
CMD ["node", "dist/index.js"]
