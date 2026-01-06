FROM pandoc/extra
RUN apk add --no-cache bash curl nodejs npm git
RUN echo node `node -v` && \
  echo npm v`npm -v` && \
  echo `git --version` && \
  echo `pandoc --version | head -1`
RUN mkdir -p /work/uploads
COPY . /work
RUN chmod 755 /work/uploads
RUN cd /work && npm ci
RUN cd /work && npm run build
CMD cd /work && npm run start
EXPOSE 3000
